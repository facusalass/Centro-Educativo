import type { Request } from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.ts';
import { requireStudent, audit } from './security.ts';
import { publish } from './notifications.ts';

export const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
export function timeRange(value: unknown) {
  const match = String(value ?? '').match(/^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/);
  assert(match, 400, 'Usá un horario válido: HH:MM - HH:MM.');
  const [h1, m1, h2, m2] = match.slice(1).map(Number);
  assert(h1 <= 23 && h2 <= 23 && m1 <= 59 && m2 <= 59, 400, 'El horario está fuera de rango.');
  const start = h1 * 60 + m1,
    end = h2 * 60 + m2;
  assert(start < end, 400, 'La hora de finalización debe ser posterior al inicio.');
  return { start, end };
}
export function overlaps(a: Record<string, any>, b: Record<string, any>) {
  if (normalize(a.dia) !== normalize(b.dia)) return false;
  const x = timeRange(a.horario),
    y = timeRange(b.horario);
  return x.start < y.end && y.start < x.end;
}
export function validateSchedule(data: Record<string, any>) {
  const day = weekdays.find((d) => normalize(d) === normalize(String(data.dia || '')));
  assert(day, 400, 'Elegí un día válido de lunes a sábado.');
  data.dia = day;
  const range = timeRange(data.horario);
  const fmt = (n: number) =>
    `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  data.horario = `${fmt(range.start)} - ${fmt(range.end)}`;
}
type Context = { req: Request; alumno: any; data: any; grupo?: any; existing: any[] };
interface Handler {
  validate(context: Context): Promise<void>;
}
// Chain of Responsibility: each rule is independently testable and ordered.
const sportRules: Handler[] = [
  {
    async validate(c) {
      assert(['admin', 'padre'].includes(c.req.user!.rol), 403, 'No podés inscribir alumnos.');
    },
  },
  {
    async validate(c) {
      c.grupo = await db.get('SELECT * FROM grupos_deporte WHERE id = ?', [
        idOf(c.data.grupo_deporte_id),
      ]);
      assert(c.grupo, 404, 'Grupo deportivo no encontrado.');
      assert(c.grupo.nivel === c.alumno.nivel, 400, 'El grupo no corresponde al nivel del alumno.');
      assert(
        !c.existing.some((e) => e.deporte_id === c.grupo.deporte_id),
        409,
        'El alumno ya está inscripto en este deporte.',
      );
    },
  },
  {
    async validate(c) {
      assert(c.existing.length < 2, 409, 'El máximo es de dos deportes simultáneos por alumno.');
    },
  },
  {
    async validate(c) {
      validateSchedule(c.grupo);
      assert(
        !c.existing.some((e) => overlaps(e, c.grupo)),
        409,
        'La actividad se superpone con otro deporte del alumno.',
      );
      const count = await db.get(
        "SELECT COUNT(*) AS total FROM inscripciones WHERE grupo_deporte_id = ? AND estado = 'activo'",
        [c.grupo.id],
      );
      assert(
        Number(count.total) < c.grupo.cupo,
        409,
        'El grupo deportivo no tiene cupos disponibles.',
      );
    },
  },
];
export async function enroll(req: Request) {
  return db.transaction(async () => {
    const data = req.body;
    const alumno = await requireStudent(req, idOf(data.alumno_id));
    assert(alumno.estado === 'activo', 409, 'El alumno no está activo.');
    assert(
      ['deporte', 'transporte', 'comedor'].includes(data.tipo),
      400,
      'Seleccioná un servicio válido.',
    );
    const payload: Record<string, any> = {
      alumno_id: alumno.id,
      tipo: data.tipo,
      grupo_deporte_id: null,
      recorrido_id: null,
      estado: 'activo',
    };
    if (data.tipo === 'deporte') {
      const existing = await db.all(
        "SELECT g.*, i.id AS inscripcion_id FROM inscripciones i JOIN grupos_deporte g ON g.id = i.grupo_deporte_id WHERE i.alumno_id = ? AND i.tipo = 'deporte' AND i.estado = 'activo'",
        [alumno.id],
      );
      const ctx: Context = { req, alumno, data, existing };
      for (const rule of sportRules) await rule.validate(ctx);
      payload.grupo_deporte_id = ctx.grupo.id;
    } else {
      assert(
        !(await db.get(
          "SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = ? AND estado = 'activo'",
          [alumno.id, data.tipo],
        )),
        409,
        'El alumno ya tiene este servicio activo.',
      );
      if (data.tipo === 'transporte') {
        const route = await db.get('SELECT * FROM recorridos_transporte WHERE id = ?', [
          idOf(data.recorrido_id),
        ]);
        assert(route, 400, 'Elegí uno de los cuatro recorridos disponibles.');
        const count = await db.get(
          "SELECT COUNT(*) AS total FROM inscripciones WHERE recorrido_id = ? AND estado = 'activo'",
          [route.id],
        );
        assert(Number(count.total) < route.cupo, 409, 'El recorrido no tiene cupos disponibles.');
        payload.recorrido_id = route.id;
      }
    }
    const id = await db.insert('inscripciones', payload);
    await audit(req.user!.id, 'alta', 'inscripciones', id);
    await publish({
      alumno_id: alumno.id,
      titulo: 'Inscripción confirmada',
      mensaje: `Se confirmó la inscripción a ${data.tipo}.`,
    });
    return db.get('SELECT * FROM inscripciones WHERE id = ?', [id]);
  });
}
export async function cancelEnrollment(req: Request, value: unknown) {
  return db.transaction(async () => {
    const item = await db.get('SELECT * FROM inscripciones WHERE id = ?', [idOf(value)]);
    assert(item && item.estado === 'activo', 404, 'Inscripción activa no encontrada.');
    await requireStudent(req, item.alumno_id);
    if (req.params.alumnoId)
      assert(Number(req.params.alumnoId) === item.alumno_id, 404, 'Inscripción no encontrada.');
    await db.update('inscripciones', item.id, { estado: 'cancelado' });
    await audit(req.user!.id, 'cancelación', 'inscripciones', item.id);
    await publish({
      alumno_id: item.alumno_id,
      titulo: 'Inscripción cancelada',
      mensaje: `Se canceló el servicio de ${item.tipo}.`,
    });
    return { ok: true };
  });
}
export async function matriculate(req: Request) {
  return db.transaction(async () => {
    const alumno = await requireStudent(req, idOf(req.body.alumno_id));
    assert(alumno.estado === 'activo', 409, 'El alumno no está activo.');
    const curso = await db.get('SELECT * FROM cursos WHERE id = ?', [idOf(req.body.curso_id)]);
    const ciclo = Number(req.body.ciclo);
    assert(curso && curso.nivel === alumno.nivel, 400, 'Seleccioná un curso del nivel del alumno.');
    assert(
      Number.isInteger(ciclo) && ciclo >= 2026 && ciclo <= 2100,
      400,
      'El ciclo lectivo no es válido.',
    );
    assert(
      !(await db.get('SELECT id FROM matriculas WHERE alumno_id = ? AND ciclo = ?', [
        alumno.id,
        ciclo,
      ])),
      409,
      'El alumno ya tiene una matrícula para ese ciclo.',
    );
    const count = await db.get(
      "SELECT COUNT(*) AS total FROM matriculas WHERE curso_id = ? AND ciclo = ? AND estado = 'activo'",
      [curso.id, ciclo],
    );
    assert(Number(count.total) < curso.cupo, 409, 'El curso no tiene cupos disponibles.');
    const id = await db.insert('matriculas', {
      alumno_id: alumno.id,
      curso_id: curso.id,
      ciclo,
      fecha: new Date().toISOString(),
    });
    await db.update('alumnos', alumno.id, {
      curso_id: curso.id,
      curso: curso.anio,
      division: curso.division,
    });
    await audit(req.user!.id, 'matrícula', 'alumnos', alumno.id, String(ciclo));
    await publish({
      alumno_id: alumno.id,
      titulo: 'Matrícula confirmada',
      mensaje: `Inscripción al ciclo ${ciclo}: ${curso.anio} ${curso.division}.`,
    });
    return db.get('SELECT * FROM matriculas WHERE id = ?', [id]);
  });
}

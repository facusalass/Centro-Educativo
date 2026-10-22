import type { Express, Request } from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.ts';
import { audit } from './security.ts';
import { calendarDate, objectBody } from './validation.ts';

async function accessibleStudents(req: Request, ids?: number[]) {
  const conditions = ["a.estado = 'activo'"];
  const params: (string | number)[] = [];
  if (req.user!.rol === 'docente') {
    conditions.push(
      'EXISTS (SELECT 1 FROM asignaciones_docentes d WHERE d.curso_id = a.curso_id AND d.docente_id = ?)',
    );
    params.push(req.user!.referencia_id ?? 0);
  }
  if (ids) {
    conditions.push(`a.id IN (${ids.map(() => '?').join(', ')})`);
    params.push(...ids);
  } else {
    for (const field of ['nivel', 'curso', 'division'])
      if (req.query[field]) {
        conditions.push(`a.${field} = ?`);
        params.push(String(req.query[field]));
      }
  }
  return db.all(
    `SELECT a.* FROM alumnos a WHERE ${conditions.join(' AND ')} ORDER BY a.apellido, a.nombre`,
    params,
  );
}

export function registerAttendanceRoutes(app: Express) {
  app.get('/api/asistencias', async (req, res) => {
    const students = await accessibleStudents(req);
    const date = req.query.fecha ? calendarDate(req.query.fecha) : '';
    const ids = students.map((student) => student.id);
    const records = ids.length
      ? await db.all(
          `SELECT * FROM asistencias_diarias WHERE fecha = ? AND alumno_id IN (${ids.map(() => '?').join(', ')})`,
          [date, ...ids],
        )
      : [];
    const recordsByStudent = new Map(records.map((record) => [record.alumno_id, record]));
    res.json(
      students.map((alumno) => ({ alumno, asistencia: recordsByStudent.get(alumno.id) ?? null })),
    );
  });
  app.post('/api/asistencias', async (req, res) => {
    assert(['admin', 'docente'].includes(req.user!.rol), 403, 'No podés registrar asistencias.');
    const input = objectBody(req.body);
    const date = calendarDate(input.fecha);
    assert(
      Array.isArray(input.registros) && input.registros.length > 0 && input.registros.length <= 500,
      400,
      'Enviá entre 1 y 500 registros de asistencia.',
    );
    const records = input.registros.map((value: unknown) => {
      const record = objectBody(value);
      assert(typeof record.presente === 'boolean', 400, 'La presencia debe ser verdadero o falso.');
      return {
        id: idOf(record.alumno_id),
        presente: record.presente ? 1 : 0,
        observacion: String(record.observacion ?? '').slice(0, 2000),
      };
    });
    const ids = records.map((record) => record.id);
    assert(
      new Set(ids).size === ids.length,
      400,
      'No se puede repetir un alumno en la misma lista.',
    );
    await db.transaction(async () => {
      const allowed = await accessibleStudents(req, ids);
      assert(
        allowed.length === ids.length,
        403,
        'La lista contiene un alumno inactivo o fuera de tus cursos.',
      );
      const params = records.flatMap((record) => [
        record.id,
        date,
        record.presente,
        record.observacion,
      ]);
      await db.run(
        `INSERT INTO asistencias_diarias (alumno_id, fecha, presente, observacion)
        VALUES ${records.map(() => '(?, ?, ?, ?)').join(', ')}
        ON CONFLICT(alumno_id, fecha) DO UPDATE SET presente = excluded.presente, observacion = excluded.observacion`,
        params,
      );
      await audit(req.user!.id, 'asistencias', 'asistencias_diarias', undefined, date);
    });
    res.status(201).json({ ok: true });
  });
}

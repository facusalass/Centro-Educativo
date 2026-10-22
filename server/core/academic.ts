import type { Express, Request } from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.ts';
import { requireStudent, audit } from './security.ts';
import { groupBy } from './collections.ts';
import { calendarDate, httpsUrl } from './validation.ts';
import { publish } from './notifications.ts';

async function requireEvaluation(req: Request, id: number, studentId?: number) {
  const item = await db.get('SELECT * FROM evaluaciones WHERE id = ?', [id]);
  assert(item, 404, 'Evaluación no encontrada.');
  if (req.user!.rol === 'admin') return item;
  if (req.user!.rol === 'docente') {
    assert(
      item.docente_id === req.user!.referencia_id,
      403,
      'La evaluación pertenece a otro docente.',
    );
    assert(
      await db.get(
        'SELECT id FROM asignaciones_docentes WHERE docente_id = ? AND curso_id = ? AND materia = ?',
        [req.user!.referencia_id, item.curso_id, item.materia],
      ),
      403,
      'Ya no tenés esa asignación docente.',
    );
    return item;
  }
  assert(studentId, 400, 'Seleccioná un alumno.');
  const student = await requireStudent(req, studentId);
  assert(
    student.curso_id === item.curso_id,
    403,
    'La evaluación no pertenece al curso del alumno.',
  );
  return item;
}
export function registerAcademic(app: Express) {
  app.get('/api/evaluaciones', async (req, res) => {
    const studentId = req.query.alumno_id ? idOf(req.query.alumno_id) : undefined;
    let where = '';
    let params: number[] = [];
    if (req.user!.rol === 'docente') {
      where = 'WHERE e.docente_id = ?';
      params = [req.user!.referencia_id ?? 0];
    } else if (req.user!.rol !== 'admin') {
      assert(studentId, 400, 'Seleccioná un alumno.');
      const student = await requireStudent(req, studentId);
      where = 'WHERE e.curso_id = ?';
      params = [student.curso_id ?? 0];
    }
    const items = await db.all(
      `SELECT e.*, c.nivel, c.anio, c.division FROM evaluaciones e JOIN cursos c ON c.id = e.curso_id ${where} ORDER BY e.fecha DESC, e.id DESC`,
      params,
    );
    if (!items.length) {
      res.json([]);
      return;
    }
    const privileged = ['admin', 'docente'].includes(req.user!.rol);
    const ids = items.map((item) => item.id);
    const placeholders = ids.map(() => '?').join(', ');
    const scope = privileged ? '' : 'AND alumno_id = ?';
    const childParams = privileged ? ids : [...ids, studentId];
    const [grades, submissions, history] = await Promise.all([
      db.all(
        `SELECT g.*, a.nombre, a.apellido FROM calificaciones_alumnos g JOIN alumnos a ON a.id = g.alumno_id
        WHERE g.evaluacion_id IN (${placeholders}) ${privileged ? '' : 'AND g.alumno_id = ? AND g.publicada = 1'}`,
        childParams,
      ),
      db.all(
        `SELECT * FROM entregas WHERE evaluacion_id IN (${placeholders}) ${scope}`,
        childParams,
      ),
      db.all(
        `SELECT * FROM historial_calificaciones WHERE evaluacion_id IN (${placeholders}) ${scope} ORDER BY id DESC`,
        childParams,
      ),
    ]);
    const gradesByEvaluation = groupBy(grades, (grade) => grade.evaluacion_id);
    const submissionsByEvaluation = groupBy(submissions, (submission) => submission.evaluacion_id);
    const historyByEvaluation = groupBy(history, (entry) => entry.evaluacion_id);
    const result = items.map((item) => {
      const calificaciones = gradesByEvaluation.get(item.id) ?? [];
      return {
        ...item,
        calificaciones,
        entregas: submissionsByEvaluation.get(item.id) ?? [],
        historial:
          privileged || calificaciones.length ? (historyByEvaluation.get(item.id) ?? []) : [],
      };
    });
    res.json(result);
  });
  app.post('/api/evaluaciones', async (req, res) => {
    assert(
      ['admin', 'docente'].includes(req.user!.rol),
      403,
      'Solo un docente puede crear evaluaciones.',
    );
    const result = await db.transaction(async () => {
      const assignment = await db.get('SELECT * FROM asignaciones_docentes WHERE id = ?', [
        idOf(req.body.asignacion_id),
      ]);
      assert(assignment, 400, 'Seleccioná una asignación docente.');
      assert(
        req.user!.rol === 'admin' || assignment.docente_id === req.user!.referencia_id,
        403,
        'No tenés esta asignación.',
      );
      const titulo = String(req.body.titulo ?? '').trim(),
        fecha = calendarDate(req.body.fecha);
      assert(
        titulo.length >= 3 &&
          titulo.length <= 200 &&
          /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
          !Number.isNaN(Date.parse(fecha)),
        400,
        'Completá un título y una fecha válida.',
      );
      const id = await db.insert('evaluaciones', {
        curso_id: assignment.curso_id,
        materia: assignment.materia,
        docente_id: assignment.docente_id,
        titulo,
        fecha,
      });
      await audit(req.user!.id, 'alta', 'evaluaciones', id);
      return db.get('SELECT * FROM evaluaciones WHERE id = ?', [id]);
    });
    res.status(201).json(result);
  });
  app.get('/api/evaluaciones/:id/alumnos', async (req, res) => {
    assert(['admin', 'docente'].includes(req.user!.rol), 403, 'No podés consultar esta nómina.');
    const item = await requireEvaluation(req, idOf(req.params.id));
    res.json(
      await db.all(
        "SELECT id, nombre, apellido, legajo FROM alumnos WHERE curso_id = ? AND estado = 'activo' ORDER BY apellido, nombre",
        [item.curso_id],
      ),
    );
  });
  app.post('/api/entregas', async (req, res) => {
    assert(
      ['admin', 'alumno', 'padre'].includes(req.user!.rol),
      403,
      'No podés registrar entregas.',
    );
    const result = await db.transaction(async () => {
      const studentId = idOf(req.body.alumno_id),
        evalId = idOf(req.body.evaluacion_id);
      const student = await requireStudent(req, studentId);
      const evaluation = await requireEvaluation(req, evalId, studentId);
      assert(
        student.curso_id === evaluation.curso_id,
        400,
        'La evaluación corresponde a otro curso.',
      );
      const url = httpsUrl(req.body.archivo_url);
      const data = {
        alumno_id: studentId,
        evaluacion_id: evalId,
        archivo_url: url,
        comentario: String(req.body.comentario ?? '').slice(0, 2000),
        fecha: new Date().toISOString(),
      };
      const old = await db.get(
        'SELECT id FROM entregas WHERE alumno_id = ? AND evaluacion_id = ?',
        [studentId, evalId],
      );
      const id = old?.id ?? (await db.insert('entregas', data));
      if (old) await db.update('entregas', id, data);
      await audit(req.user!.id, 'entrega', 'evaluaciones', evalId);
      return { id, ...data };
    });
    res.status(201).json(result);
  });
  app.post('/api/calificaciones', async (req, res) => {
    assert(['admin', 'docente'].includes(req.user!.rol), 403, 'Solo un docente puede calificar.');
    const result = await db.transaction(async () => {
      const evaluation = await requireEvaluation(req, idOf(req.body.evaluacion_id));
      const student = await requireStudent(req, idOf(req.body.alumno_id));
      assert(
        student.curso_id === evaluation.curso_id,
        400,
        'El alumno no pertenece al curso de la evaluación.',
      );
      const nota = Number(req.body.calificacion),
        comentario = String(req.body.observacion ?? '').trim();
      assert(
        req.body.calificacion !== '' && Number.isFinite(nota) && nota >= 1 && nota <= 10,
        400,
        'La calificación debe estar entre 1 y 10.',
      );
      assert(
        comentario.length > 0 && comentario.length <= 4000,
        400,
        'Ingresá una devolución de hasta 4000 caracteres.',
      );
      const data = {
        alumno_id: student.id,
        evaluacion_id: evaluation.id,
        calificacion: nota,
        observacion: comentario,
        publicada: 1,
      };
      const old = await db.get(
        'SELECT id FROM calificaciones_alumnos WHERE alumno_id = ? AND evaluacion_id = ?',
        [student.id, evaluation.id],
      );
      const id = old?.id ?? (await db.insert('calificaciones_alumnos', data));
      if (old) await db.update('calificaciones_alumnos', id, data);
      await db.insert('historial_calificaciones', {
        alumno_id: student.id,
        evaluacion_id: evaluation.id,
        docente_id: evaluation.docente_id,
        calificacion: nota,
        observacion: comentario,
        fecha: new Date().toISOString(),
      });
      await audit(req.user!.id, 'calificación', 'evaluaciones', evaluation.id);
      await publish({
        alumno_id: student.id,
        titulo: 'Nueva calificación publicada',
        mensaje: `${evaluation.materia} — ${evaluation.titulo}: ${nota}. ${comentario}`,
      });
      return { id, ...data };
    });
    res.status(201).json(result);
  });
}

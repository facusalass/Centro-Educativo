import type { Express } from 'express';
import { db } from '../database.js';
import { enroll, cancelEnrollment, matriculate } from './enrollment.ts';
import { listEnrollments } from './enrollment-queries.ts';
export function registerEnrollmentRoutes(app: Express) {
  app.post('/api/inscripciones', async (req, res) => res.status(201).json(await enroll(req)));
  app.delete('/api/inscripciones/:id', async (req, res) =>
    res.json(await cancelEnrollment(req, req.params.id)),
  );
  app.delete('/api/padres/hijos/:alumnoId/inscripciones/:inscripcionId', async (req, res) =>
    res.json(await cancelEnrollment(req, req.params.inscripcionId)),
  );
  app.get('/api/inscripciones', async (req, res) => res.json(await listEnrollments(req)));
  app.post('/api/matriculas', async (req, res) => res.status(201).json(await matriculate(req)));
  app.get('/api/matriculas', async (req, res) => {
    const params: number[] = [];
    let where = '';
    if (req.user!.rol !== 'admin') {
      where = 'WHERE a.usuario_padre_id = ?';
      params.push(req.user!.id);
    }
    res.json(
      await db.all(
        `SELECT m.*, a.nombre, a.apellido, c.anio, c.division, c.nivel FROM matriculas m JOIN alumnos a ON a.id = m.alumno_id JOIN cursos c ON c.id = m.curso_id ${where} ORDER BY m.ciclo DESC, m.id DESC`,
        params,
      ),
    );
  });
}

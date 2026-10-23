import type { Express, Request, Response } from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.js';
import { audit, safeUser } from './security.js';
import { publish } from './notifications.js';
import { entities } from './entity-definitions.js';
import { validateEntity } from './entity-validation.js';
export function registerEntities(app: Express) {
  for (const [key, def] of Object.entries(entities)) {
    // Keep detail reads in the same module as writes. News has a separate
    // publication-aware public handler, so it must not use this generic route.
    if (key !== 'noticias')
      app.get(`/api/${key}/:id`, async (req, res) => {
        const row = await db.get(`SELECT * FROM ${def.table} WHERE id = ?`, [idOf(req.params.id)]);
        assert(row, 404, 'Registro no encontrado.');
        res.json(key === 'usuarios' ? safeUser(row) : row);
      });
    // Public content reads keep their curated legacy endpoints below.
    if (
      !['niveles', 'servicios', 'instalaciones', 'noticias', 'actividades', 'galeria'].includes(key)
    )
      app.get(`/api/${key}`, async (req, res) => {
        let rows = await db.all(`SELECT * FROM ${def.table} ORDER BY id`);
        if (req.user?.rol === 'docente') {
          if (key === 'asignaciones-docentes')
            rows = rows.filter((r) => r.docente_id === req.user!.referencia_id);
          if (key === 'alumnos') {
            const courses = await db.all(
              'SELECT curso_id FROM asignaciones_docentes WHERE docente_id = ?',
              [req.user.referencia_id ?? 0],
            );
            rows = rows.filter((r) => courses.some((c) => c.curso_id === r.curso_id));
          }
          if (key === 'cursos') {
            const assignments = await db.all(
              'SELECT curso_id FROM asignaciones_docentes WHERE docente_id = ?',
              [req.user.referencia_id ?? 0],
            );
            rows = rows.filter((r) => assignments.some((a) => a.curso_id === r.id));
          }
        }
        res.json(key === 'usuarios' ? rows.map(safeUser) : rows);
      });
    for (const method of ['post', 'put'] as const)
      app[method](
        `/api/${key}${method === 'put' ? '/:id' : ''}`,
        async (req: Request, res: Response) => {
          assert(
            req.user?.rol === 'admin',
            403,
            'Solo administración puede modificar estos registros.',
          );
          const result = await db.transaction(async () => {
            const id = method === 'put' ? idOf(req.params.id) : undefined;
            const data = await validateEntity(key, req.body, id);
            const savedId = id ?? (await db.insert(def.table, data));
            if (id) await db.update(def.table, id, data);
            if (key === 'materias' && id && data.nombre !== undefined)
              await db.run('UPDATE asignaciones_docentes SET materia = ? WHERE materia_id = ?', [
                data.nombre,
                id,
              ]);
            if (id && ['docentes', 'alumnos'].includes(key) && data.estado === 'inactivo')
              await db.run(
                "UPDATE usuarios_acceso SET estado = 'inactivo', session_version = session_version + 1 WHERE referencia_id = ? AND rol = ?",
                [id, key === 'docentes' ? 'docente' : 'alumno'],
              );
            if (key === 'cursos' && id) {
              const course = await db.get('SELECT * FROM cursos WHERE id = ?', [id]);
              await db.run('UPDATE alumnos SET curso = ?, division = ? WHERE curso_id = ?', [
                course.anio,
                course.division,
                id,
              ]);
            }
            await audit(req.user!.id, id ? 'modificación' : 'alta', def.table, savedId);
            if (key === 'grupos-deporte' && id)
              for (const i of await db.all(
                "SELECT alumno_id FROM inscripciones WHERE grupo_deporte_id = ? AND estado = 'activo'",
                [id],
              ))
                await publish({
                  alumno_id: i.alumno_id,
                  titulo: 'Actividad actualizada',
                  mensaje: `Se actualizó el grupo deportivo: ${data.dia} ${data.horario}.`,
                });
            if (key === 'asignaciones-docentes' && id) {
              const assignment = await db.get('SELECT * FROM asignaciones_docentes WHERE id = ?', [
                id,
              ]);
              for (const student of await db.all(
                "SELECT id FROM alumnos WHERE curso_id = ? AND estado = 'activo'",
                [assignment.curso_id],
              ))
                await publish({
                  alumno_id: student.id,
                  titulo: 'Horario académico actualizado',
                  mensaje: `${assignment.materia}: ${assignment.dia} ${assignment.horario}.`,
                });
            }
            if (key === 'recorridos' && id)
              for (const i of await db.all(
                "SELECT alumno_id FROM inscripciones WHERE recorrido_id = ? AND estado = 'activo'",
                [id],
              ))
                await publish({
                  alumno_id: i.alumno_id,
                  titulo: 'Transporte actualizado',
                  mensaje:
                    'Se actualizó el horario o la información de tu recorrido. Consultalo en el portal.',
                });
            const row = await db.get(`SELECT * FROM ${def.table} WHERE id = ?`, [savedId]);
            return key === 'usuarios' ? safeUser(row) : row;
          });
          res.status(method === 'post' ? 201 : 200).json(result);
        },
      );
    app.delete(`/api/${key}/:id`, async (req: Request, res: Response) => {
      assert(req.user?.rol === 'admin', 403, 'Solo administración puede dar de baja registros.');
      await db.transaction(async () => {
        const id = idOf(req.params.id);
        assert(
          await db.get(`SELECT id FROM ${def.table} WHERE id = ?`, [id]),
          404,
          'Registro no encontrado.',
        );
        if (def.soft) {
          const data =
            key === 'usuarios'
              ? await validateEntity(key, { estado: 'inactivo' }, id)
              : { estado: 'inactivo' };
          await db.update(def.table, id, data);
          if (key === 'docentes' || key === 'alumnos')
            await db.run(
              "UPDATE usuarios_acceso SET estado = 'inactivo', session_version = session_version + 1 WHERE referencia_id = ? AND rol = ?",
              [id, key === 'docentes' ? 'docente' : 'alumno'],
            );
        } else {
          const checks: Record<string, [string, string][]> = {
            niveles: [['cursos', 'nivel_id']],
            cursos: [
              ['alumnos', 'curso_id'],
              ['asignaciones_docentes', 'curso_id'],
              ['matriculas', 'curso_id'],
            ],
            materias: [['asignaciones_docentes', 'materia_id']],
            deportes: [['grupos_deporte', 'deporte_id']],
            'grupos-deporte': [['inscripciones', 'grupo_deporte_id']],
            recorridos: [['inscripciones', 'recorrido_id']],
          };
          for (const [table, field] of checks[key] ?? [])
            assert(
              !(await db.get(`SELECT id FROM ${table} WHERE ${field} = ?`, [id])),
              409,
              'El registro tiene información relacionada. Reasignala antes de eliminarlo.',
            );
          await db.run(`DELETE FROM ${def.table} WHERE id = ?`, [id]);
        }
        await audit(req.user!.id, 'baja', def.table, id);
      });
      res.json({ ok: true });
    });
  }
}

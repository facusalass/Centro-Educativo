import { db } from '../database.js';
import { sendDbError } from '../http/helpers.js';
export function registerAdminRoutes(app) {
  app.get('/api/admin/bootstrap', async (_req, res) => {
    try {
      const [
        solicitudes,
        opiniones,
        postulaciones,
        alumnos,
        docentes,
        cursos,
        servicios,
        instalaciones,
        noticias,
        usuarios,
        materias,
        deportes,
        grupos,
        recorridos,
        inscripciones,
      ] = await Promise.all([
        db.all('SELECT * FROM solicitudes_inscripcion ORDER BY fecha_solicitud DESC, id DESC'),
        db.all('SELECT * FROM opiniones_web ORDER BY fecha_publicacion DESC, id DESC'),
        db.all('SELECT * FROM postulaciones_empleo ORDER BY fecha_recepcion DESC, id DESC'),
        db.all('SELECT * FROM alumnos ORDER BY created_at DESC, id DESC'),
        db.all('SELECT * FROM docentes ORDER BY created_at DESC, id DESC'),
        db.all('SELECT * FROM cursos ORDER BY nivel, anio, division'),
        db.all('SELECT * FROM servicios ORDER BY id'),
        db.all('SELECT * FROM instalaciones ORDER BY id'),
        db.all('SELECT * FROM noticias ORDER BY fecha_publicacion DESC, id DESC'),
        db.all(
          'SELECT id, nombre, nombre_usuario, email, rol, estado, referencia_id, created_at FROM usuarios_acceso ORDER BY rol, id',
        ),
        db.all('SELECT * FROM materias ORDER BY nombre'),
        db.all('SELECT * FROM deportes ORDER BY nombre'),
        db.all('SELECT * FROM grupos_deporte ORDER BY deporte_id, nivel, dia'),
        db.all('SELECT * FROM recorridos_transporte ORDER BY id'),
        db.all(
          "SELECT * FROM inscripciones WHERE estado = 'activo' ORDER BY fecha_inscripcion DESC, id DESC",
        ),
      ]);
      res.json({
        solicitudes,
        opiniones,
        postulaciones,
        alumnos,
        docentes,
        cursos,
        servicios,
        instalaciones,
        noticias,
        usuarios,
        materias,
        deportes,
        grupos,
        recorridos,
        inscripciones,
        asignaciones: await db.all('SELECT * FROM asignaciones_docentes'),
      });
    } catch (error) {
      sendDbError(res, error);
    }
  });
}

import { db } from '../database.js';
import {
  emailRegex,
  enrollmentLevels,
  employmentPositions,
  today,
  sendDbError,
  requireFields,
  normalizeBody,
  isValidPhone,
  isValidHttpUrl,
  insertRecord,
  getById,
} from '../http/helpers.js';
export function registerPublicRoutes(app) {
  async function getPostulaciones(_req, res) {
    try {
      res.json(
        await db.all('SELECT * FROM postulaciones_empleo ORDER BY fecha_recepcion DESC, id DESC'),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  }
  async function createPostulacion(req, res) {
    const data = normalizeBody(req.body);
    const missing = requireFields(data, [
      'nombre_candidato',
      'email',
      'telefono',
      'puesto_interes',
      'enlace_cv',
      'mensaje',
    ]);
    if (missing.length > 0)
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    if (!emailRegex.test(data.email))
      return res.status(400).json({ error: 'El email no tiene un formato valido.' });
    if (!isValidPhone(data.telefono))
      return res.status(400).json({
        error:
          'El telefono debe tener entre 7 y 15 digitos y solo puede incluir +, espacios, guiones o parentesis.',
      });
    if (!employmentPositions.has(data.puesto_interes))
      return res.status(400).json({ error: 'El puesto de interes no es valido.' });
    if (!isValidHttpUrl(data.enlace_cv))
      return res
        .status(400)
        .json({ error: 'El enlace al CV debe comenzar con http:// o https://.' });
    if (data.mensaje.length < 20)
      return res
        .status(400)
        .json({ error: 'El mensaje de presentacion debe tener al menos 20 caracteres.' });

    try {
      const id = await insertRecord('postulaciones_empleo', {
        nombre_candidato: data.nombre_candidato,
        email: data.email,
        telefono: data.telefono,
        puesto_interes: data.puesto_interes,
        enlace_cv: data.enlace_cv,
        mensaje: data.mensaje,
        estado: 'recibida',
      });
      res.status(201).json(await getById('postulaciones_empleo', id));
    } catch (error) {
      sendDbError(res, error);
    }
  }
  const catalogs = [
    ['/api/niveles', 'niveles_educativos', 'id', false],
    ['/api/servicios', 'servicios', 'id', false],
    ['/api/instalaciones', 'instalaciones', 'id', false],
    ['/api/actividades', 'actividades_escolares', 'fecha ASC, id DESC', true],
    ['/api/galeria', 'galeria_imagenes', 'id DESC', true],
  ];
  for (const [path, table, order, moderated] of catalogs) {
    app.get(path, async (req, res) => {
      const filter = moderated && req.user?.rol !== 'admin' ? 'WHERE visible = 1' : '';
      res.json(await db.all(`SELECT * FROM ${table} ${filter} ORDER BY ${order}`));
    });
  }
  app.get('/api/noticias', async (req, res) => {
    try {
      const where = req.query.all === '1' ? '' : 'WHERE visible = 1';
      res.json(
        await db.all(`SELECT * FROM noticias ${where} ORDER BY fecha_publicacion DESC, id DESC`),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/noticias/:id', async (req, res) => {
    try {
      const noticia = await getById('noticias', req.params.id);
      if (!noticia || (noticia.visible !== 1 && req.user?.rol !== 'admin'))
        return res.status(404).json({ error: 'Noticia no encontrada.' });
      res.json(noticia);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/opiniones', async (req, res) => {
    try {
      const where =
        req.query.all === '1' ? '' : "WHERE estado_moderacion = 'visible' AND visible = 1";
      res.json(
        await db.all(
          `SELECT * FROM opiniones_web ${where} ORDER BY fecha_publicacion DESC, id DESC`,
        ),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.post('/api/opiniones', async (req, res) => {
    const { autor_anonimo, comentario } = normalizeBody(req.body);
    if (!autor_anonimo || !comentario) {
      return res.status(400).json({ error: 'Autor y comentario son obligatorios.' });
    }

    try {
      const id = await insertRecord('opiniones_web', {
        autor_anonimo,
        comentario,
        estado_moderacion: 'pendiente',
        visible: 0,
      });
      res.status(201).json(await getById('opiniones_web', id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.put('/api/opiniones/:id/moderar', async (req, res) => {
    try {
      const estado = req.body.estado_moderacion ?? req.body.estado ?? 'visible';
      const visible = estado === 'visible' ? 1 : 0;
      const result = await db.run(
        'UPDATE opiniones_web SET estado_moderacion = ?, visible = ? WHERE id = ?',
        [estado, visible, req.params.id],
      );
      if (!result.changes) return res.status(404).json({ error: 'Opinion no encontrada.' });
      res.json(await getById('opiniones_web', req.params.id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/solicitudes-inscripcion', async (_req, res) => {
    try {
      res.json(
        await db.all(
          'SELECT * FROM solicitudes_inscripcion ORDER BY fecha_solicitud DESC, id DESC',
        ),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.post('/api/solicitudes-inscripcion', async (req, res) => {
    const data = normalizeBody(req.body);
    const missing = requireFields(data, [
      'nombre_tutor',
      'nombre_aspirante',
      'nivel_solicitado',
      'email_contacto',
      'telefono',
      'mensaje',
    ]);
    if (missing.length > 0)
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    if (!emailRegex.test(data.email_contacto))
      return res.status(400).json({ error: 'El email de contacto no tiene un formato valido.' });
    if (!isValidPhone(data.telefono))
      return res.status(400).json({
        error:
          'El telefono debe tener entre 7 y 15 digitos y solo puede incluir +, espacios, guiones o parentesis.',
      });
    if (!enrollmentLevels.has(data.nivel_solicitado))
      return res.status(400).json({ error: 'El nivel solicitado no es valido.' });
    if (data.mensaje.length < 10)
      return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres.' });

    try {
      const id = await insertRecord('solicitudes_inscripcion', {
        nombre_tutor: data.nombre_tutor,
        nombre_aspirante: data.nombre_aspirante,
        nivel_solicitado: data.nivel_solicitado,
        email_contacto: data.email_contacto,
        telefono: data.telefono,
        mensaje: data.mensaje,
      });
      res.status(201).json(await getById('solicitudes_inscripcion', id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.put('/api/solicitudes-inscripcion/:id/estado', async (req, res) => {
    try {
      const estado = req.body.estado_tramite ?? req.body.estado ?? 'en revision';
      const result = await db.run(
        'UPDATE solicitudes_inscripcion SET estado_tramite = ? WHERE id = ?',
        [estado, req.params.id],
      );
      if (!result.changes) return res.status(404).json({ error: 'Solicitud no encontrada.' });
      res.json(await getById('solicitudes_inscripcion', req.params.id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/postulaciones', getPostulaciones);
  app.get('/api/postulaciones-empleo', getPostulaciones);

  app.post('/api/postulaciones', createPostulacion);
  app.post('/api/postulaciones-empleo', createPostulacion);

  app.put('/api/postulaciones/:id/estado', async (req, res) => {
    try {
      const estado = req.body.estado ?? 'en revision';
      const result = await db.run('UPDATE postulaciones_empleo SET estado = ? WHERE id = ?', [
        estado,
        req.params.id,
      ]);
      if (!result.changes) return res.status(404).json({ error: 'Postulacion no encontrada.' });
      res.json(await getById('postulaciones_empleo', req.params.id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.post('/api/contacto', async (req, res) => {
    const missing = requireFields(req.body, ['nombre', 'email', 'mensaje']);
    if (missing.length > 0)
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    if (!emailRegex.test(req.body.email)) return res.status(400).json({ error: 'Email invalido.' });

    try {
      const id = await insertRecord('contacto_mensajes', {
        nombre: req.body.nombre,
        email: req.body.email,
        asunto: req.body.asunto ?? 'Consulta web',
        mensaje: req.body.mensaje,
      });
      res.status(201).json(await getById('contacto_mensajes', id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/contacto', async (_req, res) => {
    try {
      res.json(
        await db.all('SELECT * FROM contacto_mensajes ORDER BY fecha_recepcion DESC, id DESC'),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });
}

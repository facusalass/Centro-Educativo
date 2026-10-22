import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { databaseMode, db, initializeDatabase } from './database.js';

const app = express();
const PORT = process.env.PORT ?? 3001;
let databaseInitializationError;
const databaseReady = initializeDatabase().catch((error) => {
  databaseInitializationError = error;
});

app.use(cors());
app.use(express.json());

app.use(async (_req, res, next) => {
  try {
    await databaseReady;
    if (databaseInitializationError) throw databaseInitializationError;
    next();
  } catch (error) {
    sendDbError(res, error);
  }
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneCharactersRegex = /^[0-9+()\s-]+$/;
const enrollmentLevels = new Set(['Nivel Inicial', 'Nivel Primario', 'Nivel Secundario']);
const employmentPositions = new Set([
  'Docente de Nivel Inicial',
  'Docente de Nivel Primario',
  'Profesores de Nivel Secundario',
  'Personal Administrativo',
]);

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sendDbError(res, error) {
  res.status(500).json({ error: 'Error de base de datos.', detalle: error.message });
}

function requireFields(body, fields) {
  return fields.filter((field) => {
    const value = body[field];
    return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
  });
}

function normalizeBody(body) {
  return Object.fromEntries(
    Object.entries(body).map(([field, value]) => [field, typeof value === 'string' ? value.trim() : value]),
  );
}

function isValidPhone(value) {
  const digitCount = value.replace(/\D/g, '').length;
  return phoneCharactersRegex.test(value) && digitCount >= 7 && digitCount <= 15;
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function selectFields(body, allowedFields) {
  return allowedFields.reduce((data, field) => {
    if (body[field] !== undefined) data[field] = body[field];
    return data;
  }, {});
}

async function insertRecord(table, data) {
  if (table === 'servicios' && !data.icono) {
    data.icono = 'school';
  }
  if (table === 'instalaciones' && !data.imagen_url) {
    data.imagen_url = 'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900';
  }

  return db.insert(table, data);
}

async function updateRecord(table, id, data) {
  const result = await db.update(table, id, data);
  return result.changes;
}

async function getById(table, id) {
  return db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
}

function crudRoutes({ basePath, table, allowedFields, requiredFields, orderBy = 'id DESC', softDeleteField }) {
  app.get(basePath, async (_req, res) => {
    try {
      res.json(await db.all(`SELECT * FROM ${table} ORDER BY ${orderBy}`));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get(`${basePath}/:id`, async (req, res) => {
    try {
      const record = await getById(table, req.params.id);
      if (!record) return res.status(404).json({ error: 'Registro no encontrado.' });
      res.json(record);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.post(basePath, async (req, res) => {
    const missing = requireFields(req.body, requiredFields);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
    }

    try {
      const data = selectFields(req.body, allowedFields);
      const id = await insertRecord(table, data);
      res.status(201).json(await getById(table, id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.put(`${basePath}/:id`, async (req, res) => {
    try {
      const data = selectFields(req.body, allowedFields);
      const changes = await updateRecord(table, req.params.id, data);
      if (!changes) return res.status(404).json({ error: 'Registro no encontrado o sin cambios.' });
      res.json(await getById(table, req.params.id));
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const result = softDeleteField
        ? await db.run(`UPDATE ${table} SET ${softDeleteField} = ? WHERE id = ?`, ['inactivo', req.params.id])
        : await db.run(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);

      if (!result.changes) return res.status(404).json({ error: 'Registro no encontrado.' });
      res.json({ ok: true });
    } catch (error) {
      sendDbError(res, error);
    }
  });
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', proyecto: 'Educar para Transformar', database: databaseMode });
});

app.get('/api/admin/bootstrap', async (_req, res) => {
  try {
    const [solicitudes, opiniones, postulaciones, alumnos, docentes, cursos, servicios, instalaciones, noticias, usuarios, materias, deportes, grupos, recorridos, inscripciones] = await Promise.all([
      db.all('SELECT * FROM solicitudes_inscripcion ORDER BY fecha_solicitud DESC, id DESC'),
      db.all('SELECT * FROM opiniones_web ORDER BY fecha_publicacion DESC, id DESC'),
      db.all('SELECT * FROM postulaciones_empleo ORDER BY fecha_recepcion DESC, id DESC'),
      db.all('SELECT * FROM alumnos ORDER BY created_at DESC, id DESC'),
      db.all('SELECT * FROM docentes ORDER BY created_at DESC, id DESC'),
      db.all('SELECT * FROM cursos ORDER BY nivel, anio, division'),
      db.all('SELECT * FROM servicios ORDER BY id'),
      db.all('SELECT * FROM instalaciones ORDER BY id'),
      db.all('SELECT * FROM noticias ORDER BY fecha_publicacion DESC, id DESC'),
      db.all('SELECT id, nombre, nombre_usuario, email, rol, estado, created_at FROM usuarios_acceso ORDER BY rol, id'),
      db.all('SELECT * FROM materias ORDER BY nombre'),
      db.all('SELECT * FROM deportes ORDER BY nombre'),
      db.all('SELECT * FROM grupos_deporte ORDER BY deporte_id, nivel, dia'),
      db.all('SELECT * FROM recorridos_transporte ORDER BY id'),
      db.all('SELECT * FROM inscripciones ORDER BY fecha_inscripcion DESC, id DESC'),
    ]);
    res.json({ solicitudes, opiniones, postulaciones, alumnos, docentes, cursos, servicios, instalaciones, noticias, usuarios, materias, deportes, grupos, recorridos, inscripciones, asignaciones: await db.all('SELECT * FROM asignaciones_docentes') });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/niveles', async (_req, res) => {
  try {
    res.json(await db.all('SELECT * FROM niveles_educativos ORDER BY id'));
  } catch (error) {
    sendDbError(res, error);
  }
});

crudRoutes({
  basePath: '/api/alumnos',
  table: 'alumnos',
  allowedFields: ['nombre', 'apellido', 'legajo', 'dni', 'fecha_nacimiento', 'domicilio', 'telefono', 'email', 'nivel', 'curso', 'division', 'tutor_nombre', 'tutor_email', 'tutor_telefono', 'estado'],
  requiredFields: ['nombre', 'apellido', 'nivel'],
  orderBy: 'created_at DESC, id DESC',
  softDeleteField: 'estado',
});

crudRoutes({
  basePath: '/api/docentes',
  table: 'docentes',
  allowedFields: ['nombre', 'apellido', 'legajo', 'dni', 'email', 'telefono', 'especialidad', 'estado'],
  requiredFields: ['nombre', 'apellido', 'email', 'especialidad'],
  orderBy: 'created_at DESC, id DESC',
  softDeleteField: 'estado',
});

crudRoutes({
  basePath: '/api/cursos',
  table: 'cursos',
  allowedFields: ['nivel', 'anio', 'division', 'turno', 'descripcion'],
  requiredFields: ['nivel', 'anio', 'turno'],
  orderBy: 'nivel, anio, division',
});

crudRoutes({
  basePath: '/api/asignaciones-docentes',
  table: 'asignaciones_docentes',
  allowedFields: ['docente_id', 'curso_id', 'materia', 'dia', 'horario'],
  requiredFields: ['docente_id', 'curso_id', 'materia'],
  orderBy: 'id DESC',
});

crudRoutes({
  basePath: '/api/servicios',
  table: 'servicios',
  allowedFields: ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'],
  requiredFields: ['nombre', 'descripcion'],
  orderBy: 'id',
});

crudRoutes({
  basePath: '/api/instalaciones',
  table: 'instalaciones',
  allowedFields: ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'],
  requiredFields: ['nombre', 'descripcion'],
  orderBy: 'id',
});

app.get('/api/noticias', async (req, res) => {
  try {
    const where = req.query.all === '1' ? '' : 'WHERE visible = 1';
    res.json(await db.all(`SELECT * FROM noticias ${where} ORDER BY fecha_publicacion DESC, id DESC`));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/noticias/:id', async (req, res) => {
  try {
    const noticia = await getById('noticias', req.params.id);
    if (!noticia) return res.status(404).json({ error: 'Noticia no encontrada.' });
    res.json(noticia);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/noticias', async (req, res) => {
  const missing = requireFields(req.body, ['titulo', 'descripcion', 'tipo']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });

  try {
    const id = await insertRecord('noticias', {
      titulo: req.body.titulo,
      descripcion: req.body.descripcion,
      contenido: req.body.contenido ?? req.body.descripcion,
      fecha_publicacion: req.body.fecha_publicacion ?? today(),
      tipo: req.body.tipo,
      visible: req.body.visible ?? 1,
      imagen_url: req.body.imagen_url ?? '',
    });
    res.status(201).json(await getById('noticias', id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/noticias/:id', async (req, res) => {
  try {
    const data = selectFields(req.body, ['titulo', 'descripcion', 'contenido', 'fecha_publicacion', 'tipo', 'visible', 'imagen_url']);
    const changes = await updateRecord('noticias', req.params.id, data);
    if (!changes) return res.status(404).json({ error: 'Noticia no encontrada o sin cambios.' });
    res.json(await getById('noticias', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.delete('/api/noticias/:id', async (req, res) => {
  try {
    const result = await db.run('UPDATE noticias SET visible = 0 WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Noticia no encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/opiniones', async (req, res) => {
  try {
    const where = req.query.all === '1' ? '' : "WHERE estado_moderacion = 'visible' AND visible = 1";
    res.json(await db.all(`SELECT * FROM opiniones_web ${where} ORDER BY fecha_publicacion DESC, id DESC`));
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
    res.json(await db.all('SELECT * FROM solicitudes_inscripcion ORDER BY fecha_solicitud DESC, id DESC'));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/solicitudes-inscripcion', async (req, res) => {
  const data = normalizeBody(req.body);
  const missing = requireFields(data, ['nombre_tutor', 'nombre_aspirante', 'nivel_solicitado', 'email_contacto', 'telefono', 'mensaje']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(data.email_contacto)) return res.status(400).json({ error: 'El email de contacto no tiene un formato valido.' });
  if (!isValidPhone(data.telefono)) return res.status(400).json({ error: 'El telefono debe tener entre 7 y 15 digitos y solo puede incluir +, espacios, guiones o parentesis.' });
  if (!enrollmentLevels.has(data.nivel_solicitado)) return res.status(400).json({ error: 'El nivel solicitado no es valido.' });
  if (data.mensaje.length < 10) return res.status(400).json({ error: 'El mensaje debe tener al menos 10 caracteres.' });

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
    const result = await db.run('UPDATE solicitudes_inscripcion SET estado_tramite = ? WHERE id = ?', [estado, req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    res.json(await getById('solicitudes_inscripcion', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

async function getPostulaciones(_req, res) {
  try {
    res.json(await db.all('SELECT * FROM postulaciones_empleo ORDER BY fecha_recepcion DESC, id DESC'));
  } catch (error) {
    sendDbError(res, error);
  }
}

async function createPostulacion(req, res) {
  const data = normalizeBody(req.body);
  const missing = requireFields(data, ['nombre_candidato', 'email', 'telefono', 'puesto_interes', 'enlace_cv', 'mensaje']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(data.email)) return res.status(400).json({ error: 'El email no tiene un formato valido.' });
  if (!isValidPhone(data.telefono)) return res.status(400).json({ error: 'El telefono debe tener entre 7 y 15 digitos y solo puede incluir +, espacios, guiones o parentesis.' });
  if (!employmentPositions.has(data.puesto_interes)) return res.status(400).json({ error: 'El puesto de interes no es valido.' });
  if (!isValidHttpUrl(data.enlace_cv)) return res.status(400).json({ error: 'El enlace al CV debe comenzar con http:// o https://.' });
  if (data.mensaje.length < 20) return res.status(400).json({ error: 'El mensaje de presentacion debe tener al menos 20 caracteres.' });

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

app.get('/api/postulaciones', getPostulaciones);
app.get('/api/postulaciones-empleo', getPostulaciones);
app.post('/api/postulaciones', createPostulacion);
app.post('/api/postulaciones-empleo', createPostulacion);

app.put('/api/postulaciones/:id/estado', async (req, res) => {
  try {
    const estado = req.body.estado ?? 'en revision';
    const result = await db.run('UPDATE postulaciones_empleo SET estado = ? WHERE id = ?', [estado, req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Postulacion no encontrada.' });
    res.json(await getById('postulaciones_empleo', req.params.id));
  } catch (error) {
    sendDbError(res, error);
  }
});

async function getUsuarios(_req, res) {
  try {
    res.json(await db.all('SELECT id, nombre, nombre_usuario, email, rol, estado, created_at FROM usuarios_acceso ORDER BY rol, id'));
  } catch (error) {
    sendDbError(res, error);
  }
}

app.get('/api/usuarios', getUsuarios);
app.get('/api/usuarios-acceso', getUsuarios);

app.post('/api/usuarios', async (req, res) => {
  const missing = requireFields(req.body, ['nombre', 'email', 'password_demo', 'rol']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  if (!emailRegex.test(req.body.email)) return res.status(400).json({ error: 'Email invalido.' });

  try {
    const id = await insertRecord('usuarios_acceso', {
      nombre: req.body.nombre,
      nombre_usuario: req.body.nombre_usuario ?? req.body.email.split('@')[0],
      email: req.body.email,
      password_demo: req.body.password_demo,
      rol: req.body.rol,
      estado: req.body.estado ?? 'activo',
      referencia_id: req.body.referencia_id ?? null,
    });
    const { password_demo, ...usuario } = await getById('usuarios_acceso', id);
    res.status(201).json(usuario);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/padres/registro', async (req, res) => {
  const data = normalizeBody(req.body);
  const missing = requireFields(data, [
    'nombre_padre',
    'email',
    'password',
    'nombre_hijo',
    'apellido_hijo',
    'nivel',
  ]);
  if (missing.length > 0) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
  }
  if (!emailRegex.test(data.email)) return res.status(400).json({ error: 'Email invalido.' });
  if (data.password.length < 6) return res.status(400).json({ error: 'La password debe tener al menos 6 caracteres.' });
  if (!enrollmentLevels.has(data.nivel)) return res.status(400).json({ error: 'El nivel seleccionado no es valido.' });
  const normalizedLevel = data.nivel.replace(/^Nivel\s+/, '');

  try {
    const existing = await db.get('SELECT id FROM usuarios_acceso WHERE email = ?', [data.email]);
    if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });

    const parentId = await db.insert('usuarios_acceso', {
      nombre: data.nombre_padre,
      nombre_usuario: data.email.split('@')[0],
      email: data.email,
      password_demo: data.password,
      rol: 'padre',
      estado: 'activo',
    });
    const childId = await db.insert('alumnos', {
      nombre: data.nombre_hijo,
      apellido: data.apellido_hijo,
      legajo: data.legajo_hijo ?? '',
      dni: data.dni_hijo ?? '',
      fecha_nacimiento: data.fecha_nacimiento_hijo ?? '',
      domicilio: data.domicilio_hijo ?? '',
      telefono: data.telefono_hijo ?? '',
      email: data.email_hijo ?? '',
      nivel: normalizedLevel,
      curso: data.curso ?? '',
      division: data.division ?? '',
      tutor_nombre: data.nombre_padre,
      tutor_email: data.email,
      tutor_telefono: data.telefono_padre ?? '',
      usuario_padre_id: parentId,
      estado: 'activo',
    });

    const usuario = await db.get('SELECT id, nombre, nombre_usuario, email, rol, estado, referencia_id, created_at FROM usuarios_acceso WHERE id = ?', [parentId]);
    res.status(201).json({ usuario, hijo: await getById('alumnos', childId) });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/padres/hijos', async (req, res) => {
  const data = normalizeBody(req.body);
  const parentId = Number(data.usuario_padre_id);
  const missing = requireFields(data, ['nombre_hijo', 'apellido_hijo', 'nivel']);
  if (!parentId || missing.length > 0) {
    return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.concat(!parentId ? ['usuario_padre_id'] : []).join(', ')}.` });
  }
  if (!enrollmentLevels.has(data.nivel)) return res.status(400).json({ error: 'El nivel seleccionado no es valido.' });

  try {
    const parent = await db.get("SELECT id, nombre, email FROM usuarios_acceso WHERE id = ? AND rol = 'padre' AND estado = 'activo'", [parentId]);
    if (!parent) return res.status(404).json({ error: 'La cuenta familiar no existe o no esta activa.' });
    const childId = await db.insert('alumnos', {
      nombre: data.nombre_hijo,
      apellido: data.apellido_hijo,
      legajo: data.legajo_hijo ?? '',
      dni: data.dni_hijo ?? '',
      fecha_nacimiento: data.fecha_nacimiento_hijo ?? '',
      domicilio: data.domicilio_hijo ?? '',
      telefono: data.telefono_hijo ?? '',
      email: data.email_hijo ?? '',
      nivel: data.nivel.replace(/^Nivel\s+/, ''),
      curso: data.curso ?? '',
      division: data.division ?? '',
      tutor_nombre: parent.nombre,
      tutor_email: parent.email,
      tutor_telefono: data.telefono_padre ?? '',
      usuario_padre_id: parent.id,
      estado: 'activo',
    });
    res.status(201).json(await getById('alumnos', childId));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const data = selectFields(req.body, ['nombre', 'nombre_usuario', 'email', 'password_demo', 'rol', 'estado', 'referencia_id']);
    const changes = await updateRecord('usuarios_acceso', req.params.id, data);
    if (!changes) return res.status(404).json({ error: 'Usuario no encontrado o sin cambios.' });
    const { password_demo, ...usuario } = await getById('usuarios_acceso', req.params.id);
    res.json(usuario);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM usuarios_acceso WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Usuario no encontrado.' });
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error);
  }
});


app.post('/api/login-demo', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y password son obligatorios.' });

  try {
    const user = await db.get(
      "SELECT * FROM usuarios_acceso WHERE email = ? AND password_demo = ? AND estado = 'activo'",
      [email, password],
    );

    if (!user) return res.status(401).json({ error: 'Credenciales demo invalidas.' });
    const { password_demo, ...safeUser } = user;
    res.json({ usuario: safeUser });
  } catch (error) {
    sendDbError(res, error);
  }
});

crudRoutes({
  basePath: '/api/actividades',
  table: 'actividades_escolares',
  allowedFields: ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'],
  requiredFields: ['titulo', 'descripcion', 'nivel', 'fecha'],
  orderBy: 'fecha ASC, id DESC',
});

crudRoutes({
  basePath: '/api/galeria',
  table: 'galeria_imagenes',
  allowedFields: ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'],
  requiredFields: ['titulo', 'url_imagen'],
  orderBy: 'id DESC',
});

app.post('/api/contacto', async (req, res) => {
  const missing = requireFields(req.body, ['nombre', 'email', 'mensaje']);
  if (missing.length > 0) return res.status(400).json({ error: `Faltan campos obligatorios: ${missing.join(', ')}.` });
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
    res.json(await db.all('SELECT * FROM contacto_mensajes ORDER BY fecha_recepcion DESC, id DESC'));
  } catch (error) {
    sendDbError(res, error);
  }
});

crudRoutes({
  basePath: '/api/materias',
  table: 'materias',
  allowedFields: ['nombre', 'descripcion'],
  requiredFields: ['nombre'],
  orderBy: 'nombre ASC',
});

crudRoutes({
  basePath: '/api/deportes',
  table: 'deportes',
  allowedFields: ['nombre', 'descripcion', 'profesor_id'],
  requiredFields: ['nombre'],
  orderBy: 'nombre ASC',
});

crudRoutes({
  basePath: '/api/grupos-deporte',
  table: 'grupos_deporte',
  allowedFields: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id'],
  requiredFields: ['deporte_id', 'nivel'],
  orderBy: 'deporte_id, nivel, dia',
});

crudRoutes({
  basePath: '/api/recorridos',
  table: 'recorridos_transporte',
  allowedFields: ['nombre', 'descripcion', 'horario', 'zona'],
  requiredFields: ['nombre'],
  orderBy: 'id',
});

function parseTimeRange(horario) {
  const parts = String(horario).split('-').map((part) => part.trim());
  if (parts.length !== 2) return null;
  const toMinutes = (value) => {
    const [h, m] = value.split(':').map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const start = toMinutes(parts[0]);
  const end = toMinutes(parts[1]);
  if (start === null || end === null) return null;
  return { start, end };
}

function horariosConflict(horarioA, horarioB) {
  const a = parseTimeRange(horarioA);
  const b = parseTimeRange(horarioB);
  if (!a || !b) return horarioA === horarioB;
  return a.start < b.end && b.start < a.end;
}

async function createInscripcion(req, res) {
  const data = normalizeBody(req.body);
  const tipo = data.tipo;
  const alumnoId = Number(data.alumno_id);

  if (!alumnoId) return res.status(400).json({ error: 'alumno_id es obligatorio.' });
  if (!['deporte', 'transporte', 'comedor'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo de inscripcion invalido (deporte, transporte o comedor).' });
  }

  try {
    const alumno = await db.get('SELECT * FROM alumnos WHERE id = ?', [alumnoId]);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

    const grupoDeporteId = tipo === 'deporte' ? Number(data.grupo_deporte_id) : null;
    const recorridoId = tipo === 'transporte' ? Number(data.recorrido_id) : null;

    if (tipo === 'deporte') {
      if (!grupoDeporteId) return res.status(400).json({ error: 'grupo_deporte_id es obligatorio para inscripciones deportivas.' });

      const grupo = await db.get('SELECT * FROM grupos_deporte WHERE id = ?', [grupoDeporteId]);
      if (!grupo) return res.status(404).json({ error: 'Grupo deportivo no encontrado.' });
      if (grupo.nivel !== alumno.nivel) {
        return res.status(400).json({ error: 'El grupo deportivo no corresponde al nivel del alumno.' });
      }

      const inscripcionesDeportivas = await db.all(
        "SELECT id, grupo_deporte_id FROM inscripciones WHERE alumno_id = ? AND tipo = 'deporte'",
        [alumnoId],
      );

      if (inscripcionesDeportivas.some((inscripcion) => inscripcion.grupo_deporte_id === grupoDeporteId)) {
        return res.status(409).json({ error: 'El alumno ya esta inscripto en este grupo deportivo.' });
      }

      if (inscripcionesDeportivas.length >= 2) {
        return res.status(409).json({ error: 'El alumno ya esta inscripto a dos deportes (maximo permitido).' });
      }

      for (const inscripcion of inscripcionesDeportivas) {
        const otroGrupo = await db.get('SELECT * FROM grupos_deporte WHERE id = ?', [inscripcion.grupo_deporte_id]);
        if (otroGrupo && otroGrupo.dia === grupo.dia && horariosConflict(otroGrupo.horario, grupo.horario)) {
          return res.status(409).json({ error: 'Conflicto de horario con otra actividad deportiva del alumno.' });
        }
      }
    } else if (tipo === 'transporte') {
      if (!recorridoId) return res.status(400).json({ error: 'recorrido_id es obligatorio para inscripciones de transporte.' });

      const recorrido = await db.get('SELECT * FROM recorridos_transporte WHERE id = ?', [recorridoId]);
      if (!recorrido) return res.status(404).json({ error: 'Recorrido no encontrado.' });

      const existing = await db.get("SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'transporte'", [alumnoId]);
      if (existing) return res.status(409).json({ error: 'El alumno ya esta inscripto al servicio de transporte.' });
    } else {
      const existing = await db.get("SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'comedor'", [alumnoId]);
      if (existing) return res.status(409).json({ error: 'El alumno ya esta inscripto al servicio de comedor.' });
    }

    const id = await db.insert('inscripciones', {
      alumno_id: alumnoId,
      tipo,
      grupo_deporte_id: grupoDeporteId,
      recorrido_id: recorridoId,
    });
    res.status(201).json(await getById('inscripciones', id));
  } catch (error) {
    sendDbError(res, error);
  }
}

app.get('/api/inscripciones', async (_req, res) => {
  try {
    const [inscripciones, alumnos, grupos, deportes, recorridos] = await Promise.all([
      db.all('SELECT * FROM inscripciones ORDER BY fecha_inscripcion DESC, id DESC'),
      db.all('SELECT * FROM alumnos'),
      db.all('SELECT * FROM grupos_deporte'),
      db.all('SELECT * FROM deportes'),
      db.all('SELECT * FROM recorridos_transporte'),
    ]);

    const alumnosById = new Map(alumnos.map((a) => [a.id, a]));
    const gruposById = new Map(grupos.map((g) => [g.id, g]));
    const deportesById = new Map(deportes.map((d) => [d.id, d]));
    const recorridosById = new Map(recorridos.map((r) => [r.id, r]));

    res.json(
      inscripciones.map((inscripcion) => {
        const grupo = gruposById.get(inscripcion.grupo_deporte_id);
        return {
          ...inscripcion,
          alumno: alumnosById.get(inscripcion.alumno_id) ?? null,
          grupo: grupo ?? null,
          deporte: grupo ? deportesById.get(grupo.deporte_id) ?? null : null,
          recorrido: recorridosById.get(inscripcion.recorrido_id) ?? null,
        };
      }),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/inscripciones', createInscripcion);

app.delete('/api/inscripciones/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM inscripciones WHERE id = ?', [req.params.id]);
    if (!result.changes) return res.status(404).json({ error: 'Inscripcion no encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error);
  }
});

async function loadReportData() {
  const [alumnos, docentes, cursos, asignaciones, deportes, grupos, recorridos, inscripciones] = await Promise.all([
    db.all('SELECT * FROM alumnos ORDER BY nivel, curso, apellido, nombre'),
    db.all('SELECT * FROM docentes ORDER BY apellido, nombre'),
    db.all('SELECT * FROM cursos ORDER BY nivel, anio, division'),
    db.all('SELECT * FROM asignaciones_docentes'),
    db.all('SELECT * FROM deportes ORDER BY nombre'),
    db.all('SELECT * FROM grupos_deporte'),
    db.all('SELECT * FROM recorridos_transporte ORDER BY id'),
    db.all('SELECT * FROM inscripciones'),
  ]);

  const byId = (rows) => new Map(rows.map((r) => [r.id, r]));

  return {
    alumnos,
    docentes,
    cursos,
    asignaciones,
    deportes,
    grupos,
    recorridos,
    inscripciones,
    alumnosById: byId(alumnos),
    docentesById: byId(docentes),
    cursosById: byId(cursos),
    deportesById: byId(deportes),
    gruposById: byId(grupos),
    recorridosById: byId(recorridos),
  };
}

function findCursoDeAlumno(data, alumno) {
  return (
    data.cursos.find(
      (curso) => curso.nivel === alumno.nivel && curso.anio === alumno.curso && curso.division === alumno.division,
    ) ?? null
  );
}

app.get('/api/reportes/alumno/:id', async (req, res) => {
  try {
    const data = await loadReportData();
    const alumno = data.alumnosById.get(Number(req.params.id));
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

    const curso = findCursoDeAlumno(data, alumno);

    const materias = data.asignaciones
      .filter((asignacion) => asignacion.curso_id === curso?.id)
      .map((asignacion) => ({
        materia: asignacion.materia,
        dia: asignacion.dia,
        horario: asignacion.horario,
        profesor: data.docentesById.get(asignacion.docente_id) ?? null,
      }));

    const inscripcionesAlumno = data.inscripciones.filter((i) => i.alumno_id === alumno.id);

    const deportes = inscripcionesAlumno
      .filter((i) => i.tipo === 'deporte')
      .map((i) => {
        const grupo = data.gruposById.get(i.grupo_deporte_id);
        return {
          deporte: grupo ? data.deportesById.get(grupo.deporte_id) ?? null : null,
          grupo,
          dia: grupo?.dia,
          horario: grupo?.horario,
          profesor: grupo ? data.docentesById.get(grupo.profesor_id) ?? null : null,
        };
      });

    const transporte = inscripcionesAlumno
      .filter((i) => i.tipo === 'transporte')
      .map((i) => data.recorridosById.get(i.recorrido_id) ?? null);

    const comedor = inscripcionesAlumno.some((i) => i.tipo === 'comedor');

    res.json({ alumno, curso, materias, deportes, transporte, comedor });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/docente/:id', async (req, res) => {
  try {
    const data = await loadReportData();
    const docente = data.docentesById.get(Number(req.params.id));
    if (!docente) return res.status(404).json({ error: 'Docente no encontrado.' });

    const asignaciones = data.asignaciones.filter((a) => a.docente_id === docente.id);

    const cursos = asignaciones.map((asignacion) => {
      const curso = data.cursosById.get(asignacion.curso_id);
      const alumnosDelCurso = data.alumnos.filter(
        (alumno) => alumno.nivel === curso?.nivel && alumno.curso === curso?.anio && alumno.division === curso?.division,
      );
      return {
        curso,
        materia: asignacion.materia,
        dia: asignacion.dia,
        horario: asignacion.horario,
        alumnos: alumnosDelCurso.map((alumno) => ({
          legajo: alumno.legajo,
          apellido: alumno.apellido,
          nombre: alumno.nombre,
          nivel: alumno.nivel,
          curso: alumno.curso,
        })),
      };
    });

    const materiasACargo = [...new Set(asignaciones.map((a) => a.materia))];

    const gruposDeporte = data.grupos
      .filter((grupo) => grupo.profesor_id === docente.id)
      .map((grupo) => ({ grupo, deporte: data.deportesById.get(grupo.deporte_id) ?? null }));

    res.json({ docente, cursos, materiasACargo, gruposDeporte });
  } catch (error) {
    sendDbError(res, error);
  }
});

function alumnosDeGrupo(data, grupoId) {
  return data.inscripciones
    .filter((i) => i.tipo === 'deporte' && i.grupo_deporte_id === grupoId)
    .map((i) => {
      const alumno = data.alumnosById.get(i.alumno_id);
      return alumno
        ? { legajo: alumno.legajo, apellido: alumno.apellido, nombre: alumno.nombre, curso: alumno.curso, nivel: alumno.nivel }
        : null;
    })
    .filter(Boolean);
}

app.get('/api/reportes/alumnos-por-deporte', async (_req, res) => {
  try {
    const data = await loadReportData();
    res.json(
      data.deportes.map((deporte) => ({
        deporte: deporte.nombre,
        profesor: data.docentesById.get(deporte.profesor_id) ?? null,
        grupos: data.grupos
          .filter((grupo) => grupo.deporte_id === deporte.id)
          .map((grupo) => ({
            nivel: grupo.nivel,
            dia: grupo.dia,
            horario: grupo.horario,
            profesor: data.docentesById.get(grupo.profesor_id) ?? null,
            alumnos: alumnosDeGrupo(data, grupo.id),
          })),
      })),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/alumnos-por-deporte-nivel', async (_req, res) => {
  try {
    const data = await loadReportData();
    const resultado = [];

    for (const deporte of data.deportes) {
      const grupos = data.grupos.filter((grupo) => grupo.deporte_id === deporte.id);
      const niveles = [...new Set(grupos.map((g) => g.nivel))];
      for (const nivel of niveles) {
        const alumnos = data.inscripciones
          .filter((i) => {
            const grupo = data.gruposById.get(i.grupo_deporte_id);
            return i.tipo === 'deporte' && grupo?.deporte_id === deporte.id && grupo?.nivel === nivel;
          })
          .map((i) => {
            const alumno = data.alumnosById.get(i.alumno_id);
            return alumno ? { legajo: alumno.legajo, apellido: alumno.apellido, nombre: alumno.nombre, curso: alumno.curso } : null;
          })
          .filter(Boolean);

        resultado.push({ deporte: deporte.nombre, nivel, alumnos });
      }
    }

    res.json(resultado);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/alumnos-por-deporte-detalle', async (_req, res) => {
  try {
    const data = await loadReportData();
    res.json(
      data.grupos.map((grupo) => ({
        deporte: data.deportesById.get(grupo.deporte_id)?.nombre ?? null,
        nivel: grupo.nivel,
        dia: grupo.dia,
        horario: grupo.horario,
        profesor: data.docentesById.get(grupo.profesor_id) ?? null,
        alumnos: alumnosDeGrupo(data, grupo.id),
      })),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/alumnos-por-recorrido', async (_req, res) => {
  try {
    const data = await loadReportData();
    res.json(
      data.recorridos.map((recorrido) => ({
        recorrido: recorrido.nombre,
        horario: recorrido.horario,
        zona: recorrido.zona,
        alumnos: data.inscripciones
          .filter((i) => i.tipo === 'transporte' && i.recorrido_id === recorrido.id)
          .map((i) => {
            const alumno = data.alumnosById.get(i.alumno_id);
            return alumno ? { legajo: alumno.legajo, apellido: alumno.apellido, nombre: alumno.nombre, curso: alumno.curso, nivel: alumno.nivel } : null;
          })
          .filter(Boolean),
      })),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/alumnos-por-materia', async (_req, res) => {
  try {
    const data = await loadReportData();
    res.json(
      data.asignaciones.map((asignacion) => {
        const curso = data.cursosById.get(asignacion.curso_id);
        const docente = data.docentesById.get(asignacion.docente_id);
        const alumnos = data.alumnos
          .filter((alumno) => alumno.nivel === curso?.nivel && alumno.curso === curso?.anio && alumno.division === curso?.division)
          .map((alumno) => ({ legajo: alumno.legajo, apellido: alumno.apellido, nombre: alumno.nombre }));

        return {
          nivel: curso?.nivel ?? null,
          curso: curso ? `${curso.anio} ${curso.division}` : null,
          materia: asignacion.materia,
          profesor: docente ? `${docente.apellido}, ${docente.nombre}` : null,
          alumnos,
        };
      }),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/docentes-por-nivel', async (_req, res) => {
  try {
    const data = await loadReportData();
    const niveles = [...new Set(data.cursos.map((curso) => curso.nivel))];

    res.json(
      niveles.map((nivel) => {
        const cursosDelNivel = data.cursos.filter((curso) => curso.nivel === nivel);
        const cursoIds = cursosDelNivel.map((curso) => curso.id);
        const asignacionesDelNivel = data.asignaciones.filter((a) => cursoIds.includes(a.curso_id));
        const docenteIds = [...new Set(asignacionesDelNivel.map((a) => a.docente_id))];

        return {
          nivel,
          docentes: docenteIds.map((docenteId) => {
            const docente = data.docentesById.get(docenteId);
            const asignacionesDocente = asignacionesDelNivel.filter((a) => a.docente_id === docenteId);
            return {
              profesor: docente ? `${docente.apellido}, ${docente.nombre}` : null,
              materias: [...new Set(asignacionesDocente.map((a) => a.materia))],
              cursos: asignacionesDocente.map((a) => {
                const curso = data.cursosById.get(a.curso_id);
                return curso ? `${curso.anio} ${curso.division}` : null;
              }),
            };
          }),
        };
      }),
    );
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/reportes/alumnos-por-curso', async (_req, res) => {
  try {
    const data = await loadReportData();
    const resultado = data.cursos.map((curso) => {
      const alumnosDelCurso = data.alumnos.filter(
        (alumno) => alumno.nivel === curso.nivel && alumno.curso === curso.anio && alumno.division === curso.division,
      );
      return {
        nivel: curso.nivel,
        anio: curso.anio,
        division: curso.division,
        turno: curso.turno,
        alumnos: alumnosDelCurso.map((alumno) => ({
          id: alumno.id,
          legajo: alumno.legajo,
          apellido: alumno.apellido,
          nombre: alumno.nombre,
          dni: alumno.dni,
          email: alumno.email,
          telefono: alumno.telefono,
        })),
      };
    });
    res.json(resultado);
  } catch (error) {
    sendDbError(res, error);
  }
});


app.get('/api/asistencias', async (req, res) => {
  try {
    const { fecha, nivel, curso, division } = req.query;
    const conditions = [];
    const params = [];

    if (nivel) {
      conditions.push('nivel = ?');
      params.push(nivel);
    }
    if (curso) {
      conditions.push('curso = ?');
      params.push(curso);
    }
    if (division) {
      conditions.push('division = ?');
      params.push(division);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const alumnos = await db.all(`SELECT * FROM alumnos ${where} ORDER BY apellido, nombre`, params);

    const asistenciaById = new Map();
    if (fecha && alumnos.length > 0) {
      const ids = alumnos.map((alumno) => alumno.id);
      const placeholders = ids.map(() => '?').join(', ');
      const asistencias = await db.all(
        `SELECT * FROM asistencias_diarias WHERE fecha = ? AND alumno_id IN (${placeholders})`,
        [fecha, ...ids],
      );
      for (const asistencia of asistencias) {
        asistenciaById.set(asistencia.alumno_id, asistencia);
      }
    }

    res.json(alumnos.map((alumno) => ({ alumno, asistencia: asistenciaById.get(alumno.id) ?? null })));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.post('/api/asistencias', async (req, res) => {
  const data = normalizeBody(req.body);
  const { fecha, registros } = data;

  if (!fecha) return res.status(400).json({ error: 'fecha es obligatoria.' });
  if (!Array.isArray(registros)) return res.status(400).json({ error: 'registros es obligatorio (array).' });

  try {
    const resultado = [];
    for (const registro of registros) {
      const alumnoId = Number(registro.alumno_id);
      if (!alumnoId) continue;

      const presente = registro.presente ? 1 : 0;
      const observacion = registro.observacion ?? null;
      const existing = await db.get(
        'SELECT * FROM asistencias_diarias WHERE alumno_id = ? AND fecha = ?',
        [alumnoId, fecha],
      );

      let id;
      if (existing) {
        await db.run('UPDATE asistencias_diarias SET presente = ?, observacion = ? WHERE id = ?', [presente, observacion, existing.id]);
        id = existing.id;
      } else {
        id = await db.insert('asistencias_diarias', { alumno_id: alumnoId, fecha, presente, observacion });
      }

      resultado.push(await getById('asistencias_diarias', id));
    }
    res.status(201).json(resultado);
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/asistencias/alumno/:id', async (req, res) => {
  try {
    const alumno = await db.get('SELECT * FROM alumnos WHERE id = ?', [req.params.id]);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

    const registros = await db.all(
      'SELECT * FROM asistencias_diarias WHERE alumno_id = ? ORDER BY fecha DESC',
      [req.params.id],
    );
    const presentes = registros.filter((registro) => Number(registro.presente) === 1).length;
    const total = registros.length;

    res.json({
      alumno,
      registros,
      resumen: {
        presentes,
        ausentes: total - presentes,
        total,
        porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
      },
    });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.get('/api/padres/hijos', async (req, res) => {
  try {
    const email = req.query.email;
    const usuarioId = req.query.usuario_id ? Number(req.query.usuario_id) : null;
    if (!email && !usuarioId) return res.status(400).json({ error: 'email o usuario_id es obligatorio.' });
    if (usuarioId) {
      res.json(await db.all('SELECT * FROM alumnos WHERE usuario_padre_id = ? OR tutor_email = ? ORDER BY apellido, nombre', [usuarioId, email ?? '']));
      return;
    }
    res.json(await db.all('SELECT * FROM alumnos WHERE tutor_email = ? ORDER BY apellido, nombre', [email]));
  } catch (error) {
    sendDbError(res, error);
  }
});

app.delete('/api/padres/hijos/:alumnoId/inscripciones/:inscripcionId', async (req, res) => {
  const usuarioId = Number(req.query.usuario_id);
  const alumnoId = Number(req.params.alumnoId);
  const inscripcionId = Number(req.params.inscripcionId);
  if (!usuarioId || !alumnoId || !inscripcionId) return res.status(400).json({ error: 'Los identificadores son obligatorios.' });

  try {
    const child = await db.get("SELECT id FROM alumnos WHERE id = ? AND usuario_padre_id = ? AND estado = 'activo'", [alumnoId, usuarioId]);
    if (!child) return res.status(404).json({ error: 'El alumno no pertenece a esta cuenta familiar.' });
    const result = await db.run('DELETE FROM inscripciones WHERE id = ? AND alumno_id = ?', [inscripcionId, alumnoId]);
    if (!result.changes) return res.status(404).json({ error: 'Inscripcion no encontrada.' });
    res.json({ ok: true });
  } catch (error) {
    sendDbError(res, error);
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`API Educar para Transformar disponible en http://localhost:${PORT}`);
  });
}

export default app;

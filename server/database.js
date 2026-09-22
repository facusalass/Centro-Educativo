import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const postgresUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqliteDatabaseDir = process.env.VERCEL ? join(tmpdir(), 'educar-transformar') : join(__dirname, '..', 'database');

if (process.env.VERCEL && !postgresUrl) {
  throw new Error(
    'DATABASE_URL no esta configurada. Conecta una base Postgres persistente al proyecto desde Vercel Storage.',
  );
}

export const databaseMode = postgresUrl ? 'postgres' : 'sqlite';

let pool;
let sqlite;

if (databaseMode === 'postgres') {
  pool = new Pool({
    connectionString: postgresUrl,
    max: 1,
    ssl: postgresUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  });
} else {
  mkdirSync(sqliteDatabaseDir, { recursive: true });
  sqlite = new DatabaseSync(join(sqliteDatabaseDir, 'educar_transformar.sqlite'));
}

const sqliteSchema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS niveles_educativos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    etiqueta TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    fecha_nacimiento TEXT DEFAULT '',
    domicilio TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nivel TEXT NOT NULL,
    curso TEXT DEFAULT '',
    division TEXT DEFAULT '',
    tutor_nombre TEXT DEFAULT '',
    tutor_email TEXT DEFAULT '',
    tutor_telefono TEXT DEFAULT '',
    usuario_padre_id INTEGER,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    email TEXT NOT NULL,
    telefono TEXT DEFAULT '',
    especialidad TEXT NOT NULL,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nivel TEXT NOT NULL,
    anio TEXT DEFAULT '',
    division TEXT DEFAULT '',
    turno TEXT NOT NULL,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS asignaciones_docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    docente_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    FOREIGN KEY (docente_id) REFERENCES docentes(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'general',
    disponible INTEGER DEFAULT 1,
    icono TEXT DEFAULT 'school'
  );

  CREATE TABLE IF NOT EXISTS instalaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'educativa',
    disponible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS alumnos_servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    servicio_id INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
  );

  CREATE TABLE IF NOT EXISTS asistencias_diarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    presente INTEGER NOT NULL,
    observacion TEXT,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
  );

  CREATE TABLE IF NOT EXISTS evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  );

  CREATE TABLE IF NOT EXISTS calificaciones_alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    evaluacion_id INTEGER NOT NULL,
    calificacion REAL,
    observacion TEXT,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
  );

  CREATE TABLE IF NOT EXISTS usuarios_acceso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT DEFAULT '',
    nombre_usuario TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password_demo TEXT DEFAULT '',
    rol TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'docente', 'personal', 'admin')),
    estado TEXT DEFAULT 'activo',
    referencia_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS opiniones_web (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    autor_anonimo TEXT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_publicacion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_moderacion TEXT DEFAULT 'pendiente',
    visible INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_tutor TEXT NOT NULL,
    nombre_aspirante TEXT NOT NULL,
    nivel_solicitado TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_tramite TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS postulaciones_empleo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_candidato TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    puesto_interes TEXT NOT NULL,
    enlace_cv TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    contenido TEXT DEFAULT '',
    fecha_publicacion TEXT NOT NULL,
    tipo TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS actividades_escolares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel TEXT NOT NULL,
    fecha TEXT NOT NULL,
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS galeria_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    url_imagen TEXT NOT NULL,
    categoria TEXT DEFAULT 'Institucional',
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS contacto_mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    asunto TEXT DEFAULT 'Consulta web',
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'nuevo'
  );

  CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS deportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    profesor_id INTEGER,
    FOREIGN KEY (profesor_id) REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS grupos_deporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deporte_id INTEGER NOT NULL,
    nivel TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    profesor_id INTEGER,
    FOREIGN KEY (deporte_id) REFERENCES deportes(id),
    FOREIGN KEY (profesor_id) REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS recorridos_transporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    zona TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('deporte', 'transporte', 'comedor')),
    grupo_deporte_id INTEGER,
    recorrido_id INTEGER,
    fecha_inscripcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'activo',
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (grupo_deporte_id) REFERENCES grupos_deporte(id),
    FOREIGN KEY (recorrido_id) REFERENCES recorridos_transporte(id)
  );
`;

export const postgresSchema = `
  CREATE TABLE IF NOT EXISTS niveles_educativos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    etiqueta TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    fecha_nacimiento TEXT DEFAULT '',
    domicilio TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nivel TEXT NOT NULL,
    curso TEXT DEFAULT '',
    division TEXT DEFAULT '',
    tutor_nombre TEXT DEFAULT '',
    tutor_email TEXT DEFAULT '',
    tutor_telefono TEXT DEFAULT '',
    usuario_padre_id INTEGER,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    email TEXT NOT NULL,
    telefono TEXT DEFAULT '',
    especialidad TEXT NOT NULL,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    nivel TEXT NOT NULL,
    anio TEXT DEFAULT '',
    division TEXT DEFAULT '',
    turno TEXT NOT NULL,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS asignaciones_docentes (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id),
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    materia TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'general',
    disponible INTEGER DEFAULT 1,
    icono TEXT DEFAULT 'school'
  );

  CREATE TABLE IF NOT EXISTS instalaciones (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'educativa',
    disponible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS alumnos_servicios (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    servicio_id INTEGER NOT NULL REFERENCES servicios(id),
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS asistencias_diarias (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    fecha TEXT NOT NULL,
    presente INTEGER NOT NULL,
    observacion TEXT
  );

  CREATE TABLE IF NOT EXISTS evaluaciones (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    materia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calificaciones_alumnos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    evaluacion_id INTEGER NOT NULL REFERENCES evaluaciones(id),
    calificacion REAL,
    observacion TEXT
  );

  CREATE TABLE IF NOT EXISTS usuarios_acceso (
    id SERIAL PRIMARY KEY,
    nombre TEXT DEFAULT '',
    nombre_usuario TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password_demo TEXT DEFAULT '',
    rol TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'docente', 'personal', 'admin')),
    estado TEXT DEFAULT 'activo',
    referencia_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS opiniones_web (
    id SERIAL PRIMARY KEY,
    autor_anonimo TEXT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_publicacion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_moderacion TEXT DEFAULT 'pendiente',
    visible INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id SERIAL PRIMARY KEY,
    nombre_tutor TEXT NOT NULL,
    nombre_aspirante TEXT NOT NULL,
    nivel_solicitado TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_tramite TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS postulaciones_empleo (
    id SERIAL PRIMARY KEY,
    nombre_candidato TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    puesto_interes TEXT NOT NULL,
    enlace_cv TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    contenido TEXT DEFAULT '',
    fecha_publicacion TEXT NOT NULL,
    tipo TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS actividades_escolares (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel TEXT NOT NULL,
    fecha TEXT NOT NULL,
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS galeria_imagenes (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    url_imagen TEXT NOT NULL,
    categoria TEXT DEFAULT 'Institucional',
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS contacto_mensajes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    asunto TEXT DEFAULT 'Consulta web',
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'nuevo'
  );

  CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS deportes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    profesor_id INTEGER REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS grupos_deporte (
    id SERIAL PRIMARY KEY,
    deporte_id INTEGER NOT NULL REFERENCES deportes(id),
    nivel TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    profesor_id INTEGER REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS recorridos_transporte (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    zona TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('deporte', 'transporte', 'comedor')),
    grupo_deporte_id INTEGER REFERENCES grupos_deporte(id),
    recorrido_id INTEGER REFERENCES recorridos_transporte(id),
    fecha_inscripcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'activo'
  );
`;

function toPostgresQuery(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function fieldsToObject(fields, row) {
  return fields.reduce((data, field, index) => {
    data[field] = row[index];
    return data;
  }, {});
}

async function exec(sql) {
  if (databaseMode === 'postgres') {
    await pool.query(sql);
    return;
  }

  sqlite.exec(sql);
}

async function all(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await pool.query(toPostgresQuery(sql), params);
    return result.rows;
  }

  return sqlite.prepare(sql).all(...params);
}

async function get(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await pool.query(toPostgresQuery(sql), params);
    return result.rows[0];
  }

  return sqlite.prepare(sql).get(...params);
}

async function run(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await pool.query(toPostgresQuery(sql), params);
    return { changes: result.rowCount };
  }

  const result = sqlite.prepare(sql).run(...params);
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
}

async function insert(table, data, options = {}) {
  const fields = Object.keys(data);
  const values = fields.map((field) => data[field]);

  if (databaseMode === 'postgres') {
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
    const conflictClause = options.ignoreConflict ? ` ON CONFLICT (${options.ignoreConflict}) DO NOTHING` : '';
    const result = await pool.query(
      `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})${conflictClause} RETURNING id`,
      values,
    );
    return result.rows[0]?.id ?? null;
  }

  const placeholders = fields.map(() => '?').join(', ');
  const insertMode = options.ignoreConflict ? 'INSERT OR IGNORE' : 'INSERT';
  const result = sqlite
    .prepare(`${insertMode} INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`)
    .run(...values);
  return result.lastInsertRowid;
}

async function update(table, id, data) {
  const fields = Object.keys(data);
  if (fields.length === 0) return { changes: 0 };

  const setClause = fields.map((field) => `${field} = ?`).join(', ');
  const values = [...fields.map((field) => data[field]), id];
  return run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
}

async function hasColumn(tableName, columnName) {
  if (databaseMode === 'postgres') {
    const column = await get(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = ?`,
      [tableName, columnName],
    );
    return Boolean(column);
  }

  return sqlite.prepare(`PRAGMA table_info(${tableName})`).all().some((column) => column.name === columnName);
}

async function tableIsEmpty(tableName) {
  const row = await get(`SELECT COUNT(*) AS total FROM ${tableName}`);
  return Number(row.total) === 0;
}

async function insertMany(table, fields, rows, options = {}) {
  for (const row of rows) {
    await insert(table, fieldsToObject(fields, row), options);
  }
}

export const db = {
  exec,
  all,
  get,
  run,
  insert,
  update,
  hasColumn,
  tableIsEmpty,
};

const rlsTables = [
  'niveles_educativos',
  'alumnos',
  'docentes',
  'cursos',
  'materias',
  'asignaciones_docentes',
  'deportes',
  'grupos_deporte',
  'recorridos_transporte',
  'inscripciones',
  'servicios',
  'instalaciones',
  'alumnos_servicios',
  'asistencias_diarias',
  'evaluaciones',
  'calificaciones_alumnos',
  'usuarios_acceso',
  'opiniones_web',
  'solicitudes_inscripcion',
  'postulaciones_empleo',
  'noticias',
  'actividades_escolares',
  'galeria_imagenes',
  'contacto_mensajes',
];

async function enableRowLevelSecurity() {
  if (databaseMode !== 'postgres') return;
  for (const table of rlsTables) {
    await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }
}

export async function initializeDatabase() {
  if (process.env.VERCEL && process.env.DATABASE_SCHEMA_READY === 'true') {
    await get('SELECT 1');
    return;
  }
  await exec(databaseMode === 'postgres' ? postgresSchema : sqliteSchema);
  await runMigrations();
  await enableRowLevelSecurity();
  await seedDatabase();
}

async function runMigrations() {
  const columns = [
    ['alumnos', 'legajo', "TEXT DEFAULT ''"],
    ['alumnos', 'dni', "TEXT DEFAULT ''"],
    ['alumnos', 'fecha_nacimiento', "TEXT DEFAULT ''"],
    ['alumnos', 'domicilio', "TEXT DEFAULT ''"],
    ['alumnos', 'telefono', "TEXT DEFAULT ''"],
    ['alumnos', 'email', "TEXT DEFAULT ''"],
    ['alumnos', 'curso', "TEXT DEFAULT ''"],
    ['alumnos', 'division', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_nombre', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_email', "TEXT DEFAULT ''"],
    ['alumnos', 'tutor_telefono', "TEXT DEFAULT ''"],
    ['alumnos', 'usuario_padre_id', 'INTEGER'],
    ['alumnos', 'estado', "TEXT DEFAULT 'activo'"],
    ['alumnos', 'created_at', "TEXT DEFAULT ''"],
    ['docentes', 'legajo', "TEXT DEFAULT ''"],
    ['docentes', 'dni', "TEXT DEFAULT ''"],
    ['docentes', 'telefono', "TEXT DEFAULT ''"],
    ['docentes', 'estado', "TEXT DEFAULT 'activo'"],
    ['docentes', 'created_at', "TEXT DEFAULT ''"],
    ['cursos', 'anio', "TEXT DEFAULT ''"],
    ['cursos', 'division', "TEXT DEFAULT ''"],
    ['cursos', 'descripcion', "TEXT DEFAULT ''"],
    ['asignaciones_docentes', 'dia', "TEXT DEFAULT ''"],
    ['asignaciones_docentes', 'horario', "TEXT DEFAULT ''"],
    ['servicios', 'tipo', "TEXT DEFAULT 'general'"],
    ['servicios', 'disponible', 'INTEGER DEFAULT 1'],
    ['servicios', 'icono', "TEXT DEFAULT 'school'"],
    ['instalaciones', 'tipo', "TEXT DEFAULT 'educativa'"],
    ['instalaciones', 'disponible', 'INTEGER DEFAULT 1'],
    ['instalaciones', 'imagen_url', "TEXT DEFAULT ''"],
    ['noticias', 'contenido', "TEXT DEFAULT ''"],
    ['noticias', 'imagen_url', "TEXT DEFAULT ''"],
    ['opiniones_web', 'visible', 'INTEGER DEFAULT 1'],
    ['postulaciones_empleo', 'estado', "TEXT DEFAULT 'recibida'"],
    ['usuarios_acceso', 'nombre', "TEXT DEFAULT ''"],
    ['usuarios_acceso', 'password_demo', "TEXT DEFAULT ''"],
    ['usuarios_acceso', 'estado', "TEXT DEFAULT 'activo'"],
    ['usuarios_acceso', 'created_at', "TEXT DEFAULT ''"],
  ];

  for (const [table, column, definition] of columns) {
    await ensureColumn(table, column, definition);
  }
}

async function ensureColumn(tableName, columnName, definition) {
  if (!(await hasColumn(tableName, columnName))) {
    await exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function seedDatabase() {
  await seedNiveles();
  await seedServicios();
  await seedInstalaciones();
  await seedNoticias();
  await seedOpiniones();
  await seedDocentes();
  await seedMaterias();
  await seedDeportes();
  await seedGruposDeporte();
  await seedRecorridos();
  await seedCursos();
  await seedAlumnos();
  await seedAsignaciones();
  await seedUsuarios();
  await seedActividades();
  await seedGaleria();
  await seedInscripciones();
  await ensureDemoParentChild();
}

async function ensureDemoParentChild() {
  const parent = await get('SELECT id, email FROM usuarios_acceso WHERE email = ?', ['padre@educar.com']);
  if (!parent) return;

  const studentAccount = await get(
    "SELECT referencia_id FROM usuarios_acceso WHERE email = 'alumno@educar.com' AND rol = 'alumno'",
  );
  const sharedChild = studentAccount?.referencia_id
    ? await get('SELECT * FROM alumnos WHERE id = ?', [studentAccount.referencia_id])
    : null;
  const linkedChild = sharedChild ?? await get('SELECT * FROM alumnos WHERE usuario_padre_id = ? OR tutor_email = ? LIMIT 1', [parent.id, parent.email]);

  if (linkedChild) {
    if (studentAccount?.referencia_id === linkedChild.id) {
      await run(
        'UPDATE usuarios_acceso SET nombre = ? WHERE email = ? AND rol = ?',
        [`${linkedChild.nombre} ${linkedChild.apellido}`, 'alumno@educar.com', 'alumno'],
      );
    }
    await run(
      'UPDATE alumnos SET usuario_padre_id = ?, tutor_nombre = ?, tutor_email = ? WHERE id = ?',
      [parent.id, parent.email, parent.email, linkedChild.id],
    );
    await run(
      "UPDATE alumnos SET usuario_padre_id = NULL, tutor_email = '' WHERE usuario_padre_id = ? AND id <> ?",
      [parent.id, linkedChild.id],
    );
    await ensureDemoChildEnrollment(linkedChild.id);
    return;
  }

  const childId = await insert('alumnos', {
    nombre: 'Mateo',
    apellido: 'Fernandez',
    legajo: 'A-2027-004',
    dni: '51222333',
    fecha_nacimiento: '2017-06-18',
    domicilio: 'Av. Alberdi 456',
    telefono: '3624011004',
    email: 'mateo.fernandez@educar.com',
    nivel: 'Primario',
    curso: '3ro',
    division: 'A',
    tutor_nombre: parent.email,
    tutor_email: parent.email,
    tutor_telefono: '3624011005',
    usuario_padre_id: parent.id,
    estado: 'activo',
  });
  await ensureDemoChildEnrollment(childId);
}

async function ensureDemoChildEnrollment(childId) {
  const child = await get('SELECT nivel FROM alumnos WHERE id = ?', [childId]);
  const existingSport = await get("SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'deporte' LIMIT 1", [childId]);
  const group = await get('SELECT id FROM grupos_deporte WHERE nivel = ? ORDER BY id LIMIT 1', [child?.nivel]);
  if (group && !existingSport) {
    await insert('inscripciones', {
      alumno_id: childId,
      tipo: 'deporte',
      grupo_deporte_id: group.id,
      recorrido_id: null,
    });
  }
}

async function seedNiveles() {
  if (!(await tableIsEmpty('niveles_educativos'))) return;
  await insertMany(
    'niveles_educativos',
    ['nombre', 'descripcion', 'etiqueta'],
    [
      ['Nivel Inicial', 'Educacion temprana basada en el juego, la exploracion y el desarrollo socioemocional.', 'Salas de 3, 4 y 5'],
      ['Nivel Primario', 'Formacion integral para construir habitos de estudio, pensamiento critico y valores comunitarios.', '1ro a 7mo grado'],
      ['Nivel Secundario', 'Preparacion academica con orientacion vocacional, tecnologia e idiomas.', 'Ciclo basico y orientado'],
    ],
  );
}

async function seedServicios() {
  if (!(await tableIsEmpty('servicios'))) return;
  await insertMany(
    'servicios',
    ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'],
    [
      ['Comedor', 'Menu escolar planificado para acompanar la jornada extendida.', 'bienestar', 1, 'utensils'],
      ['Enfermeria', 'Atencion primaria y seguimiento de situaciones de salud dentro de la institucion.', 'salud', 1, 'heart-pulse'],
      ['Idiomas', 'Ingles y talleres complementarios para todos los niveles.', 'academico', 1, 'languages'],
      ['Deportes', 'Actividades deportivas, torneos y acompanamiento fisico saludable.', 'deportivo', 1, 'trophy'],
      ['Transporte', 'Servicio de traslado planificado para familias de Resistencia y alrededores.', 'logistica', 1, 'bus'],
    ],
  );
}

async function seedInstalaciones() {
  if (!(await tableIsEmpty('instalaciones'))) return;
  await insertMany(
    'instalaciones',
    ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'],
    [
      ['Aulas equipadas', 'Espacios luminosos con mobiliario flexible y recursos digitales.', 'academica', 1, 'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Laboratorios', 'Ambientes preparados para ciencias, tecnologia y experiencias practicas.', 'academica', 1, 'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Gimnasio', 'Area cubierta para educacion fisica, encuentros y actividades institucionales.', 'deportiva', 1, 'https://images.unsplash.com/photo-1759641801965-a15a53b877b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Pileta', 'Espacio recreativo y deportivo para propuestas acuaticas supervisadas.', 'deportiva', 1, 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Canchas', 'Sectores exteriores para deportes, recreos y actividades grupales.', 'deportiva', 1, 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ],
  );
}

async function seedNoticias() {
  if (!(await tableIsEmpty('noticias'))) return;
  await insertMany(
    'noticias',
    ['titulo', 'descripcion', 'contenido', 'fecha_publicacion', 'tipo', 'visible', 'imagen_url'],
    [
      ['Proceso de inscripcion 2027 abierto', 'Ya se encuentra disponible la solicitud de inscripcion para familias interesadas.', 'Las familias pueden completar el formulario web y esperar el contacto administrativo para avanzar con la entrevista inicial.', '2026-05-01', 'Inscripcion', 1, 'https://images.unsplash.com/photo-1758270705639-9727f350f026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Recorrida por las nuevas instalaciones', 'Invitamos a conocer los espacios proyectados para aulas, laboratorios y deporte.', 'La recorrida institucional permite presentar el campus educativo y responder consultas de las familias.', '2026-04-15', 'Institucional', 1, 'https://images.unsplash.com/photo-1774386897531-1f5d7741409c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
      ['Presentacion del proyecto pedagogico', 'La institucion presento su propuesta centrada en excelencia academica e innovacion.', 'El proyecto articula acompanamiento, tecnologia, idiomas, deportes y actividades escolares.', '2026-04-10', 'Academica', 1, 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900'],
    ],
  );
}

async function seedOpiniones() {
  if (!(await tableIsEmpty('opiniones_web'))) return;
  await insertMany(
    'opiniones_web',
    ['autor_anonimo', 'comentario', 'estado_moderacion', 'visible'],
    [
      ['Madre de familia', 'La propuesta institucional transmite organizacion, cercania y una mirada integral sobre cada estudiante.', 'visible', 1],
      ['Tutor interesado', 'Nos gusto que el proyecto combine formacion academica, deportes, idiomas y acompanamiento personalizado.', 'visible', 1],
      ['Docente postulante', 'Se percibe un espacio de trabajo serio, colaborativo y con oportunidades de crecimiento profesional.', 'pendiente', 0],
    ],
  );
}

async function seedDocentes() {
  if (!(await tableIsEmpty('docentes'))) return;
  await insertMany(
    'docentes',
    ['nombre', 'apellido', 'legajo', 'dni', 'email', 'telefono', 'especialidad', 'estado'],
    [
      ['Laura', 'Benitez', 'D-0001', '30111222', 'laura.benitez@educar.com', '3624001001', 'Nivel Inicial', 'activo'],
      ['Martin', 'Aguirre', 'D-0002', '28999888', 'martin.aguirre@educar.com', '3624001002', 'Nivel Primario', 'activo'],
      ['Carolina', 'Molina', 'D-0003', '32777444', 'carolina.molina@educar.com', '3624001003', 'Ciencias', 'activo'],
    ],
  );
}

async function seedMaterias() {
  if (!(await tableIsEmpty('materias'))) return;
  await insertMany(
    'materias',
    ['nombre', 'descripcion'],
    [
      ['Matematica', 'Razonamiento logico, algebra y geometria.'],
      ['Lengua y Literatura', 'Comprension lectora y produccion de textos.'],
      ['Ciencias Naturales', 'Biologia, fisica y quimica.'],
      ['Ciencias Sociales', 'Historia, geografia y formacion ciudadana.'],
      ['Ingles', 'Idioma extranjero.'],
      ['Educacion Fisica', 'Actividad fisica y deportes.'],
      ['Ambiente natural y social', 'Exploracion del entorno para nivel inicial.'],
    ],
  );
}

async function seedDeportes() {
  if (!(await tableIsEmpty('deportes'))) return;
  await insertMany(
    'deportes',
    ['nombre', 'descripcion', 'profesor_id'],
    [
      ['Futbol', 'Entrenamiento y competencias de futbol.', 3],
      ['Voley', 'Iniciacion y tecnica de voley.', 2],
      ['Natacion', 'Natacion recreativa y deportiva en pileta cubierta.', 1],
      ['Atletismo', 'Pruebas de pista y campo.', 3],
    ],
  );
}

async function seedGruposDeporte() {
  if (!(await tableIsEmpty('grupos_deporte'))) return;
  await insertMany(
    'grupos_deporte',
    ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id'],
    [
      [1, 'Primario', 'Lunes', '10:00 - 11:30', 3],
      [1, 'Secundario', 'Martes', '14:00 - 15:30', 3],
      [2, 'Secundario', 'Miercoles', '15:00 - 16:30', 2],
      [3, 'Inicial', 'Jueves', '09:00 - 10:00', 1],
      [4, 'Secundario', 'Viernes', '14:00 - 15:30', 3],
    ],
  );
}

async function seedRecorridos() {
  if (!(await tableIsEmpty('recorridos_transporte'))) return;
  await insertMany(
    'recorridos_transporte',
    ['nombre', 'descripcion', 'horario', 'zona'],
    [
      ['Recorrido 1 - Norte', 'Barrios de la zona norte de Resistencia.', '07:00', 'Norte'],
      ['Recorrido 2 - Sur', 'Barrios de la zona sur de Resistencia.', '07:10', 'Sur'],
      ['Recorrido 3 - Este', 'Barrios de la zona este de Resistencia.', '07:20', 'Este'],
      ['Recorrido 4 - Oeste', 'Barrios de la zona oeste y alrededores.', '07:30', 'Oeste'],
    ],
  );
}

async function seedInscripciones() {
  if (!(await tableIsEmpty('inscripciones'))) return;
  await insertMany(
    'inscripciones',
    ['alumno_id', 'tipo', 'grupo_deporte_id', 'recorrido_id'],
    [
      [2, 'deporte', 1, null],
      [2, 'transporte', null, 1],
      [3, 'deporte', 2, null],
      [3, 'deporte', 3, null],
      [1, 'comedor', null, null],
    ],
  );
}

async function seedCursos() {
  if (!(await tableIsEmpty('cursos'))) return;
  await insertMany(
    'cursos',
    ['nivel', 'anio', 'division', 'turno', 'descripcion'],
    [
      ['Inicial', 'Sala de 5', 'A', 'Manana', 'Grupo de preparacion para primer grado.'],
      ['Primario', '4to', 'A', 'Manana', 'Curso de nivel primario con jornada extendida opcional.'],
      ['Secundario', '1ro', 'A', 'Tarde', 'Primer ano del ciclo basico secundario.'],
    ],
  );
}

async function seedAlumnos() {
  if (!(await tableIsEmpty('alumnos'))) return;
  await insertMany(
    'alumnos',
    ['nombre', 'apellido', 'legajo', 'dni', 'fecha_nacimiento', 'domicilio', 'telefono', 'email', 'nivel', 'curso', 'division', 'tutor_nombre', 'tutor_email', 'tutor_telefono', 'estado'],
    [
      ['Sofia', 'Ramirez', 'A-2027-001', '53111222', '2021-08-12', 'Av. Sarmiento 1234', '3624011101', 'sofia.ramirez@educar.com', 'Inicial', 'Sala de 5', 'A', 'Mariana Ramirez', 'mariana.demo@educar.com', '3624011001', 'activo'],
      ['Tomas', 'Pereyra', 'A-2027-002', '50122333', '2016-03-25', 'Calle San Martin 456', '3624011102', 'tomas.pereyra@educar.com', 'Primario', '4to', 'A', 'Lucas Pereyra', 'lucas.demo@educar.com', '3624011002', 'activo'],
      ['Valentina', 'Gomez', 'A-2027-003', '48133444', '2013-10-05', 'Av. 9 de Julio 789', '3624011103', 'valentina.gomez@educar.com', 'Secundario', '1ro', 'A', 'Paula Gomez', 'paula.demo@educar.com', '3624011003', 'activo'],
    ],
  );
}

async function seedAsignaciones() {
  if (!(await tableIsEmpty('asignaciones_docentes'))) return;
  await insertMany(
    'asignaciones_docentes',
    ['docente_id', 'curso_id', 'materia', 'dia', 'horario'],
    [
      [1, 1, 'Ambiente natural y social', 'Lunes', '08:00 - 10:00'],
      [2, 2, 'Matematica', 'Martes', '09:00 - 11:00'],
      [3, 3, 'Ciencias Naturales', 'Miercoles', '14:00 - 16:00'],
    ],
  );
}

async function seedUsuarios() {
  await insertMany(
    'usuarios_acceso',
    ['nombre', 'nombre_usuario', 'email', 'password_demo', 'rol', 'estado', 'referencia_id'],
    [
      ['Administrador Demo', 'admin_educar', 'admin@educar.com', 'admin123', 'admin', 'activo', null],
      ['Docente Demo', 'docente_educar', 'docente@educar.com', 'docente123', 'docente', 'activo', 1],
      ['Padre Demo', 'padre_educar', 'padre@educar.com', 'padre123', 'padre', 'activo', null],
      ['Mariana Ramirez', 'padre_mariana', 'mariana.demo@educar.com', 'padre123', 'padre', 'activo', null],
      ['Lucas Pereyra', 'padre_lucas', 'lucas.demo@educar.com', 'padre123', 'padre', 'activo', null],
      ['Paula Gomez', 'padre_paula', 'paula.demo@educar.com', 'padre123', 'padre', 'activo', null],
      ['Alumno Demo', 'alumno_educar', 'alumno@educar.com', 'alumno123', 'alumno', 'activo', 1],
      ['Personal Demo', 'personal_educar', 'personal@educar.com', 'personal123', 'personal', 'activo', null],
    ],
    { ignoreConflict: 'email' },
  );
}

async function seedActividades() {
  if (!(await tableIsEmpty('actividades_escolares'))) return;
  await insertMany(
    'actividades_escolares',
    ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'],
    [
      ['Jornada de bienvenida familiar', 'Encuentro institucional para presentar equipos, espacios y modalidad de trabajo.', 'Todos los niveles', '2027-03-04', 1],
      ['Taller de lectura compartida', 'Actividad de promocion lectora para estudiantes de nivel primario.', 'Primario', '2027-04-12', 1],
      ['Muestra de ciencias y tecnologia', 'Presentacion de experiencias de laboratorio y proyectos interdisciplinarios.', 'Secundario', '2027-06-18', 1],
    ],
  );
}

async function seedGaleria() {
  if (!(await tableIsEmpty('galeria_imagenes'))) return;
  await insertMany(
    'galeria_imagenes',
    ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'],
    [
      ['Aulas equipadas', 'Espacios flexibles para el aprendizaje.', 'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Instalaciones', 1],
      ['Laboratorio escolar', 'Practicas de ciencias y tecnologia.', 'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Academico', 1],
      ['Actividad deportiva', 'Propuestas fisicas y recreativas.', 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Deportes', 1],
      ['Campus educativo', 'Predio amplio en las afueras de Resistencia.', 'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900', 'Institucional', 1],
    ],
  );
}

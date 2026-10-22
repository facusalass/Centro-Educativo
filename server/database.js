import { sqliteSchema, postgresSchema } from './data/schema.js';
import { createDemoSeeder } from './data/demo-seed.js';
export { postgresSchema } from './data/schema.js';
import { AsyncLocalStorage } from 'node:async_hooks';
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
const sqliteDatabaseDir = process.env.VERCEL
  ? join(tmpdir(), 'educar-transformar')
  : join(__dirname, '..', 'database');

if (process.env.VERCEL && !postgresUrl) {
  throw new Error(
    'DATABASE_URL no esta configurada. Conecta una base Postgres persistente al proyecto desde Vercel Storage.',
  );
}

export const databaseMode = postgresUrl ? 'postgres' : 'sqlite';
if (process.env.NODE_ENV === 'production' && !postgresUrl)
  throw new Error('DATABASE_URL es obligatoria en producción.');
const transactionContext = new AsyncLocalStorage();
let sqliteQueue = Promise.resolve();
const queryClient = () => transactionContext.getStore() ?? pool;

let pool;
let sqlite;

if (databaseMode === 'postgres') {
  pool = new Pool({
    connectionString: postgresUrl,
    max: Number(process.env.DATABASE_POOL_SIZE || 5),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: postgresUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
  });
} else {
  mkdirSync(sqliteDatabaseDir, { recursive: true });
  sqlite = new DatabaseSync(
    process.env.SQLITE_PATH ?? join(sqliteDatabaseDir, 'educar_transformar.sqlite'),
  );
}

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
    await queryClient().query(sql);
    return;
  }

  sqlite.exec(sql);
}

/** @returns {Promise<Record<string, any>[]>} */
async function all(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await queryClient().query(toPostgresQuery(sql), params);
    return result.rows;
  }

  return sqlite.prepare(sql).all(...params);
}

/** @returns {Promise<any>} */
async function get(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await queryClient().query(toPostgresQuery(sql), params);
    return result.rows[0];
  }

  return sqlite.prepare(sql).get(...params);
}

async function run(sql, params = []) {
  if (databaseMode === 'postgres') {
    const result = await queryClient().query(toPostgresQuery(sql), params);
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
    const conflictClause = options.ignoreConflict
      ? ` ON CONFLICT (${options.ignoreConflict}) DO NOTHING`
      : '';
    const result = await queryClient().query(
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

  return sqlite
    .prepare(`PRAGMA table_info(${tableName})`)
    .all()
    .some((column) => column.name === columnName);
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

// A transaction always uses one checked-out Postgres connection. The domain lock
// serializes school writes across instances; reads remain concurrent (MVCC).
async function transaction(work) {
  if (transactionContext.getStore()) return work();
  if (databaseMode === 'postgres') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(1902027)');
      const result = await transactionContext.run(client, work);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  const previous = sqliteQueue;
  let release;
  sqliteQueue = new Promise((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    sqlite.exec('BEGIN IMMEDIATE');
    const result = await transactionContext.run({ sqlite: true }, work);
    sqlite.exec('COMMIT');
    return result;
  } catch (error) {
    sqlite.exec('ROLLBACK');
    throw error;
  } finally {
    release();
  }
}

export const db = {
  transaction,
  close: async () => {
    if (pool) await pool.end();
    if (sqlite) sqlite.close();
  },
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
    await queryClient().query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  }
}

export async function initializeDatabase() {
  // Warm/cold serverless starts only verify the version, without rerunning DDL.
  if (process.env.SEED_DEMO !== 'true') {
    try {
      if (
        Number((await get('SELECT MAX(version) AS version FROM schema_migrations'))?.version) >= 4
      )
        return;
    } catch (error) {
      if (error.code !== '42P01' && !String(error.message).includes('no such table')) throw error;
    }
  }
  await transaction(async () => {
    await exec(databaseMode === 'postgres' ? postgresSchema : sqliteSchema);
    await runMigrations();
    await enableRowLevelSecurity();
    if (process.env.SEED_DEMO === 'true') await seedDatabase();
    const { migrateCore } = await import('./core/migrations.ts');
    await migrateCore();
    const { migrateConstraints } = await import('./core/constraints.ts');
    await migrateConstraints();
  });
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

const seedDatabase = createDemoSeeder({ tableIsEmpty, insertMany, insert, get, run });

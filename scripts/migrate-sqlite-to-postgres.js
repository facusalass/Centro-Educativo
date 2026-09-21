import pg from 'pg';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { postgresSchema } from '../server/database.js';

const { Pool } = pg;

const sqlitePath = resolve(process.argv.find((argument) => argument.startsWith('--sqlite='))?.slice(9) ?? 'database/educar_transformar.sqlite');
const replaceTarget = process.argv.includes('--replace');
const postgresUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

const tables = [
  'niveles_educativos',
  'alumnos',
  'docentes',
  'cursos',
  'servicios',
  'instalaciones',
  'usuarios_acceso',
  'opiniones_web',
  'solicitudes_inscripcion',
  'postulaciones_empleo',
  'noticias',
  'actividades_escolares',
  'galeria_imagenes',
  'contacto_mensajes',
  'asignaciones_docentes',
  'alumnos_servicios',
  'asistencias_diarias',
  'evaluaciones',
  'calificaciones_alumnos',
];

if (!postgresUrl) {
  console.error('Falta DATABASE_URL. Conecta Neon en Vercel y ejecuta primero: npx vercel env pull .env.local');
  process.exit(1);
}

if (!existsSync(sqlitePath)) {
  console.error(`No se encontro la base SQLite: ${sqlitePath}`);
  process.exit(1);
}

const sqlite = new DatabaseSync(sqlitePath, { readOnly: true });
const pool = new Pool({
  connectionString: postgresUrl,
  max: 1,
  ssl: postgresUrl.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});
const client = await pool.connect();

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

try {
  await client.query(postgresSchema);

  const counts = await Promise.all(
    tables.map(async (table) => {
      const result = await client.query(`SELECT COUNT(*)::int AS total FROM ${quoteIdentifier(table)}`);
      return [table, result.rows[0].total];
    }),
  );
  const occupiedTables = counts.filter(([, total]) => total > 0);

  if (occupiedTables.length > 0 && !replaceTarget) {
    const detail = occupiedTables.map(([table, total]) => `${table} (${total})`).join(', ');
    throw new Error(
      `Postgres ya contiene datos en: ${detail}. Usa --replace solo si queres reemplazarlos por el contenido de SQLite.`,
    );
  }

  await client.query('BEGIN');

  if (replaceTarget) {
    await client.query(
      `TRUNCATE TABLE ${tables.map(quoteIdentifier).join(', ')} RESTART IDENTITY CASCADE`,
    );
  }

  let importedRows = 0;

  for (const table of tables) {
    const sqliteTable = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
      .get(table);
    if (!sqliteTable) continue;

    const rows = sqlite.prepare(`SELECT * FROM ${quoteIdentifier(table)}`).all();
    if (rows.length === 0) {
      console.log(`${table}: 0 registros`);
      continue;
    }

    const targetColumnsResult = await client.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    const targetColumns = new Set(targetColumnsResult.rows.map(({ column_name }) => column_name));
    const columns = Object.keys(rows[0]).filter((column) => targetColumns.has(column));
    const columnSql = columns.map(quoteIdentifier).join(', ');
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    for (const row of rows) {
      await client.query(
        `INSERT INTO ${quoteIdentifier(table)} (${columnSql}) VALUES (${placeholders})`,
        columns.map((column) => row[column]),
      );
    }

    importedRows += rows.length;
    console.log(`${table}: ${rows.length} registros`);
  }

  for (const table of tables) {
    await client.query(
      `SELECT setval(
        pg_get_serial_sequence($1, 'id'),
        COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(table)}), 1),
        EXISTS (SELECT 1 FROM ${quoteIdentifier(table)})
      )`,
      [table],
    );
  }

  await client.query('COMMIT');
  console.log(`Migracion terminada: ${importedRows} registros copiados a Postgres.`);
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error(`No se pudo completar la migracion: ${error.message}`);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
  sqlite.close();
}

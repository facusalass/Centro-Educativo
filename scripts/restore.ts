import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { decodeBackup, restoreSnapshot } from './backup-lib.mjs';
const filename = process.argv.find((value) => value.startsWith('--file='))?.slice(7);
if (!filename || !process.env.DATABASE_URL)
  throw new Error('Usá --file=RUTA y configurá DATABASE_URL con la base destino.');
process.env.SEED_DEMO = 'false';
const { db, initializeDatabase } = await import('../server/database.js');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  ssl: process.env.DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});
try {
  const backup = decodeBackup(await readFile(filename), process.env.BACKUP_KEY);
  await initializeDatabase();
  const client = await pool.connect();
  try {
    await restoreSnapshot(client, backup, process.argv.includes('--replace'));
  } finally {
    client.release();
  }
  console.log(
    'Restauración terminada. Verificá acceso, matrículas y reportes antes de habilitar tráfico.',
  );
} finally {
  await db.close();
  await pool.end();
}

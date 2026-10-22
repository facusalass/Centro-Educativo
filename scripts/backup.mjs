import pg from 'pg';
import { mkdir, writeFile } from 'node:fs/promises';
import { snapshot, encodeBackup } from './backup-lib.mjs';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL no está configurada.');
const pool = new pg.Pool({ connectionString: url, ssl: url.includes('sslmode=disable') ? false : { rejectUnauthorized: false }, max: 1, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  const backup = await snapshot(client);
  await mkdir('outputs/backups', { recursive: true });
  const path = `outputs/backups/respaldo-${Date.now()}.${process.env.BACKUP_KEY ? 'enc' : 'json'}`;
  await writeFile(path, encodeBackup(backup, process.env.BACKUP_KEY), { mode: 0o600 });
  console.log(`Respaldo local guardado: ${path}. Tablas: ${Object.keys(backup.tablas).length}. Registros: ${Object.values(backup.tablas).reduce((n, rows) => n + rows.length, 0)}.`);
} finally { client.release(); await pool.end(); }

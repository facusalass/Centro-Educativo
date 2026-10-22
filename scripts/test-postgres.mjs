import EmbeddedPostgres from 'embedded-postgres';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import pgDriver from 'pg';
import { snapshot, restoreSnapshot, encodeBackup, decodeBackup } from './backup-lib.mjs';
await mkdir('outputs', { recursive: true });
const databaseDir = await mkdtemp(resolve('outputs/postgres-test-'));
const password = randomBytes(24).toString('hex');
const port = 15439;
const pg = new EmbeddedPostgres({ databaseDir, user: 'postgres', password, port, persistent: true, initdbFlags: ['--locale=C', '--encoding=UTF8'], postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: (error) => { if (String(error).includes('FATAL')) console.error('Postgres test server:', error); } });
let exitCode = 0;
try {
  await pg.initialise(); await pg.start(); await pg.createDatabase('educar_test');
  console.log('Ejecutando pruebas contra PostgreSQL aislado.');
  const child = spawn(process.execPath, ['--import', 'tsx', '--test', 'tests/core.test.ts'], { stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: `postgresql://postgres:${password}@127.0.0.1:${port}/educar_test?sslmode=disable` } });
  exitCode = await new Promise((done) => child.on('exit', (code) => done(code ?? 1)));
  if (!exitCode) {
    const started = performance.now();
    const url = `postgresql://postgres:${password}@127.0.0.1:${port}`;
    const source = new pgDriver.Client({ connectionString: `${url}/educar_test` });
    await source.connect();
    const backup = await snapshot(source);
    await source.end();
    const key = randomBytes(32).toString('base64');
    const decoded = decodeBackup(encodeBackup(backup, key), key);
    await pg.createDatabase('educar_restore');
    const upgrade = spawn(process.execPath, ['--import', 'tsx', 'scripts/upgrade.ts'], { stdio: 'inherit', env: { ...process.env, DATABASE_URL: `${url}/educar_restore?sslmode=disable`, SEED_DEMO: 'false' } });
    if (await new Promise((done) => upgrade.on('exit', done))) throw new Error('Falló la preparación de la base de recuperación.');
    const target = new pgDriver.Client({ connectionString: `${url}/educar_restore` });
    await target.connect();
    try {
      await restoreSnapshot(target, decoded);
      const restored = await snapshot(target);
      for (const table of Object.keys(backup.tablas)) if (backup.tablas[table].length !== restored.tablas[table].length) throw new Error(`No coinciden los registros restaurados de ${table}`);
      console.log(`Restauración cifrada verificada: ${Object.keys(backup.tablas).length} tablas, ${(performance.now() - started).toFixed(0)} ms.`);
    } finally { await target.end(); }
  }
} finally { await pg.stop(); }
process.exit(exitCode);

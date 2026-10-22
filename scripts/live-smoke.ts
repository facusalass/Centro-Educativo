import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import app from '../server/index.js';
import { db } from '../server/database.js';
const server = app.listen(0, '127.0.0.1');
try {
  await once(server, 'listening');
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;
  const health = await (await fetch(base + '/health')).json();
  assert.equal(health.database, 'postgres');
  const login = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SMOKE_EMAIL || 'admin@educar.com',
      password: process.env.SMOKE_PASSWORD || 'admin123',
    }),
  });
  assert.equal(login.status, 200, 'No se pudo autenticar la cuenta de verificación.');
  const cookie = login.headers.get('set-cookie')!.split(';')[0];
  const timings: number[] = [];
  for (const path of [
    '/admin/bootstrap',
    '/reportes/alumnos-por-curso',
    '/reportes/docentes-por-nivel',
    '/reportes/alumnos-por-deporte',
    '/reportes/alumnos-por-materia',
    '/reportes/alumnos-por-recorrido',
  ]) {
    const started = performance.now();
    const response = await fetch(base + path, { headers: { Cookie: cookie } });
    assert.equal(response.status, 200, path);
    await response.json();
    timings.push(performance.now() - started);
  }
  const version = await db.get('SELECT MAX(version) AS version FROM schema_migrations');
  const plain = await db.get(
    "SELECT COUNT(*) AS total FROM usuarios_acceso WHERE password_demo <> ''",
  );
  assert.equal(Number(plain.total), 0);
  const missing = await db.get(
    "SELECT COUNT(*) AS total FROM alumnos WHERE curso_id IS NULL AND estado = 'activo'",
  );
  console.log(
    `Supabase verificado: migración ${version.version}, login y 6 consultas reales correctas. Máxima: ${Math.round(Math.max(...timings))} ms. Alumnos a revisar por curso sin vincular: ${missing.total}.`,
  );
} finally {
  await new Promise<void>((done) => server.close(() => done()));
  await db.close();
}

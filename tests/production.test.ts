import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

function run(script: string, settings: Record<string, string> = {}) {
  const env = { ...process.env };
  for (const key of [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'JWT_SECRET',
    'VERCEL',
  ])
    delete env[key];
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '-e', script],
    {
      cwd: process.cwd(),
      env: { ...env, NODE_ENV: 'production', ...settings },
      encoding: 'utf8',
      timeout: 15000,
    },
  );
  assert.ifError(result.error);
  return result;
}

test('producción rechaza arrancar sin una base persistente', () => {
  const result = run("await import('./server/index.js')");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /DATABASE_URL/);
});

test('producción rechaza una clave de sesión ausente o corta', () => {
  for (const secret of ['', 'corta']) {
    const result = run("await import('./server/index.js')", {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?sslmode=disable',
      JWT_SECRET: secret,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /JWT_SECRET/);
  }
});

test('la cookie de producción es segura y el JWT fija emisor y audiencia', () => {
  const result = run(
    `
    const {setSession}=await import('./server/core/security.ts');
    const {db}=await import('./server/database.js');
    const {default:jwt}=await import('jsonwebtoken');
    setSession({cookie(name,token,options) {
      const claims=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256'],issuer:'educar',audience:'portal'});
      console.log(JSON.stringify({name,options,subject:claims.sub,version:claims.ver,ttl:claims.exp-claims.iat}));
    }}, {id:123,session_version:4});
    await db.close();
  `,
    {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?sslmode=disable',
      JWT_SECRET: 'isolated-production-test-key-at-least-32-characters',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout.trim());
  assert.equal(payload.name, 'educar_session');
  assert.equal(payload.options.secure, true);
  assert.equal(payload.options.httpOnly, true);
  assert.equal(payload.options.sameSite, 'lax');
  assert.equal(payload.subject, '123');
  assert.equal(payload.version, 4);
  assert.equal(payload.ttl, 8 * 60 * 60);
});

test('el arranque comparte conexiones concurrentes y permite reintentar un fallo', () => {
  const result = run(
    `
    const {ensureDatabaseReady}=await import('./server/index.js');
    const {db}=await import('./server/database.js');
    const first=ensureDatabaseReady();
    const concurrent=ensureDatabaseReady();
    if(first!==concurrent) throw new Error('La inicialización no se compartió');
    await first.catch(()=>{});
    const retry=ensureDatabaseReady();
    if(retry===first) throw new Error('Se conservó el rechazo anterior');
    await retry.catch(()=>{});
    await db.close();
    console.log('retry-ok');
  `,
    {
      DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test?sslmode=disable',
      JWT_SECRET: 'isolated-production-test-key-at-least-32-characters',
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /retry-ok/);
});

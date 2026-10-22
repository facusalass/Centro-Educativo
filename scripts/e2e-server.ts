import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
await mkdir('outputs', { recursive: true });
const directory = await mkdtemp(resolve('outputs/browser-tests-'));
for (const key of [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'VERCEL',
])
  delete process.env[key];
process.env.SQLITE_PATH = join(directory, 'test.sqlite');
process.env.SEED_DEMO = 'true';
process.env.JWT_SECRET = 'browser-test-session-secret-longer-than-32-characters';
const { default: app } = await import('../server/index.js');
app.listen(3101, '127.0.0.1', () =>
  console.log('Entorno aislado de navegador: http://127.0.0.1:3101'),
);

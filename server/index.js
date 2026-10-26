import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { databaseMode, initializeDatabase } from './database.js';
import { registerCore } from './core/routes.js';
import { registerReports } from './routes/reports.js';
import { registerPublicRoutes } from './routes/public.js';
import { registerAdminRoutes } from './routes/admin.js';
import { errorHandler } from './http/errors.js';

const app = express();
let databaseReady;
// Start inside the request lifecycle; retry after transient connection failures.
export function ensureDatabaseReady() {
  databaseReady ??= initializeDatabase().catch((error) => {
    databaseReady = undefined;
    let message = String(error?.message || 'Unknown database error');
    for (const key of [
      'DATABASE_URL',
      'POSTGRES_URL',
      'POSTGRES_PRISMA_URL',
      'POSTGRES_URL_NON_POOLING',
    ]) {
      if (process.env[key]) message = message.replaceAll(process.env[key], '[redacted]');
    }
    message = message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted]');
    console.error('Database initialization failed:', error?.code || error?.name, message);
    throw error;
  });
  return databaseReady;
}

app.set('trust proxy', 1);
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3001'].filter(
      Boolean,
    ),
    credentials: true,
  }),
);
app.use(
  helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }),
);
app.use(express.json({ limit: '256kb' }));

const staticDir = resolve('dist');
if (existsSync(resolve(staticDir, 'index.html'))) {
  app.use(express.static(staticDir));
  // Serve the shell relative to `root`: an absolute path that contains a dot
  // segment (a worktree under `.gemini/`, for instance) is treated by `send`
  // as a dotfile and rejected, which turned every deep link into a 404.
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => res.sendFile('index.html', { root: staticDir }));
}

app.use(async (_req, _res, next) => {
  await ensureDatabaseReady();
  next();
});
registerCore(app);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', proyecto: 'Educar para Transformar', database: databaseMode });
});
registerAdminRoutes(app);
registerPublicRoutes(app);
registerReports(app);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use(errorHandler);
export default app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { databaseMode, initializeDatabase } from './database.js';
import { registerCore } from './core/routes.ts';
import { registerReports } from './routes/reports.js';
import { registerPublicRoutes } from './routes/public.js';
import { registerAdminRoutes } from './routes/admin.js';
import { errorHandler } from './http/errors.ts';

const app = express();
export const databaseReady = initializeDatabase();
// Serverless imports can finish before the first request; the request middleware
// below remains responsible for propagating initialization errors to the client.
databaseReady.catch(() => {});

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
  app.get(/^(?!\/api(?:\/|$)).*/, (_req, res) => res.sendFile(resolve(staticDir, 'index.html')));
}

app.use(async (_req, _res, next) => {
  await databaseReady;
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

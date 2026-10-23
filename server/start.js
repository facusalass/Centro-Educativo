import app, { ensureDatabaseReady } from './index.js';
import { db } from './database.js';
import { deliverPending } from './core/notifications.js';

const port = Number(process.env.PORT || 3001);
await ensureDatabaseReady();
const server = app.listen(port, () => {
  console.log(`Educar para Transformar disponible en http://localhost:${port}`);
});
const mailTimer = setInterval(() => {
  deliverPending().catch(() => console.error('No se pudo procesar la cola de correos.'));
}, 30000);
mailTimer.unref();

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(mailTimer);
  const timeout = setTimeout(() => server.closeAllConnections(), 10000);
  timeout.unref();
  try {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await db.close();
  } finally {
    clearTimeout(timeout);
  }
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.once(signal, () => {
    shutdown().catch(() => {
      process.exitCode = 1;
    });
  });

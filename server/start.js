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

// D1: scheduler in-process env-configurable, desactivado en tests y serverless.
let cronTasks = [];
if (process.env.BILLING_CRON !== 'off' && process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  try {
    const { default: cron } = await import('node-cron');
    const { esUltimoDiaHabil } = await import('./core/billing-jobs.js');
    // Recordatorio fin de mes: todos los días 18:00, solo ejecuta si hoy es último día hábil.
    cronTasks.push(
      cron.schedule('0 18 * * *', async () => {
        try {
          const hoy = new Date().toISOString().slice(0, 10);
          if (!esUltimoDiaHabil(hoy)) return;
          const { runRecordatorioFinMes } = await import('./core/billing-jobs.js');
          await runRecordatorioFinMes(hoy.slice(0, 7));
          await deliverPending().catch(() => {});
        } catch (e) {
          console.error('Cron fin de mes falló:', e?.message || e);
        }
      }),
    );
    // Aviso deuda día 20, 08:00.
    cronTasks.push(
      cron.schedule('0 8 20 * *', async () => {
        try {
          const { runAvisoDeudaDia20 } = await import('./core/billing-jobs.js');
          await runAvisoDeudaDia20(new Date().toISOString().slice(0, 7));
          await deliverPending().catch(() => {});
        } catch (e) {
          console.error('Cron deuda día 20 falló:', e?.message || e);
        }
      }),
    );
  } catch (e) {
    console.error('No se pudo iniciar el scheduler de facturación:', e?.message || e);
  }
}

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(mailTimer);
  for (const t of cronTasks) t.stop();
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

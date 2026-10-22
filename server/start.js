import { deliverPending } from './core/notifications.ts';
import app from './index.js';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`API Educar para Transformar disponible en http://localhost:${PORT}`);
});

const mailTimer = setInterval(() => deliverPending().catch(() => console.error('No se pudo procesar la cola de correos.')), 30000);
mailTimer.unref();

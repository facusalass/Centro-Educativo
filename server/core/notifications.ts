import nodemailer from 'nodemailer';
import { db } from '../database.js';

type SchoolEvent = { alumno_id: number; titulo: string; mensaje: string };
interface Observer {
  notify(event: SchoolEvent): Promise<void>;
}
// Observer publishes into a persistent outbox in the business transaction.
class FamilyInbox implements Observer {
  async notify(event: SchoolEvent) {
    const student = await db.get('SELECT * FROM alumnos WHERE id = ?', [event.alumno_id]);
    if (!student?.usuario_padre_id) return;
    const parent = await db.get(
      "SELECT * FROM usuarios_acceso WHERE id = ? AND estado = 'activo'",
      [student.usuario_padre_id],
    );
    if (!parent) return;
    await db.insert('notificaciones', {
      usuario_id: parent.id,
      titulo: event.titulo,
      mensaje: `${student.nombre} ${student.apellido}: ${event.mensaje}`,
      email: parent.email,
      fecha: new Date().toISOString(),
    });
  }
}
class StudentInbox implements Observer {
  async notify(event: SchoolEvent) {
    if (event.titulo !== 'Nueva calificación publicada') return;
    const accounts = await db.all(
      "SELECT id, email FROM usuarios_acceso WHERE rol = 'alumno' AND referencia_id = ? AND estado = 'activo'",
      [event.alumno_id],
    );
    for (const account of accounts)
      await db.insert('notificaciones', {
        usuario_id: account.id,
        email: account.email,
        titulo: event.titulo,
        mensaje: event.mensaje,
        fecha: new Date().toISOString(),
      });
  }
}
const observers: Observer[] = [new FamilyInbox(), new StudentInbox()];
export const publish = async (event: SchoolEvent) => {
  for (const observer of observers) await observer.notify(event);
};

export async function queueEmail(input: {
  usuario_id: number;
  email: string;
  titulo: string;
  mensaje: string;
  archivo_nombre?: string;
  archivo_mime?: string;
  archivo_contenido?: string;
}): Promise<number> {
  try {
    return await db.insert('notificaciones', {
      usuario_id: input.usuario_id,
      titulo: input.titulo,
      mensaje: input.mensaje,
      email: input.email,
      fecha: new Date().toISOString(),
      archivo_nombre: input.archivo_nombre ?? null,
      archivo_mime: input.archivo_mime ?? null,
      archivo_contenido: input.archivo_contenido ?? null,
    });
  } catch {
    return await db.insert('notificaciones', {
      usuario_id: input.usuario_id,
      titulo: input.titulo,
      mensaje: input.mensaje,
      email: input.email,
      fecha: new Date().toISOString(),
    });
  }
}

let sending = false;
export async function deliverPending() {
  if (sending || !process.env.SMTP_HOST || !process.env.SMTP_FROM)
    return { enviados: 0, configurado: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM) };
  sending = true;
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 5000,
    socketTimeout: 10000,
  });
  let enviados = 0;
  try {
    // Claim a batch atomically, then release the business lock before using SMTP.
    const pending = await db.transaction(async () => {
      const rows = await db.all(
        "SELECT * FROM notificaciones WHERE estado_email IN ('pendiente', 'error', 'procesando') AND intentos < 5 AND (proximo_intento IS NULL OR proximo_intento <= ?) ORDER BY id LIMIT 20",
        [new Date().toISOString()],
      );
      for (const item of rows)
        await db.update('notificaciones', item.id, {
          estado_email: 'procesando',
          intentos: item.intentos + 1,
          proximo_intento: new Date(Date.now() + 120000).toISOString(),
        });
      return rows;
    });
    for (const item of pending) {
      try {
        await transport.sendMail({
          from: process.env.SMTP_FROM,
          to: item.email,
          subject: item.titulo,
          text: item.mensaje,
          messageId: `<educar-${item.id}@${process.env.MAIL_MESSAGE_DOMAIN || 'educar.local'}>`,
          ...(item.archivo_contenido && item.archivo_nombre
            ? {
                attachments: [
                  {
                    filename: item.archivo_nombre,
                    contentType: item.archivo_mime || 'application/pdf',
                    content: Buffer.from(String(item.archivo_contenido), 'base64'),
                  },
                ],
              }
            : {}),
        });
        await db.update('notificaciones', item.id, {
          estado_email: 'enviado',
          intentos: item.intentos + 1,
          ultimo_error: '',
          // El adjunto ya se entregó: no hace falta conservar megabytes de PDF
          // en la base para siempre. Se limpia solo el contenido; el registro
          // queda como historial de la notificación.
          ...(item.archivo_contenido ? { archivo_contenido: null } : {}),
          // El token de recuperación viaja en el cuerpo del correo; una vez
          // enviado, se redacta para no dejarlo indefinidamente en la cola.
          ...(item.titulo === 'Recuperación de contraseña'
            ? {
                mensaje:
                  'Enlace de recuperación enviado. Si necesitás otro, solicitá uno nuevo desde el portal.',
              }
            : {}),
        });
        enviados++;
      } catch {
        await db.update('notificaciones', item.id, {
          estado_email: 'error',
          intentos: item.intentos + 1,
          ultimo_error: 'No se pudo entregar el correo. Revisá el servicio SMTP.',
          proximo_intento: new Date(Date.now() + 60000 * 2 ** item.intentos).toISOString(),
        });
      }
    }
    return { enviados, configurado: true };
  } finally {
    sending = false;
    transport.close();
  }
}

import type { Express } from 'express';
import { db, databaseMode } from '../database.js';
import { assert, idOf } from './errors.ts';
import { deliverPending } from './notifications.ts';
export function registerNotificationRoutes(app: Express) {
  app.get('/api/admin/status', async (_req, res) => {
    res.json({
      database: databaseMode,
      smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
      pendientes: await db.get(
        "SELECT COUNT(*) AS total FROM notificaciones WHERE estado_email <> 'enviado'",
      ),
      migration: await db.get('SELECT MAX(version) AS version FROM schema_migrations'),
    });
  });
  app.get('/api/admin/auditoria', async (_req, res) =>
    res.json(
      await db.all(
        'SELECT a.*, u.nombre AS usuario FROM auditoria a LEFT JOIN usuarios_acceso u ON u.id = a.usuario_id ORDER BY a.id DESC LIMIT 200',
      ),
    ),
  );
  app.post('/api/admin/notificaciones/reintentar', async (_req, res) =>
    res.json(await deliverPending()),
  );
  app.get('/api/notificaciones', async (req, res) =>
    res.json(
      await db.all(
        'SELECT id, titulo, mensaje, leida, fecha FROM notificaciones WHERE usuario_id = ? ORDER BY id DESC LIMIT 100',
        [req.user!.id],
      ),
    ),
  );
  app.put('/api/notificaciones/:id/leida', async (req, res) => {
    const result = await db.run(
      'UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?',
      [idOf(req.params.id), req.user!.id],
    );
    assert(result.changes, 404, 'Notificación no encontrada.');
    res.json({ ok: true });
  });
}

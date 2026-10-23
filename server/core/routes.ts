import type { Express } from 'express';
import { waitUntil } from '@vercel/functions';
import { installSecurity } from './security.js';
import { registerEntities } from './entities.js';
import { registerAcademic } from './academic.js';
import { registerFamilyRoutes } from './families.js';
import { registerAttendanceRoutes } from './attendance.js';
import { registerEnrollmentRoutes } from './enrollment-routes.js';
import { registerNotificationRoutes } from './notification-routes.js';
import { deliverPending } from './notifications.js';

export function registerCore(app: Express) {
  installSecurity(app);
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && process.env.SMTP_HOST)
      res.on('finish', () => {
        if (res.statusCode < 400)
          waitUntil(
            deliverPending().catch(() => console.error('La cola de correo se reintentará.')),
          );
      });
    next();
  });
  registerEntities(app);
  registerAcademic(app);
  registerFamilyRoutes(app);
  registerAttendanceRoutes(app);
  registerEnrollmentRoutes(app);
  registerNotificationRoutes(app);
}

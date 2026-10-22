import type { Express } from 'express';
import { waitUntil } from '@vercel/functions';
import { installSecurity } from './security.ts';
import { registerEntities } from './entities.ts';
import { registerAcademic } from './academic.ts';
import { registerFamilyRoutes } from './families.ts';
import { registerAttendanceRoutes } from './attendance.ts';
import { registerEnrollmentRoutes } from './enrollment-routes.ts';
import { registerNotificationRoutes } from './notification-routes.ts';
import { deliverPending } from './notifications.ts';

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

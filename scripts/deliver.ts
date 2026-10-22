import { initializeDatabase, db } from '../server/database.js';
import { deliverPending } from '../server/core/notifications.ts';
try {
  await initializeDatabase();
  console.log(await deliverPending());
} finally {
  await db.close();
}

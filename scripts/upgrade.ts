import { initializeDatabase, db } from '../server/database.js';
try {
  await initializeDatabase();
  console.log(
    'Migraciones aplicadas. Versión:',
    (await db.get('SELECT MAX(version) AS version FROM schema_migrations')).version,
  );
} finally {
  await db.close();
}

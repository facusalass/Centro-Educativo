import bcrypt from 'bcryptjs';
import { db, initializeDatabase } from '../server/database.js';
try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password = process.env.ADMIN_PASSWORD;
  if (
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !password ||
    password.length < 10 ||
    password.length > 72
  )
    throw new Error('Definí ADMIN_EMAIL y ADMIN_PASSWORD (10 a 72 caracteres).');
  await initializeDatabase();
  if (await db.get('SELECT id FROM usuarios_acceso WHERE LOWER(email) = ?', [email]))
    throw new Error('Ya existe esa cuenta. Gestioná sus permisos desde el panel.');
  await db.insert('usuarios_acceso', {
    nombre: 'Administración',
    email,
    rol: 'admin',
    estado: 'activo',
    password_demo: '',
    password_hash: await bcrypt.hash(password, 12),
  });
  console.log('Cuenta de administración creada. La contraseña no se muestra ni se registra.');
} finally {
  await db.close();
}

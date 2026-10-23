import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { assert, idOf } from './errors.js';
import {
  audit,
  requireStudent,
  safeUser,
  setSession,
  validatePassword,
  type User,
} from './security.js';
import { objectBody } from './validation.js';
import { monthlyQuote } from './fees.js';

async function createChild(
  input: Record<string, unknown>,
  parent: Pick<User, 'id' | 'nombre' | 'email'>,
) {
  const nombre = String(input.nombre_hijo ?? '').trim();
  const apellido = String(input.apellido_hijo ?? '').trim();
  assert(
    nombre && apellido && nombre.length <= 100 && apellido.length <= 100,
    400,
    'Ingresá el nombre y apellido del alumno.',
  );
  const course = await db.get('SELECT * FROM cursos WHERE id = ?', [idOf(input.curso_id)]);
  assert(course, 400, 'Seleccioná un curso válido.');
  const dni = String(input.dni_hijo ?? '').trim();
  assert(/^\d{7,9}$/.test(dni), 400, 'Ingresá un DNI de 7 a 9 dígitos.');
  assert(
    !(await db.get('SELECT id FROM alumnos WHERE dni = ?', [dni])),
    409,
    'Ya existe un alumno con ese DNI. Solicitá a secretaría la vinculación con tu cuenta.',
  );
  const id = await db.insert('alumnos', {
    nombre,
    apellido,
    dni,
    legajo: `A-${new Date().getUTCFullYear()}-${dni}`,
    curso_id: course.id,
    nivel: course.nivel,
    curso: course.anio,
    division: course.division,
    usuario_padre_id: parent.id,
    tutor_nombre: parent.nombre,
    tutor_email: parent.email,
    tutor_telefono: String(input.telefono_padre ?? ''),
    estado: 'activo',
  });
  await audit(parent.id, 'alta familiar', 'alumnos', id);
  return db.get('SELECT * FROM alumnos WHERE id = ?', [id]);
}

async function registerFamily(input: Record<string, unknown>) {
  const email = String(input.email ?? '')
    .trim()
    .toLowerCase();
  const nombre = String(input.nombre_padre ?? '').trim();
  assert(
    nombre && nombre.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    400,
    'Ingresá tu nombre y un email válido.',
  );
  // BCrypt is intentionally outside the domain lock: unrelated school writes
  // should not wait for CPU-bound password hashing.
  const passwordHash = await bcrypt.hash(validatePassword(input.password), 12);
  return db.transaction(async () => {
    assert(
      !(await db.get('SELECT id FROM usuarios_acceso WHERE LOWER(email) = ?', [email])),
      409,
      'Ya existe una cuenta con ese email.',
    );
    const id = await db.insert('usuarios_acceso', {
      nombre,
      email,
      rol: 'padre',
      estado: 'activo',
      password_hash: passwordHash,
      password_demo: '',
    });
    const parent = await db.get('SELECT * FROM usuarios_acceso WHERE id = ?', [id]);
    const hijo = await createChild(input, parent);
    return { parent, hijo };
  });
}

export function registerFamilyRoutes(app: Express) {
  app.get('/api/auth/catalogo', async (_req, res) => {
    res.json(
      await db.all('SELECT id, nivel, anio, division, turno FROM cursos ORDER BY nivel, anio'),
    );
  });
  app.get('/api/padres/hijos', async (req, res) => {
    const owner =
      req.user!.rol === 'admin' && req.query.usuario_id ? idOf(req.query.usuario_id) : req.user!.id;
    res.json(
      await db.all('SELECT * FROM alumnos WHERE usuario_padre_id = ? ORDER BY apellido, nombre', [
        owner,
      ]),
    );
  });
  app.get('/api/padres/hijos/:id/arancel', async (req, res) => {
    const student = await requireStudent(req, idOf(req.params.id));
    res.json(await monthlyQuote(student.id));
  });
  app.post('/api/padres/registro', async (req, res) => {
    const result = await registerFamily(objectBody(req.body));
    setSession(res, result.parent);
    res.status(201).json({ usuario: safeUser(result.parent), hijo: result.hijo });
  });
  app.post('/api/padres/hijos', async (req, res) => {
    assert(req.user!.rol === 'padre', 403, 'Ingresá con una cuenta familiar.');
    const input = objectBody(req.body);
    res.status(201).json(await db.transaction(() => createChild(input, req.user!)));
  });
}

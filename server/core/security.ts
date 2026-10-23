import type { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { randomBytes } from 'node:crypto';
import { db } from '../database.js';
import { assert, HttpError } from './errors.js';

export type User = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  referencia_id?: number;
  estado: string;
  session_version: number;
};
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
const secret =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? randomBytes(48).toString('hex') : '');
if (!secret || secret.length < 32)
  throw new Error('Configurá JWT_SECRET con al menos 32 caracteres.');
const cookieName = 'educar_session';
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};
export const safeUser = (u: Record<string, unknown>) => {
  const { password_demo: _demo, password_hash: _hash, session_version: _version, ...safe } = u;
  return safe;
};
export function setSession(res: Response, user: User) {
  res.cookie(
    cookieName,
    jwt.sign({ ver: user.session_version ?? 0 }, secret, {
      subject: String(user.id),
      expiresIn: '8h',
      algorithm: 'HS256',
      issuer: 'educar',
      audience: 'portal',
    }),
    cookieOptions,
  );
}
export function clearSession(res: Response) {
  res.clearCookie(cookieName, cookieOptions);
}
export async function audit(
  userId: number | undefined,
  accion: string,
  recurso: string,
  recursoId?: number,
  detalle = '',
) {
  await db.insert('auditoria', {
    usuario_id: userId ?? null,
    accion,
    recurso,
    recurso_id: recursoId ?? null,
    detalle,
    fecha: new Date().toISOString(),
  });
}
const publicGets = new Set([
  '/api/health',
  '/api/auth/catalogo',
  '/api/niveles',
  '/api/servicios',
  '/api/instalaciones',
  '/api/noticias',
  '/api/opiniones',
  '/api/actividades',
  '/api/galeria',
]);
const publicPosts = new Set([
  '/api/auth/login',
  '/api/login-demo',
  '/api/padres/registro',
  '/api/contacto',
  '/api/solicitudes-inscripcion',
  '/api/postulaciones',
  '/api/opiniones',
]);
const sharedGets = new Set([
  '/api/cursos',
  '/api/materias',
  '/api/deportes',
  '/api/grupos-deporte',
  '/api/recorridos',
]);

export function installSecurity(app: Express) {
  app.disable('x-powered-by');
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Volvé a intentar en 15 minutos.' },
  });
  app.use(['/api/auth/login', '/api/login-demo', '/api/padres/registro'], loginLimiter);
  app.use(
    ['/api/contacto', '/api/postulaciones', '/api/solicitudes-inscripcion', '/api/opiniones'],
    rateLimit({
      windowMs: 60000,
      limit: 60,
      message: { error: 'Esperá un momento antes de volver a enviar.' },
    }),
  );
  app.use(async (req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    try {
      const bearer = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : undefined;
      const cookie = req.headers.cookie
        ?.split(';')
        .map((s) => s.trim())
        .find((s) => s.startsWith(`${cookieName}=`))
        ?.slice(cookieName.length + 1);
      const token = bearer || cookie;
      if (token) {
        try {
          const payload = jwt.verify(token, secret, {
            algorithms: ['HS256'],
            issuer: 'educar',
            audience: 'portal',
          }) as jwt.JwtPayload;
          const user = await db.get('SELECT * FROM usuarios_acceso WHERE id = ?', [
            Number(payload.sub),
          ]);
          if (user?.estado === 'activo' && (user.session_version ?? 0) === payload.ver)
            req.user = user;
        } catch {
          /* Expired and invalid credentials never become identities. */
        }
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const origin = req.headers.origin;
        const allowed = [
          process.env.FRONTEND_URL,
          'http://localhost:5173',
          'http://localhost:3001',
        ].filter(Boolean);
        assert(
          !origin || origin === `${req.protocol}://${req.get('host')}` || allowed.includes(origin),
          403,
          'El origen de la solicitud no está autorizado.',
        );
        assert(
          !req.headers['sec-fetch-site'] ||
            req.headers['sec-fetch-site'] !== 'cross-site' ||
            Boolean(bearer),
          403,
          'Solicitud entre sitios rechazada.',
        );
      }
      if (
        (req.method === 'GET' &&
          (publicGets.has(req.path) || /^\/api\/noticias\/\d+$/.test(req.path))) ||
        (req.method === 'POST' && publicPosts.has(req.path))
      ) {
        if (req.query.all)
          assert(
            req.user?.rol === 'admin',
            403,
            'Solo administración puede consultar contenido sin publicar.',
          );
        return next();
      }
      assert(req.user, 401, 'Iniciá sesión para continuar.');
      if (req.user.rol === 'admin') return next();
      if (
        req.path.startsWith('/api/auth/') ||
        req.path.startsWith('/api/notificaciones') ||
        req.path.startsWith('/api/evaluaciones') ||
        req.path.startsWith('/api/entregas') ||
        req.path.startsWith('/api/calificaciones')
      )
        return next();
      if (req.method === 'GET' && sharedGets.has(req.path)) return next();
      if (req.user.rol === 'padre' && req.path.startsWith('/api/padres/')) return next();
      if (
        req.path === '/api/matriculas' &&
        ['GET', 'POST'].includes(req.method) &&
        req.user.rol === 'padre'
      )
        return next();
      if (
        req.path.startsWith('/api/inscripciones') &&
        req.user.rol === 'padre' &&
        ['GET', 'POST', 'DELETE'].includes(req.method)
      )
        return next();
      const studentReport = req.path.match(
        /^\/api\/(?:reportes\/alumno|asistencias\/alumno)\/(\d+)$/,
      );
      if (studentReport && req.method === 'GET') {
        await requireStudent(req, Number(studentReport[1]));
        return next();
      }
      const teacherReport = req.path.match(/^\/api\/reportes\/docente\/(\d+)$/);
      if (
        teacherReport &&
        req.method === 'GET' &&
        req.user.rol === 'docente' &&
        req.user.referencia_id === Number(teacherReport[1])
      )
        return next();
      if (
        req.user.rol === 'docente' &&
        ((['/api/alumnos', '/api/asignaciones-docentes'].includes(req.path) &&
          req.method === 'GET') ||
          (req.path === '/api/asistencias' && ['GET', 'POST'].includes(req.method)))
      )
        return next();
      throw new HttpError(403, 'Tu perfil no tiene permiso para esta operación.');
    } catch (error) {
      next(error);
    }
  });
  const login = async (req: Request, res: Response) => {
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password ?? '');
    assert(email && password, 400, 'Ingresá email y contraseña.');
    const user = await db.get('SELECT * FROM usuarios_acceso WHERE LOWER(email) = ?', [email]);
    const dummy = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttx8KPip8qzSa6Hg0uAzR4QGaSxK';
    const valid = await bcrypt.compare(password, user?.password_hash || dummy);
    assert(user && valid && user.estado === 'activo', 401, 'Email o contraseña incorrectos.');
    setSession(res, user);
    res.json({ usuario: safeUser(user) });
  };
  app.post('/api/auth/login', login);
  app.post('/api/login-demo', login); // compatibility for existing clients; same secure implementation
  app.get('/api/auth/me', (req, res) => res.json({ usuario: safeUser(req.user!) }));
  app.post('/api/auth/logout', async (req, res) => {
    await db.run('UPDATE usuarios_acceso SET session_version = session_version + 1 WHERE id = ?', [
      req.user!.id,
    ]);
    clearSession(res);
    res.json({ ok: true });
  });
  app.put('/api/auth/password', async (req, res) => {
    const old = await db.get('SELECT * FROM usuarios_acceso WHERE id = ?', [req.user!.id]);
    assert(
      await bcrypt.compare(String(req.body.actual ?? ''), old.password_hash),
      400,
      'La contraseña actual no es correcta.',
    );
    const password = validatePassword(req.body.password);
    await db.update('usuarios_acceso', old.id, {
      password_hash: await bcrypt.hash(password, 12),
      session_version: old.session_version + 1,
    });
    clearSession(res);
    res.json({ ok: true });
  });
}
export function validatePassword(value: unknown) {
  const password = String(value ?? '');
  assert(
    password.length >= 10 && Buffer.byteLength(password, 'utf8') <= 72,
    400,
    'La contraseña debe tener entre 10 y 72 caracteres.',
  );
  return password;
}
export async function requireStudent(req: Request, id: number) {
  const alumno = await db.get('SELECT * FROM alumnos WHERE id = ?', [id]);
  assert(alumno, 404, 'Alumno no encontrado.');
  const user = req.user!;
  if (user.rol === 'admin') return alumno;
  if (user.rol === 'padre' && alumno.usuario_padre_id === user.id) return alumno;
  if (user.rol === 'alumno' && user.referencia_id === id) return alumno;
  if (user.rol === 'docente') {
    const assignment = await db.get(
      'SELECT id FROM asignaciones_docentes WHERE docente_id = ? AND curso_id = ?',
      [user.referencia_id ?? 0, alumno.curso_id ?? 0],
    );
    if (assignment) return alumno;
  }
  throw new HttpError(403, 'No tenés acceso a este alumno.');
}

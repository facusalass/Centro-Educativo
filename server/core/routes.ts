import type { Express } from 'express';
import bcrypt from 'bcryptjs';
import { db, databaseMode } from '../database.js';
import { assert, idOf } from './errors.ts';
import { installSecurity, audit, requireStudent, setSession, safeUser, validatePassword } from './security.ts';
import { registerEntities } from './entities.ts';
import { registerAcademic } from './academic.ts';
import { enroll, cancelEnrollment, matriculate } from './enrollment.ts';
import { deliverPending } from './notifications.ts';
import { monthlyQuote } from './fees.ts';
import { waitUntil } from '@vercel/functions';

export function registerCore(app: Express) {
  installSecurity(app);
  app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE'].includes(req.method) && process.env.SMTP_HOST) res.on('finish', () => {
      if (res.statusCode < 400) waitUntil(deliverPending().catch(() => console.error('La cola de correo se reintentará.')));
    });
    next();
  });
  registerEntities(app);
  registerAcademic(app);
  app.get('/api/padres/hijos/:id/arancel', async (req, res) => {
    const student = await requireStudent(req, idOf(req.params.id));
    res.json(await monthlyQuote(student.id));
  });
  app.get('/api/admin/status', async (_req, res) => {
    res.json({ database: databaseMode, smtp: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM), pendientes: await db.get("SELECT COUNT(*) AS total FROM notificaciones WHERE estado_email <> 'enviado'"), migration: await db.get('SELECT MAX(version) AS version FROM schema_migrations') });
  });
  app.get('/api/admin/auditoria', async (_req, res) => res.json(await db.all('SELECT a.*, u.nombre AS usuario FROM auditoria a LEFT JOIN usuarios_acceso u ON u.id = a.usuario_id ORDER BY a.id DESC LIMIT 200')));
  app.post('/api/admin/notificaciones/reintentar', async (_req, res) => res.json(await deliverPending()));
  app.get('/api/notificaciones', async (req, res) => res.json(await db.all('SELECT id, titulo, mensaje, leida, fecha FROM notificaciones WHERE usuario_id = ? ORDER BY id DESC LIMIT 100', [req.user!.id])));
  app.put('/api/notificaciones/:id/leida', async (req, res) => {
    const result = await db.run('UPDATE notificaciones SET leida = 1 WHERE id = ? AND usuario_id = ?', [idOf(req.params.id), req.user!.id]);
    assert(result.changes, 404, 'Notificación no encontrada.'); res.json({ ok: true });
  });
  app.get('/api/padres/hijos', async (req, res) => {
    const owner = req.user!.rol === 'admin' && req.query.usuario_id ? idOf(req.query.usuario_id) : req.user!.id;
    res.json(await db.all('SELECT * FROM alumnos WHERE usuario_padre_id = ? ORDER BY apellido, nombre', [owner]));
  });
  const createChild = async (data: any, parent: any) => {
    const nombre = String(data.nombre_hijo ?? '').trim(), apellido = String(data.apellido_hijo ?? '').trim();
    assert(nombre && apellido && nombre.length <= 100 && apellido.length <= 100, 400, 'Ingresá el nombre y apellido del alumno.');
    const course = await db.get('SELECT * FROM cursos WHERE id = ?', [idOf(data.curso_id)]);
    assert(course, 400, 'Seleccioná un curso válido.');
    const dni = String(data.dni_hijo ?? '').trim();
    assert(/^\d{7,9}$/.test(dni), 400, 'Ingresá un DNI de 7 a 9 dígitos.');
    assert(!(await db.get('SELECT id FROM alumnos WHERE dni = ?', [dni])), 409, 'Ya existe un alumno con ese DNI. Solicitá a secretaría la vinculación con tu cuenta.');
    const id = await db.insert('alumnos', { nombre, apellido, dni, legajo: `A-${new Date().getUTCFullYear()}-${dni}`, curso_id: course.id, nivel: course.nivel, curso: course.anio, division: course.division, usuario_padre_id: parent.id, tutor_nombre: parent.nombre, tutor_email: parent.email, tutor_telefono: String(data.telefono_padre ?? ''), estado: 'activo' });
    await audit(parent.id, 'alta familiar', 'alumnos', id);
    return db.get('SELECT * FROM alumnos WHERE id = ?', [id]);
  };
  // Read-only catalog for the initial family registration form; no student data.
  app.get('/api/auth/catalogo', async (_req, res) => res.json(await db.all('SELECT id, nivel, anio, division, turno FROM cursos ORDER BY nivel, anio')));
  app.post('/api/padres/registro', async (req, res) => {
    const result = await db.transaction(async () => {
      const email = String(req.body.email ?? '').trim().toLowerCase(), nombre = String(req.body.nombre_padre ?? '').trim();
      assert(nombre && nombre.length <= 150 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 400, 'Ingresá tu nombre y un email válido.');
      const password = validatePassword(req.body.password);
      assert(!(await db.get('SELECT id FROM usuarios_acceso WHERE LOWER(email) = ?', [email])), 409, 'Ya existe una cuenta con ese email.');
      const id = await db.insert('usuarios_acceso', { nombre, email, rol: 'padre', estado: 'activo', password_hash: await bcrypt.hash(password, 12), password_demo: '' });
      const parent = await db.get('SELECT * FROM usuarios_acceso WHERE id = ?', [id]);
      const hijo = await createChild(req.body, parent);
      return { parent, hijo };
    });
    setSession(res, result.parent); res.status(201).json({ usuario: safeUser(result.parent), hijo: result.hijo });
  });
  app.post('/api/padres/hijos', async (req, res) => {
    assert(req.user!.rol === 'padre', 403, 'Ingresá con una cuenta familiar.');
    const child = await db.transaction(() => createChild(req.body, req.user!));
    res.status(201).json(child);
  });
  app.post('/api/inscripciones', async (req, res) => res.status(201).json(await enroll(req)));
  app.delete('/api/inscripciones/:id', async (req, res) => res.json(await cancelEnrollment(req, req.params.id)));
  app.delete('/api/padres/hijos/:alumnoId/inscripciones/:inscripcionId', async (req, res) => res.json(await cancelEnrollment(req, req.params.inscripcionId)));
  app.get('/api/inscripciones', async (req, res) => {
    const params: number[] = [];
    let where = "WHERE i.estado = 'activo'";
    if (req.user!.rol !== 'admin') { where += ' AND a.usuario_padre_id = ?'; params.push(req.user!.id); }
    const rows = await db.all(`SELECT i.* FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id ${where} ORDER BY i.id DESC`, params);
    const [students, groups, sports, routes] = await Promise.all([db.all('SELECT * FROM alumnos'), db.all('SELECT * FROM grupos_deporte'), db.all('SELECT * FROM deportes'), db.all('SELECT * FROM recorridos_transporte')]);
    res.json(rows.map((i) => { const grupo = groups.find((g) => g.id === i.grupo_deporte_id); return { ...i, alumno: students.find((a) => a.id === i.alumno_id), grupo, deporte: sports.find((s) => s.id === grupo?.deporte_id), recorrido: routes.find((r) => r.id === i.recorrido_id) }; }));
  });
  app.post('/api/matriculas', async (req, res) => res.status(201).json(await matriculate(req)));
  app.get('/api/matriculas', async (req, res) => {
    const params: number[] = [];
    let where = '';
    if (req.user!.rol !== 'admin') { where = 'WHERE a.usuario_padre_id = ?'; params.push(req.user!.id); }
    res.json(await db.all(`SELECT m.*, a.nombre, a.apellido, c.anio, c.division, c.nivel FROM matriculas m JOIN alumnos a ON a.id = m.alumno_id JOIN cursos c ON c.id = m.curso_id ${where} ORDER BY m.ciclo DESC, m.id DESC`, params));
  });
  app.get('/api/asistencias', async (req, res) => {
    let students = await db.all("SELECT * FROM alumnos WHERE estado = 'activo' ORDER BY apellido, nombre");
    if (req.user!.rol === 'docente') {
      const assignments = await db.all('SELECT curso_id FROM asignaciones_docentes WHERE docente_id = ?', [req.user!.referencia_id ?? 0]);
      students = students.filter((s) => assignments.some((a) => a.curso_id === s.curso_id));
    }
    for (const field of ['nivel', 'curso', 'division']) if (req.query[field]) students = students.filter((s) => s[field] === req.query[field]);
    const records = await db.all('SELECT * FROM asistencias_diarias WHERE fecha = ?', [String(req.query.fecha ?? '')]);
    res.json(students.map((alumno) => ({ alumno, asistencia: records.find((a) => a.alumno_id === alumno.id) ?? null })));
  });
  app.post('/api/asistencias', async (req, res) => {
    assert(['admin', 'docente'].includes(req.user!.rol), 403, 'No podés registrar asistencias.');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(req.body.fecha) && Array.isArray(req.body.registros), 400, 'Ingresá fecha y registros válidos.');
    await db.transaction(async () => {
      for (const registro of req.body.registros) {
        const student = await requireStudent(req, idOf(registro.alumno_id));
        assert(typeof registro.presente === 'boolean', 400, 'La presencia debe ser verdadero o falso.');
        const old = await db.get('SELECT id FROM asistencias_diarias WHERE alumno_id = ? AND fecha = ?', [student.id, req.body.fecha]);
        const data = { alumno_id: student.id, fecha: req.body.fecha, presente: registro.presente ? 1 : 0, observacion: String(registro.observacion ?? '').slice(0, 2000) };
        if (old) await db.update('asistencias_diarias', old.id, data); else await db.insert('asistencias_diarias', data);
      }
      await audit(req.user!.id, 'asistencias', 'asistencias_diarias', undefined, req.body.fecha);
    }); res.status(201).json({ ok: true });
  });
}

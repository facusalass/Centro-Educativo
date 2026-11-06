import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { once } from 'node:events';
import net from 'node:net';
import type { Server } from 'node:http';
import { createHash } from 'node:crypto';

let server: Server, db: any, base: string, dir: string;
let admin: string, parent: string, otherParent: string, teacher: string, student = '';
let childId: number, otherChild: number;
const password = 'Prueba-Segura-2027';
// HU-04: cuenta de recuperación y token crudo extraído del correo en la cola.
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
let recoveryUserId = 0;
let recoveryToken = '';
async function api(path: string, cookie = '', method = 'GET', body?: unknown) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return {
    status: response.status,
    data,
    cookie: response.headers.get('set-cookie')?.split(';')[0] || '',
  };
}
before(async () => {
  await mkdir('outputs', { recursive: true });
  dir = await mkdtemp(resolve('outputs/core-tests-'));
  for (const key of [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRES_URL_NON_POOLING',
    'VERCEL',
  ])
    delete process.env[key];
  if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.SQLITE_PATH = join(dir, 'test.sqlite');
  process.env.SEED_DEMO = 'true';
  process.env.JWT_SECRET = 'test-only-secret-that-is-longer-than-32-characters';
  const { default: app } = await import('../server/index.js');
  db = (await import('../server/database.js')).db;
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as net.AddressInfo).port}/api`;
  const health = await api('/health');
  assert.equal(health.status, 200, JSON.stringify(health.data));
  admin = (
    await api('/auth/login', '', 'POST', { email: 'admin@educar.com', password: 'admin123' })
  ).cookie;
  teacher = (
    await api('/auth/login', '', 'POST', { email: 'docente@educar.com', password: 'docente123' })
  ).cookie;
  assert.ok(admin);
  assert.ok(teacher);
  const first = await api('/padres/registro', '', 'POST', {
    email: 'familia1@test.com',
    password,
    nombre_padre: 'Familia Uno',
    nombre_hijo: 'Hijo',
    apellido_hijo: 'Uno',
    dni_hijo: '57777111',
    curso_id: 2,
  });
  assert.equal(first.status, 201, JSON.stringify(first.data));
  parent = first.cookie;
  childId = first.data.hijo.id;
  const second = await api('/padres/registro', '', 'POST', {
    email: 'familia2@test.com',
    password,
    nombre_padre: 'Familia Dos',
    nombre_hijo: 'Hijo',
    apellido_hijo: 'Dos',
    dni_hijo: '57777222',
    curso_id: 2,
  });
  assert.equal(second.status, 201);
  otherParent = second.cookie;
  otherChild = second.data.hijo.id;
});
after(async () => {
  if (server) await new Promise<void>((done) => server.close(() => done()));
  if (db) await db.close();
  if (dir) {
    await rm(join(dir, 'test.sqlite'), { force: true });
  }
});

test('sin sesión no se pueden consultar ni modificar datos internos', async () => {
  for (const path of [
    '/admin/bootstrap',
    '/alumnos',
    '/usuarios',
    '/inscripciones',
    '/reportes/alumno/1',
  ])
    assert.equal((await api(path)).status, 401, path);
  assert.equal((await api('/cursos', '', 'POST', {})).status, 401);
  assert.equal((await api('/admin/bootstrap', 'educar_session=forged.jwt')).status, 401);
});
test('login usa cookie HttpOnly y la base ya no conserva contraseñas en texto plano', async () => {
  const response = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@educar.com', password: 'admin123' }),
  });
  assert.match(response.headers.get('set-cookie')!, /HttpOnly/i);
  assert.match(response.headers.get('set-cookie')!, /SameSite=Lax/i);
  const user = (await response.json()).usuario;
  assert.equal(user.password_hash, undefined);
  assert.equal(user.password_demo, undefined);
  const stored = await db.get('SELECT * FROM usuarios_acceso WHERE id = ?', [user.id]);
  assert.equal(stored.password_demo, '');
  assert.match(stored.password_hash, /^\$2/);
  assert.equal(
    (await api('/auth/login', '', 'POST', { email: 'admin@educar.com', password: 'incorrecta' }))
      .status,
    401,
  );
});
test('el padre solo consulta sus hijos aun falsificando email e identificadores', async () => {
  const own = await api('/padres/hijos?usuario_id=1&email=admin@educar.com', parent);
  assert.deepEqual(
    own.data.map((r: any) => r.id),
    [childId],
  );
  assert.equal((await api(`/reportes/alumno/${otherChild}`, parent)).status, 403);
  assert.equal((await api('/usuarios', parent)).status, 403);
  assert.equal((await api('/alumnos', parent)).status, 403);
  assert.equal(
    (await api(`/inscripciones`, parent, 'POST', { alumno_id: otherChild, tipo: 'comedor' }))
      .status,
    403,
  );
});
test('registro familiar es atómico y no permite reclamar un DNI existente', async () => {
  const result = await api('/padres/registro', '', 'POST', {
    email: 'rollback@test.com',
    password,
    nombre_padre: 'Otro',
    nombre_hijo: 'Duplicado',
    apellido_hijo: 'Uno',
    dni_hijo: '57777111',
    curso_id: 2,
  });
  assert.equal(result.status, 409);
  assert.equal(
    await db.get("SELECT id FROM usuarios_acceso WHERE email = 'rollback@test.com'"),
    undefined,
  );
});
test('docente ve sus asignaciones y no accede al reporte ni evaluación de otro docente', async () => {
  const mine = await api('/asignaciones-docentes', teacher);
  assert.ok(mine.data.every((a: any) => a.docente_id === 1));
  assert.equal((await api('/reportes/docente/2', teacher)).status, 403);
  assert.equal((await api('/alumnos', teacher, 'POST', {})).status, 403);
  assert.equal(
    (
      await api('/evaluaciones', teacher, 'POST', {
        asignacion_id: 2,
        titulo: 'Evaluación ajena',
        fecha: '2027-04-01',
      })
    ).status,
    403,
  );
});
test('concurrencia: dos solicitudes de comedor generan una sola inscripción', async () => {
  const results = await Promise.all(
    Array.from({ length: 6 }, () =>
      api('/inscripciones', parent, 'POST', { alumno_id: childId, tipo: 'comedor' }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 5);
});
test('concurrencia deportiva: máximo dos deportes, duplicados por deporte y horarios', async () => {
  const groups = [];
  for (let i = 0; i < 3; i++) {
    const sport = await db.insert('deportes', {
      nombre: `Prueba ${i}`,
      descripcion: 'Prueba',
      profesor_id: 1,
    });
    groups.push(
      await db.insert('grupos_deporte', {
        deporte_id: sport,
        nivel: 'Primario',
        dia: ['Jueves', 'Viernes', 'Sábado'][i],
        horario: '16:00 - 17:00',
        profesor_id: 1,
        cupo: 10,
      }),
    );
  }
  const results = await Promise.all(
    groups.map((id) =>
      api('/inscripciones', parent, 'POST', {
        alumno_id: childId,
        tipo: 'deporte',
        grupo_deporte_id: id,
      }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 2);
  assert.equal(results.filter((r) => r.status === 409).length, 1);
  const first = results.find((r) => r.status === 201)!.data;
  assert.equal(
    (
      await api('/inscripciones', parent, 'POST', {
        alumno_id: childId,
        tipo: 'deporte',
        grupo_deporte_id: first.grupo_deporte_id,
      })
    ).status,
    409,
  );
  const sport = await db.get('SELECT * FROM grupos_deporte WHERE id = ?', [first.grupo_deporte_id]);
  const duplicate = await db.insert('grupos_deporte', {
    ...Object.fromEntries(Object.entries(sport).filter(([key]) => key !== 'id')),
    horario: '18:00 - 19:00',
  });
  assert.equal(
    (
      await api('/inscripciones', parent, 'POST', {
        alumno_id: otherChild,
        tipo: 'deporte',
        grupo_deporte_id: first.grupo_deporte_id,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api('/inscripciones', otherParent, 'POST', {
        alumno_id: otherChild,
        tipo: 'deporte',
        grupo_deporte_id: first.grupo_deporte_id,
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await api('/inscripciones', otherParent, 'POST', {
        alumno_id: otherChild,
        tipo: 'deporte',
        grupo_deporte_id: duplicate,
      })
    ).status,
    409,
  );
  const otherSport = await db.insert('deportes', {
    nombre: 'Conflicto',
    descripcion: '',
    profesor_id: 2,
  });
  const conflict = await db.insert('grupos_deporte', {
    deporte_id: otherSport,
    nivel: 'Primario',
    dia: sport.dia,
    horario: '16:30 - 17:30',
    profesor_id: 2,
    cupo: 10,
  });
  assert.equal(
    (
      await api('/inscripciones', otherParent, 'POST', {
        alumno_id: otherChild,
        tipo: 'deporte',
        grupo_deporte_id: conflict,
      })
    ).status,
    409,
  );
});
test('cambio de horario no introduce conflictos en inscripciones existentes', async () => {
  const active = await db.all(
    "SELECT g.* FROM inscripciones i JOIN grupos_deporte g ON i.grupo_deporte_id = g.id WHERE i.alumno_id = ? AND i.estado = 'activo'",
    [childId],
  );
  assert.equal(active.length, 2);
  const response = await api(`/grupos-deporte/${active[1].id}`, admin, 'PUT', {
    ...active[1],
    dia: active[0].dia,
    horario: active[0].horario,
    profesor_id: 2,
  });
  assert.equal(response.status, 409);
  const original = await db.get('SELECT dia FROM grupos_deporte WHERE id = ?', [active[1].id]);
  assert.equal(original.dia, active[1].dia);
});
test('cupos de transporte y límite de cuatro recorridos', async () => {
  assert.equal(
    (
      await api('/recorridos', admin, 'POST', {
        nombre: 'Quinto',
        descripcion: 'Extra',
        zona: 'Extra',
        horario: '07:00',
      })
    ).status,
    409,
  );
  const route = await db.get('SELECT * FROM recorridos_transporte WHERE id = 4');
  await db.update('recorridos_transporte', route.id, { cupo: 1 });
  const results = await Promise.all([
    api('/inscripciones', parent, 'POST', {
      alumno_id: childId,
      tipo: 'transporte',
      recorrido_id: 4,
    }),
    api('/inscripciones', otherParent, 'POST', {
      alumno_id: otherChild,
      tipo: 'transporte',
      recorrido_id: 4,
    }),
  ]);
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 1);
});
test('matrícula: no duplica ciclo ni supera cupos ante solicitudes simultáneas', async () => {
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      api('/matriculas', parent, 'POST', { alumno_id: childId, curso_id: 2, ciclo: 2027 }),
    ),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 1);
  assert.equal(results.filter((r) => r.status === 409).length, 3);
  assert.equal(
    (await api('/matriculas', parent, 'POST', { alumno_id: childId, curso_id: 3, ciclo: 2028 }))
      .status,
    400,
  );
});
test('cancelar conserva trazabilidad y elimina el servicio de los reportes', async () => {
  const item = await db.get(
    "SELECT * FROM inscripciones WHERE alumno_id = ? AND tipo = 'comedor' AND estado = 'activo'",
    [childId],
  );
  assert.equal((await api(`/inscripciones/${item.id}`, otherParent, 'DELETE')).status, 403);
  assert.equal((await api(`/inscripciones/${item.id}`, parent, 'DELETE')).status, 200);
  assert.equal((await api(`/reportes/alumno/${childId}`, parent)).data.comedor, false);
  assert.equal(
    (await db.get('SELECT estado FROM inscripciones WHERE id = ?', [item.id])).estado,
    'cancelado',
  );
  const notices = await api('/notificaciones', parent);
  assert.ok(notices.data.some((n: any) => n.titulo === 'Inscripción cancelada'));
  assert.ok((await api('/admin/auditoria', admin)).data.length > 0);
});
test('evaluación, entrega, calificación e historial quedan visibles a la familia correcta', async () => {
  const assignment = await db.get('SELECT * FROM asignaciones_docentes WHERE docente_id = 2');
  const evaluation = await api('/evaluaciones', admin, 'POST', {
    asignacion_id: assignment.id,
    titulo: 'Trabajo práctico',
    fecha: '2027-04-01',
  });
  assert.equal(evaluation.status, 201);
  const id = evaluation.data.id;
  assert.equal(
    (
      await api('/entregas', parent, 'POST', {
        evaluacion_id: id,
        alumno_id: childId,
        archivo_url: 'https://example.com/trabajo.pdf',
        comentario: 'Entrega',
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await api('/calificaciones', parent, 'POST', {
        evaluacion_id: id,
        alumno_id: childId,
        calificacion: 9,
        observacion: 'Muy bien',
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await api('/calificaciones', teacher, 'POST', {
        evaluacion_id: id,
        alumno_id: childId,
        calificacion: 9,
        observacion: 'Muy bien',
      })
    ).status,
    403,
  );
  for (const nota of [8, 9])
    assert.equal(
      (
        await api('/calificaciones', admin, 'POST', {
          evaluacion_id: id,
          alumno_id: childId,
          calificacion: nota,
          observacion: 'Buena resolución',
        })
      ).status,
      201,
    );
  const family = await api(`/evaluaciones?alumno_id=${childId}`, parent);
  const own = family.data.find((e: any) => e.id === id);
  assert.equal(own.calificaciones[0].calificacion, 9);
  assert.equal(own.historial.length, 2);
  assert.equal(own.entregas.length, 1);
  assert.equal((await api(`/evaluaciones?alumno_id=${childId}`, otherParent)).status, 403);
});
test('notificaciones respetan la propiedad al marcarse como leídas', async () => {
  const notices = (await api('/notificaciones', parent)).data;
  assert.equal(
    (await api(`/notificaciones/${notices[0].id}/leida`, otherParent, 'PUT')).status,
    404,
  );
  assert.equal((await api(`/notificaciones/${notices[0].id}/leida`, parent, 'PUT')).status, 200);
});
test('las nueve variantes de reportes responden sin datos de contraseñas', async () => {
  await db.update('alumnos', childId, { domicilio: 'Av. Alberdi 450' });
  await db.update('alumnos', otherChild, { domicilio: 'Av. Sarmiento 820' });
  for (const path of [
    'alumnos-por-curso',
    'alumnos-por-deporte',
    'alumnos-por-deporte-nivel',
    'alumnos-por-deporte-detalle',
    'alumnos-por-recorrido',
    'alumnos-por-materia',
    'docentes-por-nivel',
    `alumno/${childId}`,
    'docente/1',
  ]) {
    const start = performance.now();
    const report = await api(`/reportes/${path}`, admin);
    assert.equal(report.status, 200, path);
    assert.ok(performance.now() - start < 1500, path);
    assert.ok(!JSON.stringify(report.data).includes('password_hash'));
  }
  const porRecorrido = await api('/reportes/alumnos-por-recorrido', admin);
  const pasajerosConDomicilio = porRecorrido.data.flatMap((r: any) => r.alumnos);
  assert.ok(pasajerosConDomicilio.length > 0);
  assert.ok(
    pasajerosConDomicilio.some(
      (a: any) => a.domicilio === 'Av. Alberdi 450' || a.domicilio === 'Av. Sarmiento 820',
    ),
  );
  const reporteDocente = await api('/reportes/docente/1', teacher);
  assert.equal(reporteDocente.status, 200);
  assert.ok(Array.isArray(reporteDocente.data.gruposDeporte));
  assert.ok(reporteDocente.data.gruposDeporte.length > 0);
  assert.ok(reporteDocente.data.gruposDeporte.every((g: any) => Array.isArray(g.alumnos)));
  assert.ok(
    reporteDocente.data.gruposDeporte.some((g: any) =>
      g.alumnos.some((a: any) => a.id === childId && a.apellido === 'Uno'),
    ),
  );
});
test('Decorator compone el arancel base y los servicios realmente activos', async () => {
  // Sin aranceles diferenciados la cuota vuelve a las tarifas planas por tipo.
  await db.run('UPDATE deportes SET arancel_mensual = 0');
  await db.run('UPDATE recorridos_transporte SET arancel_mensual = 0');
  for (const [tipo, monto] of [
    ['base', 50000],
    ['deporte', 5000],
    ['comedor', 12000],
    ['transporte', 9000],
  ]) {
    assert.equal((await api('/tarifas', admin, 'POST', { tipo, monto })).status, 201);
  }
  const quote = await api(`/padres/hijos/${childId}/arancel`, parent);
  assert.equal(quote.status, 200);
  assert.equal(quote.data.configurado, true);
  const services = await db.all(
    "SELECT tipo FROM inscripciones WHERE alumno_id = ? AND estado = 'activo'",
    [childId],
  );
  const amounts: any = { deporte: 5000, comedor: 12000, transporte: 9000 };
  assert.equal(
    quote.data.total,
    50000 + services.reduce((n: number, s: any) => n + amounts[s.tipo], 0),
  );
  assert.equal((await api(`/padres/hijos/${childId}/arancel`, otherParent)).status, 403);
});
test('Observer entrega correos por SMTP y registra errores para reintento', async () => {
  const { deliverPending } = await import('../server/core/notifications.ts');
  assert.equal((await deliverPending()).configurado, false);
  const messages: string[] = [];
  const smtp = net.createServer((socket) => {
    socket.write('220 test.local ESMTP\r\n');
    let buffer = '',
      data = false;
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      while (true) {
        if (data) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end < 0) return;
          messages.push(buffer.slice(0, end));
          buffer = buffer.slice(end + 5);
          data = false;
          socket.write('250 accepted\r\n');
        } else {
          const end = buffer.indexOf('\r\n');
          if (end < 0) return;
          const line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (/^EHLO/.test(line)) socket.write('250-test.local\r\n250 SIZE 262144\r\n');
          else if (/^DATA/.test(line)) {
            data = true;
            socket.write('354 Send data\r\n');
          } else if (/^QUIT/.test(line)) socket.end('221 bye\r\n');
          else socket.write('250 OK\r\n');
        }
      }
    });
  });
  smtp.listen(0, '127.0.0.1');
  await once(smtp, 'listening');
  process.env.SMTP_HOST = '127.0.0.1';
  process.env.SMTP_PORT = String((smtp.address() as net.AddressInfo).port);
  process.env.SMTP_FROM = 'escuela@test.local';
  try {
    const result = await deliverPending();
    assert.ok(result.enviados > 0);
    assert.equal(result.enviados, messages.length);
    assert.ok(messages.every((m) => /Message-ID: <educar-/i.test(m)));
  } finally {
    await new Promise<void>((done) => smtp.close(() => done()));
  }
  const owner = await db.get('SELECT usuario_padre_id FROM alumnos WHERE id = ?', [childId]);
  const id = await db.insert('notificaciones', {
    usuario_id: owner.usuario_padre_id,
    titulo: 'Reintento',
    mensaje: 'Prueba',
    email: 'test@test.local',
    fecha: new Date().toISOString(),
  });
  process.env.SMTP_PORT = '1';
  await deliverPending();
  const failed = await db.get('SELECT * FROM notificaciones WHERE id = ?', [id]);
  assert.equal(failed.estado_email, 'error');
  assert.equal(failed.intentos, 1);
  assert.ok(failed.proximo_intento);
  for (const key of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM']) delete process.env[key];
});
test('la carga administrativa conserva los legajos vinculados y los endpoints de detalle', async () => {
  const bootstrap = await api('/admin/bootstrap', admin);
  assert.equal(bootstrap.status, 200);
  const account = bootstrap.data.usuarios.find((user: any) => user.email === 'docente@educar.com');
  assert.equal(account.referencia_id, 1);
  assert.equal((await api('/alumnos/1', admin)).status, 200);
  assert.equal((await api('/alumnos/1', otherParent)).status, 403);
});
test('alumno autenticado consulta su propio legajo integral en modo lectura y no accede a otros alumnos', async () => {
  const studentLogin = await api('/auth/login', '', 'POST', {
    email: 'alumno@educar.com',
    password: 'alumno123',
  });
  assert.equal(studentLogin.status, 200);
  assert.equal(studentLogin.data.usuario.rol, 'alumno');
  assert.equal(studentLogin.data.usuario.referencia_id, 1);
  // Se conserva para los cruces RBAC de las tareas T05 sin volver a loguear
  // (el limitador de login es acotado por IP).
  student = studentLogin.cookie;

  const ownProfile = await api('/reportes/alumno/1', studentLogin.cookie);
  assert.equal(ownProfile.status, 200);
  assert.equal(ownProfile.data.alumno.id, 1);
  assert.ok(ownProfile.data.alumno.legajo);
  assert.ok(Array.isArray(ownProfile.data.materias));
  assert.ok(Array.isArray(ownProfile.data.deportes));
  assert.ok(Array.isArray(ownProfile.data.transporte));
  assert.equal(typeof ownProfile.data.comedor, 'boolean');

  assert.equal((await api(`/reportes/alumno/${childId}`, studentLogin.cookie)).status, 403);
});
test('asistencias por lote: permisos, atomicidad, fechas y actualización sin duplicados', async () => {
  const date = '2027-05-12';
  const mixed = await api('/asistencias', teacher, 'POST', {
    fecha: date,
    registros: [
      { alumno_id: 1, presente: true },
      { alumno_id: childId, presente: true },
    ],
  });
  assert.equal(mixed.status, 403);
  assert.equal(
    await db.get('SELECT id FROM asistencias_diarias WHERE alumno_id = 1 AND fecha = ?', [date]),
    undefined,
  );
  for (const presente of [true, false]) {
    assert.equal(
      (
        await api('/asistencias', teacher, 'POST', {
          fecha: date,
          registros: [{ alumno_id: 1, presente }],
        })
      ).status,
      201,
    );
  }
  const rows = await db.all('SELECT * FROM asistencias_diarias WHERE alumno_id = 1 AND fecha = ?', [
    date,
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].presente, 0);
  assert.equal(
    (
      await api('/asistencias', teacher, 'POST', {
        fecha: '2027-02-31',
        registros: [{ alumno_id: 1, presente: true }],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api('/asistencias', teacher, 'POST', {
        fecha: date,
        registros: [
          { alumno_id: 1, presente: true },
          { alumno_id: 1, presente: false },
        ],
      })
    ).status,
    400,
  );
  const result = await api(`/asistencias?fecha=${date}`, teacher);
  assert.equal(result.status, 200);
  assert.ok(result.data.every((row: any) => row.alumno.curso_id === 1));
});
test('las evaluaciones cargan sus relaciones en bloque sin mezclar notas ni entregas', async () => {
  const assignment = await db.get('SELECT * FROM asignaciones_docentes WHERE docente_id = 2');
  for (let i = 0; i < 5; i++) {
    assert.equal(
      (
        await api('/evaluaciones', admin, 'POST', {
          asignacion_id: assignment.id,
          titulo: `Consulta por lote ${i}`,
          fecha: '2027-05-15',
        })
      ).status,
      201,
    );
  }
  const originalAll = db.all;
  let queries = 0;
  db.all = (...args: unknown[]) => {
    queries++;
    return originalAll(...args);
  };
  try {
    const response = await api(`/evaluaciones?alumno_id=${childId}`, parent);
    assert.equal(response.status, 200);
    assert.ok(response.data.length >= 6);
    assert.ok(queries <= 4, `Se esperaban consultas agrupadas; se hicieron ${queries}.`);
    const graded = response.data.find((row: any) => row.titulo === 'Trabajo práctico');
    assert.equal(graded.calificaciones[0].calificacion, 9);
    for (const row of response.data.filter((row: any) =>
      row.titulo.startsWith('Consulta por lote'),
    )) {
      assert.deepEqual(row.calificaciones, []);
      assert.deepEqual(row.entregas, []);
      assert.deepEqual(row.historial, []);
    }
  } finally {
    db.all = originalAll;
  }
});
test('rechaza escrituras de otros sitios y conserva la sesión original', async () => {
  for (const headers of [
    { Origin: 'https://sitio-ajeno.example' },
    { 'Sec-Fetch-Site': 'cross-site' },
  ]) {
    const response = await fetch(base + '/auth/logout', {
      method: 'POST',
      headers: { Cookie: parent, ...headers },
    });
    assert.equal(response.status, 403);
    assert.equal((await api('/auth/me', parent)).status, 200);
  }
});

test('los datos privados no se cachean y no se divulga el framework', async () => {
  const response = await fetch(base + '/admin/bootstrap', { headers: { Cookie: admin } });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('cache-control')!, /no-store/);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = JSON.stringify(await response.json());
  assert.ok(!body.includes('password_hash'));
  assert.ok(!body.includes('session_version'));
});

test('cuerpos ausentes, JSON inválido y tamaños excesivos devuelven errores controlados', async () => {
  for (const [path, method, cookie] of [
    ['/auth/login', 'POST', ''],
    ['/auth/password', 'PUT', parent],
    ['/cursos', 'POST', admin],
  ]) {
    const response = await fetch(base + path, { method, headers: { Cookie: cookie } });
    assert.equal(response.status, 400, path);
  }
  for (const body of ['[]', '{"email":', 'null']) {
    const response = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    assert.equal(response.status, 400, body);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  const oversized = await fetch(base + '/contacto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje: 'x'.repeat(270000) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal((await api('/health')).status, 200);
});

test('el registro no eleva permisos y cambiar contraseña revoca la sesión anterior', async () => {
  const email = 'seguridad-familia@test.com';
  const initial = 'Clave-Inicial-2027';
  const updated = 'Clave-Actualizada-2027';
  const created = await api('/padres/registro', '', 'POST', {
    email,
    password: initial,
    nombre_padre: 'Prueba Seguridad',
    nombre_hijo: 'Hijo Seguridad',
    apellido_hijo: 'Prueba',
    dni_hijo: '51112233',
    curso_id: 2,
    rol: 'admin',
    referencia_id: 1,
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.usuario.rol, 'padre');
  assert.equal((await api('/usuarios', created.cookie)).status, 403);
  assert.equal(
    (
      await api('/auth/password', created.cookie, 'PUT', {
        actual: 'incorrecta',
        password: updated,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api('/auth/password', created.cookie, 'PUT', {
        actual: initial,
        password: 123456789012,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api('/auth/password', created.cookie, 'PUT', {
        actual: initial,
        password: 'á'.repeat(40),
      })
    ).status,
    400,
  );
  assert.equal((await api('/auth/me', created.cookie)).status, 200);
  assert.equal(
    (await api('/auth/password', created.cookie, 'PUT', { actual: initial, password: updated }))
      .status,
    200,
  );
  assert.equal((await api('/auth/me', created.cookie)).status, 401);
  assert.equal((await api('/auth/login', '', 'POST', { email, password: initial })).status, 401);
  const login = await api('/auth/login', '', 'POST', { email, password: updated });
  assert.equal(login.status, 200);
  assert.equal((await api('/auth/me', login.cookie)).status, 200);
});

test('un fallo de base de datos no se interpreta como una sesión inválida', async () => {
  const originalGet = db.get;
  db.get = async () => {
    throw Object.assign(new Error('Fallo simulado'), { code: 'ECONNRESET' });
  };
  try {
    const response = await api('/auth/me', parent);
    assert.equal(response.status, 500);
    assert.ok(!JSON.stringify(response.data).includes('ECONNRESET'));
  } finally {
    db.get = originalGet;
  }
  assert.equal((await api('/auth/me', parent)).status, 200);
});

test('logout revoca el token y no permite reutilizarlo', async () => {
  assert.equal((await api('/auth/logout', parent, 'POST')).status, 200);
  assert.equal((await api('/auth/me', parent)).status, 401);
});

test('la recuperación de contraseña responde igual sin revelar si el email existe', async () => {
  const created = await api('/padres/registro', '', 'POST', {
    email: 'recupero@test.com',
    password,
    nombre_padre: 'Recupera Clave',
    nombre_hijo: 'Hijo Recupera',
    apellido_hijo: 'Tres',
    dni_hijo: '57777333',
    curso_id: 2,
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  recoveryUserId = created.data.usuario.id;
  const existing = await api('/auth/forgot-password', '', 'POST', {
    email: 'recupero@test.com',
  });
  const unknown = await api('/auth/forgot-password', '', 'POST', {
    email: 'nadie@desconocido.com',
  });
  assert.equal(existing.status, 200);
  assert.equal(unknown.status, 200);
  assert.deepEqual(unknown.data, existing.data);
  assert.match(existing.data.mensaje, /está registrado/);
  for (const invalid of [undefined, 'no-es-un-email'])
    assert.equal(
      (await api('/auth/forgot-password', '', 'POST', { email: invalid })).status,
      invalid === undefined ? 400 : 200,
    );
});

test('la recuperación genera un token de un solo uso y solo avisa al usuario existente', async () => {
  const countsBefore = {
    tokens: Number((await db.get('SELECT COUNT(*) AS total FROM password_resets')).total),
    avisos: Number(
      (
        await db.get(
          "SELECT COUNT(*) AS total FROM notificaciones WHERE titulo = 'Recuperación de contraseña'",
        )
      ).total,
    ),
  };
  // Un email desconocido no toca la base: ni tokens ni avisos.
  await api('/auth/forgot-password', '', 'POST', { email: 'nadie@desconocido.com' });
  const afterUnknown = await db.get('SELECT COUNT(*) AS total FROM password_resets');
  assert.equal(Number(afterUnknown.total), countsBefore.tokens);
  const avisosTrasDesconocido = await db.get(
    "SELECT COUNT(*) AS total FROM notificaciones WHERE titulo = 'Recuperación de contraseña'",
  );
  assert.equal(Number(avisosTrasDesconocido.total), countsBefore.avisos);
  // Un email existente crea un token con hash y aviso, e invalida los previos sin usar.
  await api('/auth/forgot-password', '', 'POST', { email: 'recupero@test.com' });
  await api('/auth/forgot-password', '', 'POST', { email: 'recupero@test.com' });
  const tokens = await db.all(
    'SELECT * FROM password_resets WHERE usuario_id = ? ORDER BY id DESC',
    [recoveryUserId],
  );
  assert.equal(tokens.length, countsBefore.tokens + 2);
  assert.ok(tokens.filter((t: any) => Number(t.usado) === 0).length === 1, 'queda un solo token vivo');
  const row = tokens[0];
  assert.match(row.token_hash, /^[a-f0-9]{64}$/);
  assert.ok(new Date(row.expira_en).getTime() > Date.now());
  const avisos = await db.all(
    "SELECT * FROM notificaciones WHERE usuario_id = ? AND titulo = 'Recuperación de contraseña' ORDER BY id DESC",
    [recoveryUserId],
  );
  assert.equal(avisos.length, countsBefore.avisos + 2);
  const raw = /token=([A-Za-z0-9_-]+)/.exec(avisos[0].mensaje);
  assert.ok(raw, 'el correo contiene el enlace con el token crudo');
  recoveryToken = raw![1];
  assert.ok(recoveryToken.length >= 43, 'token de 32 bytes url-safe');
});

test('el restablecimiento cambia la clave, revoca sesiones y el token no se reutiliza', async () => {
  const oldSession = (
    await api('/auth/login', '', 'POST', { email: 'recupero@test.com', password })
  ).cookie;
  assert.ok(oldSession);
  const nueva = 'Restablecida-2027';
  // Contraseña inválida: mismo esquema de validación que el cambio de contraseña.
  for (const badPassword of ['corta', 123456789012, 'á'.repeat(40)]) {
    const rejected = await api('/auth/reset-password', '', 'POST', {
      token: recoveryToken,
      password: badPassword,
    });
    assert.equal(rejected.status, 400);
    assert.match(rejected.data.error, /La contraseña debe tener entre 10 y 72 caracteres/);
  }
  // El token sobrevive a los intentos inválidos.
  const missing = await api('/auth/reset-password', '', 'POST', { password: nueva });
  assert.equal(missing.status, 400);
  const reset = await api('/auth/reset-password', '', 'POST', {
    token: recoveryToken,
    password: nueva,
  });
  assert.equal(reset.status, 200, JSON.stringify(reset.data));
  assert.equal((await api('/auth/me', oldSession)).status, 401);
  assert.equal(
    (await api('/auth/login', '', 'POST', { email: 'recupero@test.com', password })).status,
    401,
  );
  const relogin = await api('/auth/login', '', 'POST', {
    email: 'recupero@test.com',
    password: nueva,
  });
  assert.equal(relogin.status, 200);
  assert.equal((await api('/auth/me', relogin.cookie)).status, 200);
  const reused = await api('/auth/reset-password', '', 'POST', {
    token: recoveryToken,
    password: nueva,
  });
  assert.equal(reused.status, 400);
  assert.match(reused.data.error, /no es válido o ya expiró/);
});

test('un enlace vencido o desconocido responde igual y no toca la cuenta', async () => {
  await db.insert('password_resets', {
    usuario_id: recoveryUserId,
    token_hash: sha256('enlace-vencido-educar'),
    expira_en: new Date(Date.now() - 60000).toISOString(),
  });
  const expired = await api('/auth/reset-password', '', 'POST', {
    token: 'enlace-vencido-educar',
    password,
  });
  const unknown = await api('/auth/reset-password', '', 'POST', {
    token: 'enlace-desconocido-educar',
    password,
  });
  assert.equal(expired.status, 400);
  assert.equal(unknown.status, 400);
  assert.deepEqual(unknown.data, expired.data);
  // La contraseña actual sigue siendo la establecida en el flujo válido.
  assert.equal(
    (await api('/auth/login', '', 'POST', { email: 'recupero@test.com', password: 'Restablecida-2027' }))
      .status,
    200,
  );
});

test('el acceso limita intentos repetidos de autenticación', async () => {
  const results = await Promise.all(
    Array.from({ length: 35 }, () => api('/auth/login', '', 'POST', {})),
  );
  assert.ok(results.some((result) => result.status === 429));
  assert.ok(results.every((result) => result.status === 400 || result.status === 429));
});

test('migración v5 agrega aranceles diferenciados y las tablas financieras', async () => {
  const version = await db.get('SELECT MAX(version) AS version FROM schema_migrations');
  assert.ok(Number(version.version) >= 5);
  for (const table of [
    'facturas',
    'factura_items',
    'pagos_comprobantes',
    'pago_comprobante_items',
    'recibos',
    'password_resets',
    'avisos_facturacion_log',
  ]) {
    assert.ok(
      await db.get('SELECT name FROM sqlite_master WHERE type = ? AND name = ?', [
        'table',
        table,
      ]),
      `Falta la tabla ${table}.`,
    );
  }
  const deporte = await db.get('SELECT arancel_mensual FROM deportes WHERE id = 1');
  assert.ok(deporte.arancel_mensual !== undefined && Number(deporte.arancel_mensual) >= 0);
});

test('la cuota mensual usa aranceles diferenciados por deporte y recorrido', async () => {
  const { monthlyQuote } = await import('../server/core/fees.js');
  for (const [tipo, monto] of [
    ['base', 50000],
    ['deporte', 5000],
    ['comedor', 12000],
    ['transporte', 9000],
  ]) {
    if (!(await db.get('SELECT id FROM tarifas WHERE tipo = ?', [tipo])))
      await db.insert('tarifas', { tipo, monto });
  }
  // Alumno 2 del seed: Futbol (grupo 1) y Recorrido 1 de transporte.
  await db.run('UPDATE deportes SET arancel_mensual = 8000 WHERE id = 1');
  await db.run('UPDATE recorridos_transporte SET arancel_mensual = 9200 WHERE id = 1');
  const quote = await monthlyQuote(2);
  assert.equal(quote.configurado, true);
  assert.equal(quote.conceptos.find((c: any) => c.concepto === 'Deporte: Futbol').monto, 8000);
  assert.equal(quote.conceptos.find((c: any) => c.concepto === 'Transporte').monto, 9200);
  assert.equal(quote.total, 50000 + 8000 + 9200);
  // Con arancel 0 cae a la tarifa plana por tipo (comportamiento previo).
  await db.run('UPDATE deportes SET arancel_mensual = 0');
  await db.run('UPDATE recorridos_transporte SET arancel_mensual = 0');
  const flat = await monthlyQuote(2);
  assert.equal(flat.conceptos.find((c: any) => c.concepto === 'Deporte: Futbol').monto, 5000);
  assert.equal(flat.conceptos.find((c: any) => c.concepto === 'Transporte').monto, 9000);
  assert.equal(flat.total, 50000 + 5000 + 9000);
});

test('el admin configura aranceles diferenciados con validación', async () => {
  assert.equal(
    (
      await api('/deportes', admin, 'POST', {
        nombre: 'Basquet',
        profesor_id: 3,
        arancel_mensual: -1,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await api('/deportes', admin, 'POST', {
        nombre: 'Basquet',
        profesor_id: 3,
        arancel_mensual: 7500,
      })
    ).status,
    201,
  );
  const row = await db.get("SELECT arancel_mensual FROM deportes WHERE nombre = 'Basquet'");
  assert.equal(Number(row.arancel_mensual), 7500);
  assert.equal((await api('/recorridos/1', admin, 'PUT', { arancel_mensual: 12345 })).status, 200);
  const route = await db.get('SELECT arancel_mensual FROM recorridos_transporte WHERE id = 1');
  assert.equal(Number(route.arancel_mensual), 12345);
});

test('un alumno no puede superar los dos deportes simultáneos', async () => {
  // El alumno 3 del seed ya tiene dos deportes activos; se intenta un tercero.
  const alumno = await db.get('SELECT * FROM alumnos WHERE id = 3');
  assert.ok(alumno, 'Falta el alumno 3 del seed.');
  const existing = await db.get(
    "SELECT COUNT(*) AS total FROM inscripciones WHERE alumno_id = 3 AND tipo = 'deporte' AND estado = 'activo'",
  );
  assert.equal(Number(existing.total), 2);
  const basquet = await db.get("SELECT id FROM deportes WHERE nombre = 'Basquet'");
  assert.ok(basquet, 'Depende del test de CRUD de aranceles.');
  const grupoId = await db.insert('grupos_deporte', {
    deporte_id: basquet.id,
    nivel: alumno.nivel,
    dia: 'Sábado',
    horario: '09:00 - 10:30',
    profesor_id: 3,
  });
  const third = await api('/inscripciones', admin, 'POST', {
    alumno_id: 3,
    tipo: 'deporte',
    grupo_deporte_id: grupoId,
  });
  assert.equal(third.status, 409);
  assert.match(JSON.stringify(third.data), /dos deportes/);
});

test('T02 facturación mensual: genera período, idempotente y respeta RBAC', async () => {
  const periodo = '2026-03';
  const gen = await api('/facturas/generar-periodo', admin, 'POST', { periodo });
  assert.equal(gen.status, 201, JSON.stringify(gen.data));
  assert.equal(gen.data.periodo, periodo);
  assert.ok(gen.data.creadas >= 2, JSON.stringify(gen.data));
  const retry = await api('/facturas/generar-periodo', admin, 'POST', { periodo });
  assert.equal(retry.status, 201);
  assert.equal(retry.data.creadas, 0);
  assert.ok(retry.data.omitidas >= 2);
  assert.equal((await api('/facturas/generar-periodo', otherParent, 'POST', { periodo })).status, 403);
  assert.equal((await api('/facturas/generar-periodo', '', 'POST', { periodo })).status, 401);
  assert.equal((await api('/facturas/generar-periodo', admin, 'POST', { periodo: '2026-13' })).status, 400);
  const list = await api(`/facturas?alumno_id=${otherChild}`, otherParent);
  assert.equal(list.status, 200, JSON.stringify(list.data));
  assert.ok(Array.isArray(list.data) && list.data.length === 1);
  const fac = list.data[0];
  assert.equal(fac.periodo, periodo);
  assert.match(fac.numero_factura, /^FAC-202603-\d{4}$/);
  assert.ok(fac.total > 0 && fac.saldo_pendiente === fac.total);
  const detail = await api(`/facturas/${fac.id}`, otherParent);
  assert.equal(detail.status, 200);
  assert.ok(Array.isArray(detail.data.items) && detail.data.items.length >= 1);
  assert.equal((await api(`/facturas/${fac.id}`, otherParent)).status, 200);
  const pagos = await api(`/pagos/alumno/${otherChild}`, otherParent);
  assert.equal(pagos.status, 200);
  assert.ok(Array.isArray(pagos.data.comprobantes) && Array.isArray(pagos.data.recibos));
  assert.equal((await api(`/facturas/${fac.id}`, admin)).status, 200);
  assert.equal((await api(`/pagos/alumno/${otherChild}`, admin)).status, 200);
});

test('T02 estado vencida se deriva en lectura y no se persiste', async () => {
  const fac = await db.get('SELECT * FROM facturas ORDER BY id DESC LIMIT 1');
  assert.ok(fac);
  await db.run("UPDATE facturas SET fecha_vencimiento = '2000-01-10', estado = 'pendiente' WHERE id = ?", [fac.id]);
  const list = await api(`/facturas?alumno_id=${fac.alumno_id}&estado=vencida`, admin);
  assert.equal(list.status, 200);
  assert.ok(list.data.some((r) => r.id === fac.id), JSON.stringify(list.data));
  const stored = await db.get('SELECT estado FROM facturas WHERE id = ?', [fac.id]);
  assert.equal(stored.estado, 'pendiente');
});

test('T03 comprobantes: subida, validación ACID y archivo con RBAC', async () => {
  const periodo = '2026-04';
  const gen = await api('/facturas/generar-periodo', admin, 'POST', { periodo });
  assert.equal(gen.status, 201, JSON.stringify(gen.data));
  const list = await api(`/facturas?alumno_id=${otherChild}`, otherParent);
  assert.equal(list.status, 200, JSON.stringify(list.data));
  const fac = list.data.find((r) => r.periodo === periodo);
  assert.ok(fac, JSON.stringify(list.data));
  const detail = await api(`/facturas/${fac.id}`, otherParent);
  assert.equal(detail.status, 200);
  const item = detail.data.items.find((it) => it.monto - it.monto_pagado > 0);
  assert.ok(item);
  const resto = Math.round((item.monto - item.monto_pagado) * 100) / 100;
  const png1px = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const badMime = await api(`/facturas/${fac.id}/comprobantes`, otherParent, 'POST', {
    item_ids: [item.id],
    archivo_nombre: 'x.txt',
    archivo_mime: 'text/plain',
    archivo_contenido: png1px,
    monto_declarado: resto,
  });
  assert.equal(badMime.status, 400);
  const sub = await api(`/facturas/${fac.id}/comprobantes`, otherParent, 'POST', {
    item_ids: [item.id],
    archivo_nombre: 'comprobante.png',
    archivo_mime: 'image/png',
    archivo_contenido: png1px,
    monto_declarado: resto,
    referencia_transferencia: 'TRF-1',
  });
  assert.equal(sub.status, 201, JSON.stringify(sub.data));
  const compId = sub.data.id;
  const archivoOk = await fetch(base + `/comprobantes/${compId}/archivo`, { headers: { Cookie: otherParent } });
  assert.equal(archivoOk.status, 200);
  assert.match(archivoOk.headers.get('content-type') || '', /image\/png/);
  const archivoAdmin = await fetch(base + `/comprobantes/${compId}/archivo`, { headers: { Cookie: admin } });
  assert.equal(archivoAdmin.status, 200);
  const queue = await api('/admin/comprobantes?estado=en_revision', admin);
  assert.equal(queue.status, 200);
  assert.ok(queue.data.some((r) => r.id === compId));
  assert.equal((await api('/admin/comprobantes', otherParent)).status, 403);
  const sinMotivo = await api(`/admin/comprobantes/${compId}/validar`, admin, 'PUT', { accion: 'rechazar', motivo_rechazo: '' });
  assert.equal(sinMotivo.status, 400);
  const apr = await api(`/admin/comprobantes/${compId}/validar`, admin, 'PUT', { accion: 'aprobar' });
  assert.equal(apr.status, 200, JSON.stringify(apr.data));
  assert.match(apr.data.numero_recibo, /^REC-\d{6}-\d{4}$/);
  const fac2 = await api(`/facturas/${fac.id}`, otherParent);
  assert.equal(fac2.status, 200);
  const it2 = fac2.data.items.find((it) => it.id === item.id);
  assert.equal(it2.estado, 'pagado');
  const pagos = await api(`/pagos/alumno/${otherChild}`, otherParent);
  assert.ok(pagos.data.recibos.length >= 1);
});

test('T04 deuda, PDFs y jobs idempotentes con RBAC', async () => {
  const periodo = '2026-05';
  const gen = await api('/facturas/generar-periodo', admin, 'POST', { periodo });
  assert.equal(gen.status, 201, JSON.stringify(gen.data));
  const deudaPadre = await api(`/deuda/alumno/${otherChild}`, otherParent);
  assert.equal(deudaPadre.status, 200, JSON.stringify(deudaPadre.data));
  assert.ok(deudaPadre.data.total_deuda > 0);
  assert.ok(Array.isArray(deudaPadre.data.facturas) && deudaPadre.data.facturas.length >= 1);
  assert.ok(Array.isArray(deudaPadre.data.facturas[0].items));
  // parent (familia1) quedó revocado por el test de logout: el cruce se prueba con otherParent sobre childId.
  assert.equal((await api(`/deuda/alumno/${childId}`, otherParent)).status, 403);
  assert.equal((await api(`/deuda/alumno/${otherChild}`)).status, 401);
  const deudaAdmin = await api(`/deuda/alumno/${otherChild}`, admin);
  assert.equal(deudaAdmin.status, 200);
  const fac = deudaPadre.data.facturas.find((r: { periodo: string }) => r.periodo === periodo);
  assert.ok(fac, JSON.stringify(deudaPadre.data.facturas.map((r: { periodo: string }) => r.periodo)));
  const pdfOk = await fetch(`${base}/facturas/${fac.id}/pdf`, { headers: { Cookie: otherParent } });
  assert.equal(pdfOk.status, 200);
  assert.match(pdfOk.headers.get('content-type') || '', /application\/pdf/);
  const pdfBytes = Buffer.from(await pdfOk.arrayBuffer());
  assert.equal(pdfBytes.subarray(0, 4).toString(), '%PDF');
  const deudaOtraFamilia = await api(`/deuda/alumno/${childId}`, admin);
  const facOtra = deudaOtraFamilia.data.facturas.find((r: { periodo: string }) => r.periodo === periodo);
  if (facOtra) {
    assert.equal((await fetch(`${base}/facturas/${facOtra.id}/pdf`, { headers: { Cookie: otherParent } })).status, 403);
  }
  assert.equal((await fetch(`${base}/facturas/${fac.id}/pdf`)).status, 401);
  const pagosRango = await api(`/pagos/alumno/${otherChild}?desde=2026-01-01&hasta=2026-12-31`, otherParent);
  assert.equal(pagosRango.status, 200);
  assert.ok(Array.isArray(pagosRango.data.comprobantes) && Array.isArray(pagosRango.data.recibos));
  const job1 = await api('/jobs/recordatorio-fin-mes', admin, 'POST', { periodo });
  assert.equal(job1.status, 201, JSON.stringify(job1.data));
  assert.ok(job1.data.enviadas >= 1, JSON.stringify(job1.data));
  const job1Retry = await api('/jobs/recordatorio-fin-mes', admin, 'POST', { periodo });
  assert.equal(job1Retry.status, 201);
  assert.equal(job1Retry.data.enviadas, 0);
  assert.ok(job1Retry.data.omitidas >= 1);
  assert.equal((await api('/jobs/recordatorio-fin-mes', otherParent, 'POST', { periodo })).status, 403);
  assert.equal((await api('/jobs/recordatorio-fin-mes', admin, 'POST', { periodo: '2026-13' })).status, 400);
  const job2 = await api('/jobs/aviso-deuda-dia-20', admin, 'POST', { periodo });
  assert.equal(job2.status, 201, JSON.stringify(job2.data));
  assert.ok(job2.data.enviadas >= 1);
  const logs = await db.all('SELECT * FROM avisos_facturacion_log WHERE periodo = ?', [periodo]);
  assert.ok(logs.length >= 2);
  assert.ok(logs.some((r: { tipo_aviso: string }) => r.tipo_aviso === 'fin_de_mes'));
  assert.ok(logs.some((r: { tipo_aviso: string }) => r.tipo_aviso === 'deuda_dia_20'));
  const reciboRow = await db.get('SELECT id FROM recibos ORDER BY id DESC LIMIT 1');
  if (reciboRow) {
    const pdfRec = await fetch(`${base}/recibos/${reciboRow.id}/pdf`, { headers: { Cookie: admin } });
    assert.equal(pdfRec.status, 200);
    assert.match(pdfRec.headers.get('content-type') || '', /application\/pdf/);
  }
});

test('T04 HU-18: el rango desde/hasta incluye el día completo del extremo final', async () => {
  const periodo = '2026-08';
  assert.equal((await api('/facturas/generar-periodo', admin, 'POST', { periodo })).status, 201);
  const facs = (await api(`/facturas?alumno_id=${otherChild}`, otherParent)).data;
  const fac = facs.find((f: { periodo: string }) => f.periodo === periodo);
  assert.ok(fac, JSON.stringify(facs));
  const item = (await api(`/facturas/${fac.id}`, otherParent)).data.items.find((i: { monto: number; monto_pagado: number }) => i.monto - i.monto_pagado > 0);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const sub = await api(`/facturas/${fac.id}/comprobantes`, otherParent, 'POST', {
    item_ids: [item.id], archivo_nombre: 'rango.png', archivo_mime: 'image/png', archivo_contenido: png,
    monto_declarado: Math.round((item.monto - item.monto_pagado) * 100) / 100,
  });
  assert.equal(sub.status, 201, JSON.stringify(sub.data));
  const hoy = new Date().toISOString().slice(0, 10);
  const mismoDia = await api(`/pagos/alumno/${otherChild}?desde=${hoy}&hasta=${hoy}`, otherParent);
  assert.equal(mismoDia.status, 200);
  assert.ok(mismoDia.data.comprobantes.some((c: { id: number }) => c.id === sub.data.id), JSON.stringify(mismoDia.data.comprobantes));
  const emision = String(fac.fecha_emision).slice(0, 10);
  const rango = await api(`/facturas?alumno_id=${otherChild}&desde=${emision}&hasta=${emision}`, otherParent);
  assert.ok(rango.data.some((f: { id: number }) => f.id === fac.id), JSON.stringify(rango.data));
});

test('T04 HU-19: la deuda itemiza por concepto y el total coincide con la suma', async () => {
  const deuda = await api(`/deuda/alumno/${otherChild}`, otherParent);
  assert.equal(deuda.status, 200);
  const items = deuda.data.facturas.flatMap((f: { items: unknown[] }) => f.items);
  assert.ok(items.some((i: { tipo: string }) => i.tipo === 'base'));
  assert.ok(items.every((i: { descripcion: string }) => typeof i.descripcion === 'string' && i.descripcion.length > 0));
  const suma = Math.round(deuda.data.facturas.reduce((n: number, f: { saldo_pendiente: number }) => n + Number(f.saldo_pendiente), 0) * 100) / 100;
  assert.equal(Number(deuda.data.total_deuda), suma);
});

test('T04 HU-18/HU-19: rango inclusivo, borde negativo y deuda por concepto con pago parcial', async () => {
  const periodo = '2026-09';
  assert.equal((await api('/facturas/generar-periodo', admin, 'POST', { periodo })).status, 201);
  const facs = (await api(`/facturas?alumno_id=${otherChild}`, otherParent)).data;
  const fac = facs.find((f: { periodo: string; fecha_emision: string }) => f.periodo === periodo);
  assert.ok(fac, JSON.stringify(facs));
  const emision = String(fac.fecha_emision).slice(0, 10);
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const mismoDia = await api(`/facturas?alumno_id=${otherChild}&desde=${emision}&hasta=${emision}`, otherParent);
  assert.ok(mismoDia.data.some((f: { id: number }) => f.id === fac.id), JSON.stringify(mismoDia.data));
  const anterior = await api(`/facturas?alumno_id=${otherChild}&desde=2000-01-01&hasta=${ayer}`, otherParent);
  assert.equal(anterior.data.filter((f: { id: number }) => f.id === fac.id).length, 0, JSON.stringify(anterior.data));
  const deuda = await api(`/deuda/alumno/${otherChild}`, otherParent);
  assert.equal(deuda.status, 200, JSON.stringify(deuda.data));
  const enDeuda = deuda.data.facturas.find((f: { id: number }) => f.id === fac.id);
  assert.ok(enDeuda, JSON.stringify(deuda.data.facturas));
  assert.match(String(enDeuda.numero_factura), /^FAC-\d{6}-\d{4}$/);
  assert.ok(enDeuda.items.length >= 1, JSON.stringify(enDeuda.items));
  for (const it of enDeuda.items) {
    assert.ok(typeof it.descripcion === 'string' && it.descripcion.length > 0);
    assert.equal(typeof it.monto_pagado, 'number');
  }
  const item = enDeuda.items.find((it: { monto: number; monto_pagado: number }) => it.monto - it.monto_pagado > 0);
  assert.ok(item);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const sub = await api(`/facturas/${fac.id}/comprobantes`, otherParent, 'POST', {
    item_ids: [item.id], archivo_nombre: 'parcial.png', archivo_mime: 'image/png', archivo_contenido: png,
    monto_declarado: Math.round((item.monto - item.monto_pagado) * 100) / 100,
  });
  assert.equal(sub.status, 201, JSON.stringify(sub.data));
  const apr = await api(`/admin/comprobantes/${sub.data.id}/validar`, admin, 'PUT', { accion: 'aprobar' });
  assert.equal(apr.status, 200, JSON.stringify(apr.data));
  const pagosHoy = await api(`/pagos/alumno/${otherChild}?desde=${hoy}&hasta=${hoy}`, otherParent);
  assert.ok(pagosHoy.data.comprobantes.some((c: { id: number }) => c.id === sub.data.id), JSON.stringify(pagosHoy.data.comprobantes));
  assert.ok(pagosHoy.data.recibos.length >= 1, JSON.stringify(pagosHoy.data.recibos));
  const pagosAyer = await api(`/pagos/alumno/${otherChild}?desde=2000-01-01&hasta=${ayer}`, otherParent);
  assert.equal(pagosAyer.data.comprobantes.length, 0, JSON.stringify(pagosAyer.data.comprobantes));
  assert.equal(pagosAyer.data.recibos.length, 0, JSON.stringify(pagosAyer.data.recibos));
  const deuda2 = await api(`/deuda/alumno/${otherChild}`, otherParent);
  const f2 = deuda2.data.facturas.find((f: { id: number }) => f.id === fac.id);
  if (f2) {
    assert.ok(f2.items.find((i: { id: number }) => i.id === item.id).monto_pagado > 0);
    assert.ok(f2.items.filter((i: { id: number }) => i.id !== item.id).every((i: { monto_pagado: number }) => i.monto_pagado === 0));
  }
  const suma = Math.round(deuda2.data.facturas.reduce((n: number, f: { saldo_pendiente: number }) => n + Number(f.saldo_pendiente), 0) * 100) / 100;
  assert.equal(Number(deuda2.data.total_deuda), suma);
});

test('T05 HU-22 a HU-26: reportes financieros con datos, rango y filtros', async () => {
  // Datos nuevos: inscripción a deporte (Basquet con arancel diferenciado) y a
  // transporte (recorrido 1 con arancel diferenciado), y facturación de 2026-10.
  const alumnoRow = await db.get('SELECT * FROM alumnos WHERE id = ?', [otherChild]);
  assert.ok(alumnoRow);
  const basquet = await db.get("SELECT id, arancel_mensual FROM deportes WHERE nombre = 'Basquet'");
  assert.ok(basquet, 'Depende del CRUD de aranceles.');
  const grupoId = await db.insert('grupos_deporte', {
    deporte_id: basquet.id,
    nivel: alumnoRow.nivel,
    dia: 'Sábado',
    horario: '18:00 - 19:30',
    profesor_id: 3,
    cupo: 10,
  });
  const insDeporte = await api('/inscripciones', otherParent, 'POST', {
    alumno_id: otherChild,
    tipo: 'deporte',
    grupo_deporte_id: grupoId,
  });
  assert.equal(insDeporte.status, 201, JSON.stringify(insDeporte.data));
  const recorridoRow = await db.get('SELECT id, arancel_mensual FROM recorridos_transporte WHERE id = 1');
  const insTransporte = await api('/inscripciones', otherParent, 'POST', {
    alumno_id: otherChild,
    tipo: 'transporte',
    recorrido_id: recorridoRow.id,
  });
  assert.equal(insTransporte.status, 201, JSON.stringify(insTransporte.data));
  const periodo = '2026-10';
  assert.equal((await api('/facturas/generar-periodo', admin, 'POST', { periodo })).status, 201);
  const items = await db.all(
    'SELECT fi.tipo, fi.monto, fi.monto_pagado, fi.referencia_id FROM factura_items fi JOIN facturas f ON f.id = fi.factura_id WHERE f.alumno_id = ? AND f.periodo = ?',
    [otherChild, periodo],
  );
  // otherChild ya trae otros servicios del seed: el ítem de Basquet se identifica
  // por su referencia (deporte_id) y no por ser el único ítem de deporte.
  const deporteItem = items.find(
    (i: { tipo: string; referencia_id: number }) =>
      i.tipo === 'deporte' && Number(i.referencia_id) === Number(basquet.id),
  );
  const transporteItem = items.find((i: { tipo: string }) => i.tipo === 'transporte');
  assert.ok(deporteItem, JSON.stringify(items));
  assert.equal(Number(deporteItem.monto), Number(basquet.arancel_mensual));
  assert.ok(transporteItem, JSON.stringify(items));
  assert.equal(Number(transporteItem.monto), Number(recorridoRow.arancel_mensual));

  // HU-22: ingresos por período a partir de recibos (monto_total).
  const hoy = new Date().toISOString().slice(0, 10);
  const ayer = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const ingresos = await api('/reportes/ingresos-periodo?desde=2000-01-01&hasta=2999-12-31', admin);
  assert.equal(ingresos.status, 200, JSON.stringify(ingresos.data));
  assert.ok(ingresos.data.cantidad >= 2, JSON.stringify(ingresos.data));
  assert.ok(ingresos.data.total > 0);
  // Los recibos aprobados son de hoy: el rango que termina ayer no captura nada.
  const ingresosAyer = await api(`/reportes/ingresos-periodo?desde=2000-01-01&hasta=${ayer}`, admin);
  assert.equal(ingresosAyer.status, 200);
  assert.equal(ingresosAyer.data.cantidad, 0, JSON.stringify(ingresosAyer.data));
  assert.equal(ingresosAyer.data.total, 0);

  // HU-23: pagos completos (saldo_pendiente = 0).
  const completos = await api('/reportes/pagos-completos', admin);
  assert.equal(completos.status, 200, JSON.stringify(completos.data));
  assert.ok(Array.isArray(completos.data));
  for (const f of completos.data) {
    assert.equal(Number(f.saldo_pendiente), 0);
    assert.ok(f.numero_factura && f.alumno?.id && Number(f.total) > 0, JSON.stringify(f));
  }
  const completosAyer = await api(`/reportes/pagos-completos?desde=2000-01-01&hasta=${ayer}`, admin);
  assert.equal(completosAyer.status, 200);
  assert.equal(completosAyer.data.length, 0, JSON.stringify(completosAyer.data));

  // HU-24: pagos incompletos con saldo y estado derivado (vencida en lectura).
  const incompletos = await api('/reportes/pagos-incompletos', admin);
  assert.equal(incompletos.status, 200, JSON.stringify(incompletos.data));
  assert.ok(
    Array.isArray(incompletos.data) &&
      incompletos.data.some(
        (f: { periodo: string; alumno: { id: number } }) =>
          f.periodo === '2026-03' && f.alumno.id === otherChild,
      ),
    JSON.stringify(incompletos.data),
  );
  for (const f of incompletos.data) {
    assert.ok(Number(f.saldo_pendiente) > 0, JSON.stringify(f));
    assert.ok(
      ['pendiente', 'parcial', 'en_revision', 'pagada', 'vencida'].includes(f.estado),
      JSON.stringify(f),
    );
  }
  // Filtros de ciclo (debe coincidir con el AAAA del período) y de curso.
  const ciclo2026 = await api('/reportes/pagos-incompletos?ciclo=2026', admin);
  assert.equal(ciclo2026.status, 200);
  assert.equal(ciclo2026.data.length, incompletos.data.length, JSON.stringify(ciclo2026.data));
  const ciclo1999 = await api('/reportes/pagos-incompletos?ciclo=1999', admin);
  assert.equal(ciclo1999.status, 200);
  assert.equal(ciclo1999.data.length, 0);
  const porCurso = await api(`/reportes/pagos-incompletos?curso_id=${alumnoRow.curso_id}`, admin);
  assert.equal(porCurso.status, 200);
  assert.ok(
    porCurso.data.some((f: { alumno: { id: number } }) => f.alumno.id === otherChild),
    JSON.stringify(porCurso.data),
  );

  // HU-25: pagos por deporte con filtros combinables (nivel/horario/profesor).
  const porDeporte = await api('/reportes/pagos-por-deporte', admin);
  assert.equal(porDeporte.status, 200, JSON.stringify(porDeporte.data));
  const basquetRow = porDeporte.data.find((r: { deporte: string }) => r.deporte === 'Basquet');
  assert.ok(basquetRow, JSON.stringify(porDeporte.data));
  assert.equal(Number(basquetRow.imputado), Number(basquet.arancel_mensual));
  assert.equal(Number(basquetRow.pagado), 0);
  assert.equal(Number(basquetRow.pendiente), Number(basquet.arancel_mensual));
  assert.ok(
    basquetRow.grupos.some(
      (g: { nivel: string; dia: string; horario: string; profesor: string | null }) =>
        g.nivel === alumnoRow.nivel && g.dia === 'Sábado' && g.horario === '18:00 - 19:30' && g.profesor,
    ),
    JSON.stringify(basquetRow.grupos),
  );
  const filtroCompuesto = await api(
    `/reportes/pagos-por-deporte?deporte_id=${basquet.id}&nivel=${encodeURIComponent(alumnoRow.nivel)}&horario=${encodeURIComponent('18:00 - 19:30')}&profesor_id=3`,
    admin,
  );
  assert.equal(filtroCompuesto.status, 200, JSON.stringify(filtroCompuesto.data));
  assert.ok(filtroCompuesto.data.some((r: { deporte: string }) => r.deporte === 'Basquet'));
  const nivelAjeno = await api(
    `/reportes/pagos-por-deporte?nivel=${encodeURIComponent('Nivel Inexistente')}`,
    admin,
  );
  assert.equal(nivelAjeno.status, 200);
  assert.equal(nivelAjeno.data.filter((r: { deporte: string }) => r.deporte === 'Basquet').length, 0);
  const profesorAjeno = await api('/reportes/pagos-por-deporte?profesor_id=99999', admin);
  assert.equal(profesorAjeno.status, 200);
  assert.equal(profesorAjeno.data.length, 0);
  const deportesRangoAyer = await api(`/reportes/pagos-por-deporte?hasta=${ayer}`, admin);
  assert.equal(deportesRangoAyer.status, 200);
  assert.equal(deportesRangoAyer.data.length, 0, JSON.stringify(deportesRangoAyer.data));

  // HU-26: pagos por recorrido de transporte.
  const porTransporte = await api('/reportes/pagos-por-transporte', admin);
  assert.equal(porTransporte.status, 200, JSON.stringify(porTransporte.data));
  const recRow = porTransporte.data.find(
    (r: { recorrido_id: number }) => r.recorrido_id === Number(recorridoRow.id),
  );
  assert.ok(recRow, JSON.stringify(porTransporte.data));
  assert.ok(Number(recRow.imputado) >= Number(recorridoRow.arancel_mensual));
  for (const r of porTransporte.data) {
    assert.ok(
      Math.abs(Number(r.imputado) - Number(r.pagado) - Number(r.pendiente)) < 0.005,
      JSON.stringify(r),
    );
  }
  const filtroRecorrido = await api(
    `/reportes/pagos-por-transporte?recorrido_id=${recorridoRow.id}`,
    admin,
  );
  assert.ok(
    filtroRecorrido.data.every(
      (r: { recorrido_id: number }) => r.recorrido_id === Number(recorridoRow.id),
    ),
  );
  const transporteRangoAyer = await api(`/reportes/pagos-por-transporte?hasta=${ayer}`, admin);
  assert.equal(transporteRangoAyer.status, 200);
  assert.equal(transporteRangoAyer.data.length, 0);

  // La respuesta queda como JSON serializable: el CSV del visor se arma desde
  // el DOM de las tablas (#printable-report), nunca desde otra fuente.
  assert.deepEqual(JSON.parse(JSON.stringify(ingresos.data)), ingresos.data);
  assert.deepEqual(JSON.parse(JSON.stringify(completos.data)), completos.data);
  assert.deepEqual(JSON.parse(JSON.stringify(porDeporte.data)), porDeporte.data);
  assert.deepEqual(JSON.parse(JSON.stringify(porTransporte.data)), porTransporte.data);
});

test('T05: RBAC y validación de parámetros en los reportes financieros', async () => {
  // Cookie de alumno guardada por el test de legajo integral (no re-loguear:
  // el limitador de login es acotado por IP).
  const studentLogin = student;
  assert.ok(studentLogin);
  const rutas = [
    '/reportes/ingresos-periodo',
    '/reportes/pagos-completos',
    '/reportes/pagos-incompletos',
    '/reportes/pagos-por-deporte',
    '/reportes/pagos-por-transporte',
  ];
  for (const ruta of rutas) {
    assert.equal((await api(ruta)).status, 401, `anónimo: ${ruta}`);
    assert.equal((await api(ruta, otherParent)).status, 403, `padre: ${ruta}`);
    assert.equal((await api(ruta, studentLogin)).status, 403, `alumno: ${ruta}`);
  }
  // Parámetros inválidos → 400 con mensaje en español.
  assert.equal((await api('/reportes/ingresos-periodo?desde=ayer', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-completos?hasta=31-12-2026', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-incompletos?desde=x', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-incompletos?ciclo=x2026', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-incompletos?curso_id=abc', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-por-deporte?deporte_id=abc', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-por-deporte?profesor_id=abc', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-por-deporte?data=x&desde=2026-01-01&hasta=x', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-por-transporte?recorrido_id=abc', admin)).status, 400);
  assert.equal((await api('/reportes/pagos-por-transporte?hasta=x', admin)).status, 400);
});

test('T03 el rechazo libera los conceptos y no deja el comprobante en revisión', async () => {
  const periodo = '2026-12';
  assert.equal((await api('/facturas/generar-periodo', admin, 'POST', { periodo })).status, 201);
  const facs = (await api(`/facturas?alumno_id=${otherChild}`, otherParent)).data;
  const fac = facs.find((f: { periodo: string }) => f.periodo === periodo);
  assert.ok(fac, JSON.stringify(facs));
  const item = (await api(`/facturas/${fac.id}`, otherParent)).data.items.find(
    (i: { monto: number; monto_pagado: number }) => i.monto - i.monto_pagado > 0,
  );
  assert.ok(item);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const sub = await api(`/facturas/${fac.id}/comprobantes`, otherParent, 'POST', {
    item_ids: [item.id], archivo_nombre: 'rechazo.png', archivo_mime: 'image/png', archivo_contenido: png,
    monto_declarado: Math.round((item.monto - item.monto_pagado) * 100) / 100,
  });
  assert.equal(sub.status, 201, JSON.stringify(sub.data));
  const rec = await api(`/admin/comprobantes/${sub.data.id}/validar`, admin, 'PUT', {
    accion: 'rechazar',
    motivo_rechazo: 'Comprobante ilegible',
  });
  assert.equal(rec.status, 200, JSON.stringify(rec.data));
  assert.equal(rec.data.estado, 'rechazado');
  const fac2 = (await api(`/facturas/${fac.id}`, otherParent)).data;
  const it2 = fac2.items.find((i: { id: number }) => i.id === item.id);
  assert.equal(it2.estado, 'pendiente');
  assert.equal(fac2.saldo_pendiente, fac.total);
  const otra = await api(`/admin/comprobantes/${sub.data.id}/validar`, admin, 'PUT', {
    accion: 'rechazar',
    motivo_rechazo: 'Otro motivo',
  });
  assert.equal(otra.status, 400);
});

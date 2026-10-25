import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { once } from 'node:events';
import net from 'node:net';
import type { Server } from 'node:http';

let server: Server, db: any, base: string, dir: string;
let admin: string, parent: string, otherParent: string, teacher: string;
let childId: number, otherChild: number;
const password = 'Prueba-Segura-2027';
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
test('logout revoca el token y no permite reutilizarlo', async () => {
  assert.equal((await api('/auth/logout', parent, 'POST')).status, 200);
  assert.equal((await api('/auth/me', parent)).status, 401);
});

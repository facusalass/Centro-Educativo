import { db, databaseMode } from '../database.js';
export async function migrateConstraints() {
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 2')) return;
    await db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_alumno_dni ON alumnos(dni) WHERE dni <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_alumno_legajo ON alumnos(legajo) WHERE legajo <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_docente_dni ON docentes(dni) WHERE dni <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_docente_legajo ON docentes(legajo) WHERE legajo <> '';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_curso_division ON cursos(nivel_id, anio, division);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_inscripcion_grupo ON inscripciones(alumno_id, grupo_deporte_id) WHERE tipo = 'deporte' AND estado = 'activo';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_inscripcion_servicio ON inscripciones(alumno_id, tipo) WHERE tipo IN ('comedor', 'transporte') AND estado = 'activo';
      CREATE UNIQUE INDEX IF NOT EXISTS uq_asistencia_fecha ON asistencias_diarias(alumno_id, fecha);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_calificacion ON calificaciones_alumnos(alumno_id, evaluacion_id);
      CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_email ON usuarios_acceso(LOWER(email));
    `);
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      2,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 3')) return;
    const pk =
      databaseMode === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    await db.exec(
      `CREATE TABLE IF NOT EXISTS tarifas (id ${pk}, tipo TEXT NOT NULL UNIQUE CHECK(tipo IN ('base', 'deporte', 'transporte', 'comedor')), monto REAL NOT NULL CHECK(monto >= 0))`,
    );
    if (databaseMode === 'postgres') await db.exec('ALTER TABLE tarifas ENABLE ROW LEVEL SECURITY');
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      3,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 4')) return;
    for (const student of await db.all(
      "SELECT * FROM alumnos WHERE curso_id IS NULL AND curso <> '' AND division <> ''",
    )) {
      const level = await db.get(
        'SELECT id FROM niveles_educativos WHERE nombre = ? OR nombre = ?',
        [student.nivel, `Nivel ${student.nivel}`],
      );
      if (!level) continue;
      let course = await db.get(
        'SELECT * FROM cursos WHERE nivel_id = ? AND anio = ? AND division = ?',
        [level.id, student.curso, student.division],
      );
      if (!course)
        course = {
          id: await db.insert('cursos', {
            nivel_id: level.id,
            nivel: student.nivel,
            anio: student.curso,
            division: student.division,
            turno: 'A confirmar',
            cupo: 0,
            descripcion:
              'Curso recuperado de legajos existentes. Confirmar turno y cupo antes de abrir matrículas.',
          }),
        };
      await db.update('alumnos', student.id, { curso_id: course.id });
    }
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      4,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 5')) return;
    const pk =
      databaseMode === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    await db.exec(`
      ALTER TABLE deportes ADD COLUMN arancel_mensual REAL NOT NULL DEFAULT 0 CHECK (arancel_mensual >= 0);
      ALTER TABLE recorridos_transporte ADD COLUMN arancel_mensual REAL NOT NULL DEFAULT 0 CHECK (arancel_mensual >= 0);
      CREATE TABLE IF NOT EXISTS facturas (
        id ${pk},
        numero_factura TEXT NOT NULL UNIQUE,
        alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
        periodo TEXT NOT NULL,
        fecha_emision TEXT,
        fecha_vencimiento TEXT,
        total REAL NOT NULL CHECK (total >= 0),
        saldo_pendiente REAL NOT NULL CHECK (saldo_pendiente >= 0),
        estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'parcial', 'en_revision', 'pagada', 'vencida')),
        UNIQUE (alumno_id, periodo)
      );
      CREATE TABLE IF NOT EXISTS factura_items (
        id ${pk},
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        tipo TEXT NOT NULL CHECK (tipo IN ('base', 'deporte', 'transporte', 'comedor')),
        referencia_id INTEGER,
        descripcion TEXT NOT NULL,
        monto REAL NOT NULL CHECK (monto >= 0),
        monto_pagado REAL NOT NULL DEFAULT 0 CHECK (monto_pagado >= 0),
        estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'pagado'))
      );
      CREATE TABLE IF NOT EXISTS pagos_comprobantes (
        id ${pk},
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        padre_id INTEGER NOT NULL REFERENCES usuarios_acceso(id),
        fecha_presentacion TEXT,
        monto_declarado REAL NOT NULL CHECK (monto_declarado >= 0),
        referencia_transferencia TEXT DEFAULT '',
        archivo_nombre TEXT NOT NULL,
        archivo_mime TEXT NOT NULL,
        archivo_contenido TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('en_revision', 'aprobado', 'rechazado')),
        motivo_rechazo TEXT,
        validado_por INTEGER REFERENCES usuarios_acceso(id),
        fecha_validacion TEXT
      );
      CREATE TABLE IF NOT EXISTS pago_comprobante_items (
        id ${pk},
        comprobante_id INTEGER NOT NULL REFERENCES pagos_comprobantes(id),
        factura_item_id INTEGER NOT NULL REFERENCES factura_items(id),
        monto_imputado REAL NOT NULL CHECK (monto_imputado >= 0)
      );
      CREATE TABLE IF NOT EXISTS recibos (
        id ${pk},
        numero_recibo TEXT NOT NULL UNIQUE,
        comprobante_id INTEGER NOT NULL UNIQUE REFERENCES pagos_comprobantes(id),
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
        fecha_emision TEXT NOT NULL,
        monto_total REAL NOT NULL CHECK (monto_total >= 0),
        detalle_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS password_resets (
        id ${pk},
        usuario_id INTEGER NOT NULL REFERENCES usuarios_acceso(id),
        token_hash TEXT NOT NULL,
        expira_en TEXT NOT NULL,
        usado INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS avisos_facturacion_log (
        id ${pk},
        periodo TEXT NOT NULL,
        tipo_aviso TEXT NOT NULL CHECK (tipo_aviso IN ('fin_de_mes', 'deuda_dia_20')),
        padre_id INTEGER NOT NULL REFERENCES usuarios_acceso(id),
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        notificacion_id INTEGER REFERENCES notificaciones(id),
        fecha_envio TEXT NOT NULL,
        UNIQUE (periodo, tipo_aviso, factura_id)
      );
    `);
    if (databaseMode === 'postgres')
      await db.exec(`
        ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;
        ALTER TABLE factura_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pagos_comprobantes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pago_comprobante_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE avisos_facturacion_log ENABLE ROW LEVEL SECURITY;
      `);
    // Demo visibility only: the seed runs before migrations, so differentiated
    // demo rates are backfilled here (same precedent as the v4 data backfill).
    if (process.env.SEED_DEMO === 'true') {
      await db.run(
        'UPDATE deportes SET arancel_mensual = 8000 WHERE id = 1 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE deportes SET arancel_mensual = 6500 WHERE id = 2 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE deportes SET arancel_mensual = 10000 WHERE id = 3 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE deportes SET arancel_mensual = 7000 WHERE id = 4 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE recorridos_transporte SET arancel_mensual = 9200 WHERE id = 1 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE recorridos_transporte SET arancel_mensual = 9500 WHERE id = 2 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE recorridos_transporte SET arancel_mensual = 9100 WHERE id = 3 AND arancel_mensual = 0',
      );
      await db.run(
        'UPDATE recorridos_transporte SET arancel_mensual = 8800 WHERE id = 4 AND arancel_mensual = 0',
      );
    }
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      5,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 6')) return;
    const pk =
      databaseMode === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
    await db.exec(
      `DROP TABLE IF EXISTS pago_comprobante_items;
      DROP TABLE IF EXISTS recibos;
      DROP TABLE IF EXISTS pagos_comprobantes;
      DROP TABLE IF EXISTS avisos_facturacion_log;
      CREATE TABLE IF NOT EXISTS pagos_comprobantes (
        id ${pk},
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        padre_id INTEGER NOT NULL REFERENCES usuarios_acceso(id),
        fecha_presentacion TEXT,
        monto_declarado REAL NOT NULL CHECK (monto_declarado >= 0),
        referencia_transferencia TEXT DEFAULT '',
        archivo_nombre TEXT NOT NULL,
        archivo_mime TEXT NOT NULL,
        archivo_contenido TEXT NOT NULL,
        estado TEXT NOT NULL DEFAULT 'en_revision' CHECK (estado IN ('en_revision', 'aprobado', 'rechazado')),
        motivo_rechazo TEXT,
        validado_por INTEGER REFERENCES usuarios_acceso(id),
        fecha_validacion TEXT
      );
      CREATE TABLE IF NOT EXISTS pago_comprobante_items (
        id ${pk},
        comprobante_id INTEGER NOT NULL REFERENCES pagos_comprobantes(id),
        factura_item_id INTEGER NOT NULL REFERENCES factura_items(id),
        monto_imputado REAL NOT NULL CHECK (monto_imputado >= 0)
      );
      CREATE TABLE IF NOT EXISTS recibos (
        id ${pk},
        numero_recibo TEXT NOT NULL UNIQUE,
        comprobante_id INTEGER NOT NULL UNIQUE REFERENCES pagos_comprobantes(id),
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
        fecha_emision TEXT NOT NULL,
        monto_total REAL NOT NULL CHECK (monto_total >= 0),
        detalle_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS avisos_facturacion_log (
        id ${pk},
        periodo TEXT NOT NULL,
        tipo_aviso TEXT NOT NULL CHECK (tipo_aviso IN ('fin_de_mes', 'deuda_dia_20')),
        padre_id INTEGER NOT NULL REFERENCES usuarios_acceso(id),
        factura_id INTEGER NOT NULL REFERENCES facturas(id),
        notificacion_id INTEGER REFERENCES notificaciones(id),
        fecha_envio TEXT NOT NULL,
        UNIQUE (periodo, tipo_aviso, factura_id)
      );`,
    );
    if (databaseMode === 'postgres')
      await db.exec(`
        ALTER TABLE pagos_comprobantes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE pago_comprobante_items ENABLE ROW LEVEL SECURITY;
        ALTER TABLE recibos ENABLE ROW LEVEL SECURITY;
        ALTER TABLE avisos_facturacion_log ENABLE ROW LEVEL SECURITY;
      `);
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      6,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 7')) return;
    // `pragma_table_info` es exclusivo de SQLite. En Postgres se usa
    // information_schema/ADD COLUMN IF NOT EXISTS; ejecutar el pragma acá
    // abortaba la transacción completa y rompía el arranque en producción.
    const names = new Set<string>();
    if (databaseMode !== 'postgres') {
      const cols = await db.all('SELECT name FROM pragma_table_info(?)', ['notificaciones']);
      for (const c of cols as { name: string }[]) names.add(c.name);
    }
    const addCol = async (sql: string, col: string) => {
      if (names.has(col)) return;
      try {
        await db.exec(sql);
      } catch {
        if (databaseMode === 'sqlite') {
          const cols = await db.all('SELECT name FROM pragma_table_info(?)', ['notificaciones']);
          if (!(cols as { name: string }[]).some((c) => c.name === col))
            throw new Error(`No se pudo agregar la columna ${col}.`);
        }
      }
    };
    if (databaseMode === 'postgres') {
      await db.exec(`ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;
        ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS archivo_mime TEXT;
        ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS archivo_contenido TEXT;`);
    } else {
      await addCol('ALTER TABLE notificaciones ADD COLUMN archivo_nombre TEXT', 'archivo_nombre');
      await addCol('ALTER TABLE notificaciones ADD COLUMN archivo_mime TEXT', 'archivo_mime');
      await addCol(
        'ALTER TABLE notificaciones ADD COLUMN archivo_contenido TEXT',
        'archivo_contenido',
      );
    }
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      7,
      new Date().toISOString(),
    ]);
  });
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 8')) return;
    // REAL en Postgres es float4 (~7 dígitos): 125000.50 puede redondear.
    // DOUBLE PRECISION iguala al float8 de SQLite manteniendo JS number vía pg.
    if (databaseMode === 'postgres') {
      await db.exec(`
        ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE tarifas ALTER COLUMN monto TYPE DOUBLE PRECISION;
        ALTER TABLE deportes ALTER COLUMN arancel_mensual TYPE DOUBLE PRECISION;
        ALTER TABLE recorridos_transporte ALTER COLUMN arancel_mensual TYPE DOUBLE PRECISION;
        ALTER TABLE facturas ALTER COLUMN total TYPE DOUBLE PRECISION;
        ALTER TABLE facturas ALTER COLUMN saldo_pendiente TYPE DOUBLE PRECISION;
        ALTER TABLE factura_items ALTER COLUMN monto TYPE DOUBLE PRECISION;
        ALTER TABLE factura_items ALTER COLUMN monto_pagado TYPE DOUBLE PRECISION;
        ALTER TABLE pagos_comprobantes ALTER COLUMN monto_declarado TYPE DOUBLE PRECISION;
        ALTER TABLE pago_comprobante_items ALTER COLUMN monto_imputado TYPE DOUBLE PRECISION;
        ALTER TABLE recibos ALTER COLUMN monto_total TYPE DOUBLE PRECISION;
      `);
    }
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      8,
      new Date().toISOString(),
    ]);
  });
}

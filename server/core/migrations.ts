import bcrypt from 'bcryptjs';
import { db, databaseMode } from '../database.js';

// Versioned, additive migrations preserve the existing school records.
export async function migrateCore() {
  const pk =
    databaseMode === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  await db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)',
  );
  if (await db.get('SELECT version FROM schema_migrations WHERE version = 1')) return;
  await db.transaction(async () => {
    if (await db.get('SELECT version FROM schema_migrations WHERE version = 1')) return;
    const columns = [
      ['usuarios_acceso', 'password_hash', "TEXT DEFAULT ''"],
      ['usuarios_acceso', 'session_version', 'INTEGER DEFAULT 0'],
      ['alumnos', 'curso_id', 'INTEGER REFERENCES cursos(id)'],
      ['cursos', 'nivel_id', 'INTEGER REFERENCES niveles_educativos(id)'],
      ['cursos', 'cupo', 'INTEGER DEFAULT 40'],
      ['asignaciones_docentes', 'materia_id', 'INTEGER REFERENCES materias(id)'],
      ['grupos_deporte', 'cupo', 'INTEGER DEFAULT 30'],
      ['recorridos_transporte', 'cupo', 'INTEGER DEFAULT 40'],
      ['evaluaciones', 'docente_id', 'INTEGER REFERENCES docentes(id)'],
      ['calificaciones_alumnos', 'publicada', 'INTEGER DEFAULT 0'],
    ];
    for (const [table, column, definition] of columns) {
      if (!(await db.hasColumn(table, column)))
        await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
    await db.exec(`
      CREATE TABLE IF NOT EXISTS matriculas (
        id ${pk}, alumno_id INTEGER NOT NULL REFERENCES alumnos(id), curso_id INTEGER NOT NULL REFERENCES cursos(id),
        ciclo INTEGER NOT NULL, estado TEXT NOT NULL DEFAULT 'activo', fecha TEXT NOT NULL,
        UNIQUE(alumno_id, ciclo)
      );
      CREATE TABLE IF NOT EXISTS notificaciones (
        id ${pk}, usuario_id INTEGER NOT NULL REFERENCES usuarios_acceso(id), titulo TEXT NOT NULL,
        mensaje TEXT NOT NULL, email TEXT NOT NULL, leida INTEGER NOT NULL DEFAULT 0,
        estado_email TEXT NOT NULL DEFAULT 'pendiente', intentos INTEGER NOT NULL DEFAULT 0,
        fecha TEXT NOT NULL, proximo_intento TEXT, ultimo_error TEXT DEFAULT ''
      );
      CREATE TABLE IF NOT EXISTS auditoria (
        id ${pk}, usuario_id INTEGER, accion TEXT NOT NULL, recurso TEXT NOT NULL,
        recurso_id INTEGER, detalle TEXT NOT NULL DEFAULT '', fecha TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS entregas (
        id ${pk}, evaluacion_id INTEGER NOT NULL REFERENCES evaluaciones(id),
        alumno_id INTEGER NOT NULL REFERENCES alumnos(id), archivo_url TEXT NOT NULL,
        comentario TEXT NOT NULL DEFAULT '', fecha TEXT NOT NULL, UNIQUE(evaluacion_id, alumno_id)
      );
      CREATE TABLE IF NOT EXISTS historial_calificaciones (
        id ${pk}, alumno_id INTEGER NOT NULL REFERENCES alumnos(id), evaluacion_id INTEGER NOT NULL REFERENCES evaluaciones(id),
        docente_id INTEGER NOT NULL REFERENCES docentes(id), calificacion REAL NOT NULL, observacion TEXT NOT NULL, fecha TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_alumnos_padre ON alumnos(usuario_padre_id);
      CREATE INDEX IF NOT EXISTS idx_alumnos_curso ON alumnos(curso_id);
      CREATE INDEX IF NOT EXISTS idx_inscripciones_alumno ON inscripciones(alumno_id, tipo);
      CREATE INDEX IF NOT EXISTS idx_asignaciones_docente ON asignaciones_docentes(docente_id, curso_id);
      CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_matriculas_curso ON matriculas(curso_id, ciclo);
    `);
    for (const curso of await db.all('SELECT * FROM cursos')) {
      const nivel = await db.get(
        'SELECT id FROM niveles_educativos WHERE nombre = ? OR nombre = ?',
        [curso.nivel, `Nivel ${curso.nivel}`],
      );
      if (nivel) await db.update('cursos', curso.id, { nivel_id: nivel.id });
    }
    for (const alumno of await db.all('SELECT * FROM alumnos')) {
      const curso = await db.get(
        'SELECT id FROM cursos WHERE nivel = ? AND anio = ? AND division = ?',
        [alumno.nivel, alumno.curso, alumno.division],
      );
      if (curso) await db.update('alumnos', alumno.id, { curso_id: curso.id });
      if (!alumno.usuario_padre_id && alumno.tutor_email) {
        const parent = await db.get(
          "SELECT id FROM usuarios_acceso WHERE email = ? AND rol = 'padre'",
          [alumno.tutor_email],
        );
        if (parent) await db.update('alumnos', alumno.id, { usuario_padre_id: parent.id });
      }
    }
    for (const asignacion of await db.all('SELECT * FROM asignaciones_docentes')) {
      let materia = await db.get('SELECT id FROM materias WHERE nombre = ?', [asignacion.materia]);
      if (!materia)
        materia = {
          id: await db.insert('materias', { nombre: asignacion.materia, descripcion: '' }),
        };
      await db.update('asignaciones_docentes', asignacion.id, { materia_id: materia.id });
    }
    for (const usuario of await db.all(
      'SELECT id, password_demo, password_hash FROM usuarios_acceso',
    )) {
      if (usuario.password_demo)
        await db.update('usuarios_acceso', usuario.id, {
          password_hash: usuario.password_hash || (await bcrypt.hash(usuario.password_demo, 12)),
          password_demo: '',
        });
    }
    if (databaseMode === 'postgres') {
      for (const table of [
        'matriculas',
        'notificaciones',
        'auditoria',
        'entregas',
        'historial_calificaciones',
      ]) {
        await db.exec(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      }
    }
    await db.run('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [
      1,
      new Date().toISOString(),
    ]);
  });
}

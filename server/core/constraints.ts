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
}

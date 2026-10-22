import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
export const schoolTables = [
  'niveles_educativos',
  'docentes',
  'materias',
  'cursos',
  'usuarios_acceso',
  'alumnos',
  'servicios',
  'instalaciones',
  'deportes',
  'grupos_deporte',
  'recorridos_transporte',
  'asignaciones_docentes',
  'inscripciones',
  'alumnos_servicios',
  'asistencias_diarias',
  'evaluaciones',
  'calificaciones_alumnos',
  'opiniones_web',
  'solicitudes_inscripcion',
  'postulaciones_empleo',
  'noticias',
  'actividades_escolares',
  'galeria_imagenes',
  'contacto_mensajes',
  'matriculas',
  'notificaciones',
  'auditoria',
  'entregas',
  'historial_calificaciones',
  'tarifas',
];
const identifier = (name) => '"' + name.replaceAll('"', '""') + '"';
export async function snapshot(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    const { rows: tables } = await client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    );
    const backup = { version: 1, fecha: new Date().toISOString(), tablas: {} };
    for (const table of schoolTables.filter((t) => tables.some((r) => r.tablename === t)))
      backup.tablas[table] = (await client.query(`SELECT * FROM public.${identifier(table)}`)).rows;
    await client.query('COMMIT');
    return backup;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
export function encodeBackup(backup, key) {
  const plain = Buffer.from(JSON.stringify(backup));
  if (!key) return plain;
  const bytes = Buffer.from(key, 'base64');
  if (bytes.length !== 32) throw new Error('BACKUP_KEY debe contener 32 bytes en base64.');
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', bytes, iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.from(
    JSON.stringify({
      encrypted: true,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: data.toString('base64'),
    }),
  );
}
export function decodeBackup(buffer, key) {
  const parsed = JSON.parse(buffer.toString());
  if (!parsed.encrypted) return parsed;
  if (!key) throw new Error('Se necesita BACKUP_KEY para descifrar el respaldo.');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'base64'),
    Buffer.from(parsed.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
  return JSON.parse(
    Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64')),
      decipher.final(),
    ]).toString(),
  );
}
export async function restoreSnapshot(client, backup, replace = false) {
  if (!backup.tablas || !Object.keys(backup.tablas).length)
    throw new Error('El respaldo no contiene tablas escolares.');
  const tables = schoolTables.filter((t) => backup.tablas[t]);
  await client.query('BEGIN');
  try {
    await client.query('SELECT pg_advisory_xact_lock(1902027)');
    if (!replace)
      for (const table of schoolTables) {
        const count = await client.query(`SELECT COUNT(*) AS total FROM ${identifier(table)}`);
        if (Number(count.rows[0].total))
          throw new Error(
            'La base destino contiene datos. Para reemplazarlos se requiere --replace.',
          );
      }
    await client.query(
      `TRUNCATE ${schoolTables.map(identifier).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const table of tables) {
      const { rows: columns } = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1",
        [table],
      );
      for (const original of backup.tablas[table]) {
        const row = { ...original };
        if (table === 'usuarios_acceso' && row.password_demo) {
          row.password_hash = row.password_hash || (await bcrypt.hash(row.password_demo, 12));
          row.password_demo = '';
        }
        const fields = Object.keys(row).filter((f) => columns.some((c) => c.column_name === f));
        await client.query(
          `INSERT INTO ${identifier(table)} (${fields.map(identifier).join(', ')}) VALUES (${fields.map((_, i) => '$' + (i + 1)).join(', ')})`,
          fields.map((f) => row[f]),
        );
      }
      await client.query(
        `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${identifier(table)}), 1), EXISTS(SELECT 1 FROM ${identifier(table)}))`,
        [table],
      );
    }
    // Bring pre-upgrade snapshots forward without reintroducing demo passwords.
    await client.query(
      "UPDATE cursos c SET nivel_id = n.id FROM niveles_educativos n WHERE c.nivel_id IS NULL AND (n.nombre = c.nivel OR n.nombre = 'Nivel ' || c.nivel)",
    );
    await client.query(
      'UPDATE alumnos a SET curso_id = c.id FROM cursos c WHERE a.curso_id IS NULL AND a.nivel = c.nivel AND a.curso = c.anio AND a.division = c.division',
    );
    await client.query(
      "UPDATE alumnos a SET usuario_padre_id = u.id FROM usuarios_acceso u WHERE a.usuario_padre_id IS NULL AND u.rol = 'padre' AND LOWER(a.tutor_email) = LOWER(u.email)",
    );
    await client.query(
      "INSERT INTO materias(nombre, descripcion) SELECT DISTINCT a.materia, '' FROM asignaciones_docentes a WHERE NOT EXISTS (SELECT 1 FROM materias m WHERE m.nombre = a.materia) ON CONFLICT(nombre) DO NOTHING",
    );
    await client.query(
      'UPDATE asignaciones_docentes a SET materia_id = m.id FROM materias m WHERE a.materia_id IS NULL AND a.materia = m.nombre',
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

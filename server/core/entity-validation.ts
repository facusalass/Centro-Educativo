import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { assert, idOf } from './errors.ts';
import { validatePassword } from './security.ts';
import { overlaps, validateSchedule } from './enrollment.ts';
import { entities } from './entity-definitions.ts';
export async function validateEntity(key: string, incoming: any, id?: number) {
  const def = entities[key];
  const previous = id ? await db.get(`SELECT * FROM ${def.table} WHERE id = ?`, [id]) : {};
  assert(previous, 404, 'Registro no encontrado.');
  const data: Record<string, any> = {};
  for (const f of def.fields)
    if (incoming[f] !== undefined)
      data[f] = typeof incoming[f] === 'string' ? incoming[f].trim() : incoming[f];
  const merged = { ...previous, ...data };
  assert(
    def.required.every(
      (f) => merged[f] !== undefined && merged[f] !== null && String(merged[f]).trim() !== '',
    ),
    400,
    'Completá todos los campos obligatorios.',
  );
  assert(
    Object.values(data).every((v) => typeof v !== 'string' || v.length <= 12000),
    400,
    'El texto ingresado es demasiado largo.',
  );
  for (const f of ['nombre', 'apellido', 'titulo', 'legajo', 'dni', 'telefono', 'email'])
    if (data[f]) assert(String(data[f]).length <= 200, 400, `El campo ${f} es demasiado largo.`);
  if (merged.email) {
    data.email = String(merged.email).toLowerCase();
    assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email), 400, 'El email no es válido.');
  }
  if (merged.estado)
    assert(['activo', 'inactivo'].includes(merged.estado), 400, 'El estado no es válido.');
  if (merged.cupo !== undefined)
    assert(
      Number.isInteger(Number(merged.cupo)) && Number(merged.cupo) > 0,
      400,
      'El cupo debe ser un número entero positivo.',
    );
  for (const f of ['imagen_url', 'url_imagen'])
    if (merged[f])
      assert(/^https?:\/\//i.test(merged[f]), 400, 'Ingresá una URL http o https válida.');
  const ref = async (table: string, value: any) => {
    const row = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [idOf(value)]);
    assert(
      row && row.estado !== 'inactivo',
      400,
      'La referencia seleccionada no existe o está inactiva.',
    );
    return row;
  };
  if (key === 'tarifas') {
    assert(
      ['base', 'deporte', 'transporte', 'comedor'].includes(merged.tipo),
      400,
      'Seleccioná un concepto válido.',
    );
    assert(
      Number.isFinite(Number(merged.monto)) && Number(merged.monto) >= 0,
      400,
      'El arancel no puede ser negativo.',
    );
  }
  if (['alumnos', 'docentes'].includes(key)) {
    assert(/^\d{7,9}$/.test(merged.dni), 400, 'El DNI debe tener entre 7 y 9 dígitos.');
    for (const field of ['legajo', 'dni'])
      assert(
        !(await db.get(`SELECT id FROM ${def.table} WHERE ${field} = ? AND id <> ?`, [
          merged[field],
          id ?? 0,
        ])),
        409,
        `Ya existe un registro con ese ${field}.`,
      );
  }
  if (key === 'alumnos') {
    const course = await ref('cursos', merged.curso_id);
    data.nivel = course.nivel;
    data.curso = course.anio;
    data.division = course.division;
    if (merged.usuario_padre_id) {
      const parent = await ref('usuarios_acceso', merged.usuario_padre_id);
      assert(parent.rol === 'padre', 400, 'Elegí una cuenta de padre o tutor.');
      data.tutor_nombre = parent.nombre;
      data.tutor_email = parent.email;
    } else data.usuario_padre_id = null;
    if (id && previous.nivel !== course.nivel)
      assert(
        !(await db.get(
          "SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'deporte' AND estado = 'activo'",
          [id],
        )),
        409,
        'Cancelá los deportes antes de cambiar el nivel del alumno.',
      );
    if (id && previous.curso_id !== Number(merged.curso_id))
      assert(
        !(await db.get("SELECT id FROM matriculas WHERE alumno_id = ? AND estado = 'activo'", [
          id,
        ])),
        409,
        'El alumno tiene una matrícula activa; gestioná el cambio de curso desde su matrícula.',
      );
  }
  if (key === 'cursos') {
    const level = await ref('niveles_educativos', merged.nivel_id);
    data.nivel = level.nombre.replace(/^Nivel\s+/i, '');
    assert(
      !(await db.get(
        'SELECT id FROM cursos WHERE nivel_id = ? AND anio = ? AND division = ? AND id <> ?',
        [level.id, merged.anio, merged.division, id ?? 0],
      )),
      409,
      'Ya existe ese curso y división en el nivel.',
    );
    if (id && previous.nivel_id !== Number(merged.nivel_id))
      assert(
        !(await db.get('SELECT id FROM alumnos WHERE curso_id = ?', [id])),
        409,
        'El curso tiene alumnos: no se puede cambiar de nivel.',
      );
  }
  if (key === 'niveles') {
    assert(
      !(await db.get(
        'SELECT id FROM niveles_educativos WHERE LOWER(nombre) = LOWER(?) AND id <> ?',
        [merged.nombre, id ?? 0],
      )),
      409,
      'Ya existe ese nivel.',
    );
    if (id && merged.nombre !== previous.nombre)
      assert(
        !(await db.get('SELECT id FROM cursos WHERE nivel_id = ?', [id])),
        409,
        'El nivel está en uso: conservá su nombre y editá su descripción.',
      );
  }
  if (key === 'asignaciones-docentes') {
    await ref('docentes', merged.docente_id);
    await ref('cursos', merged.curso_id);
    const subject = await ref('materias', merged.materia_id);
    data.materia = subject.nombre;
    validateSchedule(merged);
    data.dia = merged.dia;
    data.horario = merged.horario;
    const others = await db.all(
      'SELECT * FROM asignaciones_docentes WHERE id <> ? AND (docente_id = ? OR curso_id = ?)',
      [id ?? 0, merged.docente_id, merged.curso_id],
    );
    assert(
      !others.some((a) => overlaps(a, merged)),
      409,
      'El docente o el curso ya tiene una actividad en ese horario.',
    );
    const sports = await db.all('SELECT * FROM grupos_deporte WHERE profesor_id = ?', [
      merged.docente_id,
    ]);
    assert(
      !sports.some((a) => overlaps(a, merged)),
      409,
      'El docente tiene un grupo deportivo en ese horario.',
    );
  }
  if (key === 'deportes') await ref('docentes', merged.profesor_id);
  if (key === 'grupos-deporte') {
    await ref('deportes', merged.deporte_id);
    await ref('docentes', merged.profesor_id);
    assert(
      await db.get('SELECT id FROM niveles_educativos WHERE nombre = ? OR nombre = ?', [
        merged.nivel,
        `Nivel ${merged.nivel}`,
      ]),
      400,
      'El nivel no existe.',
    );
    validateSchedule(merged);
    data.dia = merged.dia;
    data.horario = merged.horario;
    const classes = await db.all('SELECT * FROM asignaciones_docentes WHERE docente_id = ?', [
      merged.profesor_id,
    ]);
    const groups = await db.all('SELECT * FROM grupos_deporte WHERE profesor_id = ? AND id <> ?', [
      merged.profesor_id,
      id ?? 0,
    ]);
    assert(
      ![...classes, ...groups].some((g) => overlaps(g, merged)),
      409,
      'El profesor tiene otra actividad en ese horario.',
    );
    if (id) {
      const students = await db.all(
        "SELECT alumno_id FROM inscripciones WHERE grupo_deporte_id = ? AND estado = 'activo'",
        [id],
      );
      assert(
        students.length <= Number(merged.cupo),
        409,
        'El cupo no puede ser menor a las inscripciones activas.',
      );
      for (const student of students) {
        const person = await ref('alumnos', student.alumno_id);
        assert(person.nivel === merged.nivel, 409, 'El grupo tiene alumnos de otro nivel.');
        const other = await db.all(
          "SELECT g.* FROM inscripciones i JOIN grupos_deporte g ON g.id = i.grupo_deporte_id WHERE i.alumno_id = ? AND i.estado = 'activo' AND g.id <> ?",
          [person.id, id],
        );
        assert(
          !other.some(
            (g) => overlaps(g, merged) || Number(g.deporte_id) === Number(merged.deporte_id),
          ),
          409,
          'El cambio produce un conflicto en las inscripciones existentes.',
        );
      }
    }
  }
  if (key === 'recorridos') {
    assert(
      /^([01]\d|2[0-3]):[0-5]\d$/.test(String(merged.horario)),
      400,
      'Ingresá una hora de salida válida (HH:MM).',
    );
    if (!id) {
      const count = await db.get('SELECT COUNT(*) AS total FROM recorridos_transporte');
      assert(
        Number(count.total) < 4,
        409,
        'Solo se admiten los cuatro recorridos predefinidos. Editá uno existente.',
      );
    }
    if (id) {
      const count = await db.get(
        "SELECT COUNT(*) AS total FROM inscripciones WHERE recorrido_id = ? AND estado = 'activo'",
        [id],
      );
      assert(
        Number(count.total) <= Number(merged.cupo),
        409,
        'El cupo es menor a las inscripciones activas.',
      );
    }
  }
  if (key === 'usuarios') {
    assert(
      ['admin', 'docente', 'padre', 'alumno', 'personal'].includes(merged.rol),
      400,
      'El rol no es válido.',
    );
    assert(
      !(await db.get('SELECT id FROM usuarios_acceso WHERE LOWER(email) = ? AND id <> ?', [
        data.email,
        id ?? 0,
      ])),
      409,
      'Ya existe una cuenta con ese email.',
    );
    if (merged.rol === 'docente' || merged.rol === 'alumno')
      await ref(merged.rol === 'docente' ? 'docentes' : 'alumnos', merged.referencia_id);
    else data.referencia_id = null;
    if (incoming.password || incoming.password_demo || !id)
      data.password_hash = await bcrypt.hash(
        validatePassword(incoming.password ?? incoming.password_demo),
        12,
      );
    delete data.password;
    data.password_demo = '';
    if (id) data.session_version = (previous.session_version ?? 0) + 1;
    if (
      id &&
      previous.rol === 'admin' &&
      (merged.rol !== 'admin' || merged.estado === 'inactivo')
    ) {
      const count = await db.get(
        "SELECT COUNT(*) AS total FROM usuarios_acceso WHERE rol = 'admin' AND estado = 'activo' AND id <> ?",
        [id],
      );
      assert(Number(count.total) > 0, 409, 'Debe quedar al menos un administrador activo.');
    }
  }
  return data;
}

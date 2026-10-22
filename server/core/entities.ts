import type { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { assert, idOf } from './errors.ts';
import { audit, safeUser, validatePassword } from './security.ts';
import { overlaps, validateSchedule } from './enrollment.ts';
import { publish } from './notifications.ts';

type Definition = { table: string; fields: string[]; required: string[]; soft?: boolean };
export const entities: Record<string, Definition> = {
  tarifas: { table: 'tarifas', fields: ['tipo', 'monto'], required: ['tipo', 'monto'] },
  niveles: { table: 'niveles_educativos', fields: ['nombre', 'descripcion', 'etiqueta'], required: ['nombre', 'descripcion', 'etiqueta'] },
  alumnos: { table: 'alumnos', fields: ['nombre', 'apellido', 'legajo', 'dni', 'fecha_nacimiento', 'domicilio', 'telefono', 'email', 'curso_id', 'usuario_padre_id', 'estado'], required: ['nombre', 'apellido', 'legajo', 'dni', 'curso_id'], soft: true },
  docentes: { table: 'docentes', fields: ['nombre', 'apellido', 'legajo', 'dni', 'email', 'telefono', 'especialidad', 'estado'], required: ['nombre', 'apellido', 'legajo', 'dni', 'email', 'especialidad'], soft: true },
  cursos: { table: 'cursos', fields: ['nivel_id', 'anio', 'division', 'turno', 'descripcion', 'cupo'], required: ['nivel_id', 'anio', 'division', 'turno'] },
  materias: { table: 'materias', fields: ['nombre', 'descripcion'], required: ['nombre'] },
  'asignaciones-docentes': { table: 'asignaciones_docentes', fields: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'], required: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'] },
  deportes: { table: 'deportes', fields: ['nombre', 'descripcion', 'profesor_id'], required: ['nombre', 'profesor_id'] },
  'grupos-deporte': { table: 'grupos_deporte', fields: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id', 'cupo'], required: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id'] },
  recorridos: { table: 'recorridos_transporte', fields: ['nombre', 'descripcion', 'horario', 'zona', 'cupo'], required: ['nombre', 'descripcion', 'horario', 'zona'] },
  servicios: { table: 'servicios', fields: ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'], required: ['nombre', 'descripcion'] },
  instalaciones: { table: 'instalaciones', fields: ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'], required: ['nombre', 'descripcion'] },
  noticias: { table: 'noticias', fields: ['titulo', 'descripcion', 'contenido', 'fecha_publicacion', 'tipo', 'visible', 'imagen_url'], required: ['titulo', 'descripcion'] },
  actividades: { table: 'actividades_escolares', fields: ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'], required: ['titulo', 'descripcion', 'nivel', 'fecha'] },
  galeria: { table: 'galeria_imagenes', fields: ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'], required: ['titulo', 'url_imagen'] },
  usuarios: { table: 'usuarios_acceso', fields: ['nombre', 'nombre_usuario', 'email', 'rol', 'estado', 'referencia_id', 'password'], required: ['nombre', 'email', 'rol'], soft: true },
};

export async function validateEntity(key: string, incoming: any, id?: number) {
  const def = entities[key];
  const previous = id ? await db.get(`SELECT * FROM ${def.table} WHERE id = ?`, [id]) : {};
  assert(previous, 404, 'Registro no encontrado.');
  const data: Record<string, any> = {};
  for (const f of def.fields) if (incoming[f] !== undefined) data[f] = typeof incoming[f] === 'string' ? incoming[f].trim() : incoming[f];
  const merged = { ...previous, ...data };
  assert(def.required.every((f) => merged[f] !== undefined && merged[f] !== null && String(merged[f]).trim() !== ''), 400, 'Completá todos los campos obligatorios.');
  assert(Object.values(data).every((v) => typeof v !== 'string' || v.length <= 12000), 400, 'El texto ingresado es demasiado largo.');
  for (const f of ['nombre', 'apellido', 'titulo', 'legajo', 'dni', 'telefono', 'email']) if (data[f]) assert(String(data[f]).length <= 200, 400, `El campo ${f} es demasiado largo.`);
  if (merged.email) { data.email = String(merged.email).toLowerCase(); assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email), 400, 'El email no es válido.'); }
  if (merged.estado) assert(['activo', 'inactivo'].includes(merged.estado), 400, 'El estado no es válido.');
  if (merged.cupo !== undefined) assert(Number.isInteger(Number(merged.cupo)) && Number(merged.cupo) > 0, 400, 'El cupo debe ser un número entero positivo.');
  for (const f of ['imagen_url', 'url_imagen']) if (merged[f]) assert(/^https?:\/\//i.test(merged[f]), 400, 'Ingresá una URL http o https válida.');
  const ref = async (table: string, value: any) => { const row = await db.get(`SELECT * FROM ${table} WHERE id = ?`, [idOf(value)]); assert(row && row.estado !== 'inactivo', 400, 'La referencia seleccionada no existe o está inactiva.'); return row; };
  if (key === 'tarifas') {
    assert(['base', 'deporte', 'transporte', 'comedor'].includes(merged.tipo), 400, 'Seleccioná un concepto válido.');
    assert(Number.isFinite(Number(merged.monto)) && Number(merged.monto) >= 0, 400, 'El arancel no puede ser negativo.');
  }
  if (['alumnos', 'docentes'].includes(key)) {
    assert(/^\d{7,9}$/.test(merged.dni), 400, 'El DNI debe tener entre 7 y 9 dígitos.');
    for (const field of ['legajo', 'dni']) assert(!(await db.get(`SELECT id FROM ${def.table} WHERE ${field} = ? AND id <> ?`, [merged[field], id ?? 0])), 409, `Ya existe un registro con ese ${field}.`);
  }
  if (key === 'alumnos') {
    const course = await ref('cursos', merged.curso_id);
    data.nivel = course.nivel; data.curso = course.anio; data.division = course.division;
    if (merged.usuario_padre_id) {
      const parent = await ref('usuarios_acceso', merged.usuario_padre_id); assert(parent.rol === 'padre', 400, 'Elegí una cuenta de padre o tutor.');
      data.tutor_nombre = parent.nombre; data.tutor_email = parent.email;
    } else data.usuario_padre_id = null;
    if (id && previous.nivel !== course.nivel) assert(!(await db.get("SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'deporte' AND estado = 'activo'", [id])), 409, 'Cancelá los deportes antes de cambiar el nivel del alumno.');
    if (id && previous.curso_id !== Number(merged.curso_id)) assert(!(await db.get("SELECT id FROM matriculas WHERE alumno_id = ? AND estado = 'activo'", [id])), 409, 'El alumno tiene una matrícula activa; gestioná el cambio de curso desde su matrícula.');
  }
  if (key === 'cursos') {
    const level = await ref('niveles_educativos', merged.nivel_id); data.nivel = level.nombre.replace(/^Nivel\s+/i, '');
    assert(!(await db.get('SELECT id FROM cursos WHERE nivel_id = ? AND anio = ? AND division = ? AND id <> ?', [level.id, merged.anio, merged.division, id ?? 0])), 409, 'Ya existe ese curso y división en el nivel.');
    if (id && previous.nivel_id !== Number(merged.nivel_id)) assert(!(await db.get('SELECT id FROM alumnos WHERE curso_id = ?', [id])), 409, 'El curso tiene alumnos: no se puede cambiar de nivel.');
  }
  if (key === 'niveles') {
    assert(!(await db.get('SELECT id FROM niveles_educativos WHERE LOWER(nombre) = LOWER(?) AND id <> ?', [merged.nombre, id ?? 0])), 409, 'Ya existe ese nivel.');
    if (id && merged.nombre !== previous.nombre) assert(!(await db.get('SELECT id FROM cursos WHERE nivel_id = ?', [id])), 409, 'El nivel está en uso: conservá su nombre y editá su descripción.');
  }
  if (key === 'asignaciones-docentes') {
    await ref('docentes', merged.docente_id); await ref('cursos', merged.curso_id);
    const subject = await ref('materias', merged.materia_id); data.materia = subject.nombre;
    validateSchedule(merged); data.dia = merged.dia; data.horario = merged.horario;
    const others = await db.all('SELECT * FROM asignaciones_docentes WHERE id <> ? AND (docente_id = ? OR curso_id = ?)', [id ?? 0, merged.docente_id, merged.curso_id]);
    assert(!others.some((a) => overlaps(a, merged)), 409, 'El docente o el curso ya tiene una actividad en ese horario.');
    const sports = await db.all('SELECT * FROM grupos_deporte WHERE profesor_id = ?', [merged.docente_id]);
    assert(!sports.some((a) => overlaps(a, merged)), 409, 'El docente tiene un grupo deportivo en ese horario.');
  }
  if (key === 'materias' && id && merged.nombre !== previous.nombre) await db.run('UPDATE asignaciones_docentes SET materia = ? WHERE materia_id = ?', [merged.nombre, id]);
  if (key === 'deportes') await ref('docentes', merged.profesor_id);
  if (key === 'grupos-deporte') {
    await ref('deportes', merged.deporte_id); await ref('docentes', merged.profesor_id);
    assert(await db.get('SELECT id FROM niveles_educativos WHERE nombre = ? OR nombre = ?', [merged.nivel, `Nivel ${merged.nivel}`]), 400, 'El nivel no existe.');
    validateSchedule(merged); data.dia = merged.dia; data.horario = merged.horario;
    const classes = await db.all('SELECT * FROM asignaciones_docentes WHERE docente_id = ?', [merged.profesor_id]);
    const groups = await db.all('SELECT * FROM grupos_deporte WHERE profesor_id = ? AND id <> ?', [merged.profesor_id, id ?? 0]);
    assert(![...classes, ...groups].some((g) => overlaps(g, merged)), 409, 'El profesor tiene otra actividad en ese horario.');
    if (id) {
      const students = await db.all("SELECT alumno_id FROM inscripciones WHERE grupo_deporte_id = ? AND estado = 'activo'", [id]);
      assert(students.length <= Number(merged.cupo), 409, 'El cupo no puede ser menor a las inscripciones activas.');
      for (const student of students) {
        const person = await ref('alumnos', student.alumno_id);
        assert(person.nivel === merged.nivel, 409, 'El grupo tiene alumnos de otro nivel.');
        const other = await db.all("SELECT g.* FROM inscripciones i JOIN grupos_deporte g ON g.id = i.grupo_deporte_id WHERE i.alumno_id = ? AND i.estado = 'activo' AND g.id <> ?", [person.id, id]);
        assert(!other.some((g) => overlaps(g, merged) || Number(g.deporte_id) === Number(merged.deporte_id)), 409, 'El cambio produce un conflicto en las inscripciones existentes.');
      }
    }
  }
  if (key === 'recorridos') {
    assert(/^([01]\d|2[0-3]):[0-5]\d$/.test(String(merged.horario)), 400, 'Ingresá una hora de salida válida (HH:MM).');
    if (!id) { const count = await db.get('SELECT COUNT(*) AS total FROM recorridos_transporte'); assert(Number(count.total) < 4, 409, 'Solo se admiten los cuatro recorridos predefinidos. Editá uno existente.'); }
    if (id) { const count = await db.get("SELECT COUNT(*) AS total FROM inscripciones WHERE recorrido_id = ? AND estado = 'activo'", [id]); assert(Number(count.total) <= Number(merged.cupo), 409, 'El cupo es menor a las inscripciones activas.'); }
  }
  if (key === 'usuarios') {
    assert(['admin', 'docente', 'padre', 'alumno', 'personal'].includes(merged.rol), 400, 'El rol no es válido.');
    assert(!(await db.get('SELECT id FROM usuarios_acceso WHERE LOWER(email) = ? AND id <> ?', [data.email, id ?? 0])), 409, 'Ya existe una cuenta con ese email.');
    if (merged.rol === 'docente' || merged.rol === 'alumno') await ref(merged.rol === 'docente' ? 'docentes' : 'alumnos', merged.referencia_id);
    else data.referencia_id = null;
    if (incoming.password || incoming.password_demo || !id) data.password_hash = await bcrypt.hash(validatePassword(incoming.password ?? incoming.password_demo), 12);
    delete data.password; data.password_demo = '';
    if (id) data.session_version = (previous.session_version ?? 0) + 1;
    if (id && previous.rol === 'admin' && (merged.rol !== 'admin' || merged.estado === 'inactivo')) {
      const count = await db.get("SELECT COUNT(*) AS total FROM usuarios_acceso WHERE rol = 'admin' AND estado = 'activo' AND id <> ?", [id]);
      assert(Number(count.total) > 0, 409, 'Debe quedar al menos un administrador activo.');
    }
  }
  return data;
}

export function registerEntities(app: Express) {
  for (const [key, def] of Object.entries(entities)) {
    // Public content reads keep their curated legacy endpoints below.
    if (!['niveles', 'servicios', 'instalaciones', 'noticias', 'actividades', 'galeria'].includes(key)) app.get(`/api/${key}`, async (req, res) => {
      let rows = await db.all(`SELECT * FROM ${def.table} ORDER BY id`);
      if (req.user?.rol === 'docente') {
        if (key === 'asignaciones-docentes') rows = rows.filter((r) => r.docente_id === req.user!.referencia_id);
        if (key === 'alumnos') {
          const courses = await db.all('SELECT curso_id FROM asignaciones_docentes WHERE docente_id = ?', [req.user.referencia_id ?? 0]);
          rows = rows.filter((r) => courses.some((c) => c.curso_id === r.curso_id));
        }
        if (key === 'cursos') { const assignments = await db.all('SELECT curso_id FROM asignaciones_docentes WHERE docente_id = ?', [req.user.referencia_id ?? 0]); rows = rows.filter((r) => assignments.some((a) => a.curso_id === r.id)); }
      }
      res.json(key === 'usuarios' ? rows.map(safeUser) : rows);
    });
    for (const method of ['post', 'put'] as const) app[method](`/api/${key}${method === 'put' ? '/:id' : ''}`, async (req: Request, res: Response) => {
      assert(req.user?.rol === 'admin', 403, 'Solo administración puede modificar estos registros.');
      const result = await db.transaction(async () => {
        const id = method === 'put' ? idOf(req.params.id) : undefined;
        const data = await validateEntity(key, req.body, id);
        const savedId = id ?? await db.insert(def.table, data);
        if (id) await db.update(def.table, id, data);
        if (id && ['docentes', 'alumnos'].includes(key) && data.estado === 'inactivo') await db.run("UPDATE usuarios_acceso SET estado = 'inactivo', session_version = session_version + 1 WHERE referencia_id = ? AND rol = ?", [id, key === 'docentes' ? 'docente' : 'alumno']);
        if (key === 'cursos' && id) { const course = await db.get('SELECT * FROM cursos WHERE id = ?', [id]); await db.run('UPDATE alumnos SET curso = ?, division = ? WHERE curso_id = ?', [course.anio, course.division, id]); }
        await audit(req.user!.id, id ? 'modificación' : 'alta', def.table, savedId);
        if (key === 'grupos-deporte' && id) for (const i of await db.all("SELECT alumno_id FROM inscripciones WHERE grupo_deporte_id = ? AND estado = 'activo'", [id])) await publish({ alumno_id: i.alumno_id, titulo: 'Actividad actualizada', mensaje: `Se actualizó el grupo deportivo: ${data.dia} ${data.horario}.` });
        if (key === 'asignaciones-docentes' && id) {
          const assignment = await db.get('SELECT * FROM asignaciones_docentes WHERE id = ?', [id]);
          for (const student of await db.all("SELECT id FROM alumnos WHERE curso_id = ? AND estado = 'activo'", [assignment.curso_id])) await publish({ alumno_id: student.id, titulo: 'Horario académico actualizado', mensaje: `${assignment.materia}: ${assignment.dia} ${assignment.horario}.` });
        }
        if (key === 'recorridos' && id) for (const i of await db.all("SELECT alumno_id FROM inscripciones WHERE recorrido_id = ? AND estado = 'activo'", [id])) await publish({ alumno_id: i.alumno_id, titulo: 'Transporte actualizado', mensaje: 'Se actualizó el horario o la información de tu recorrido. Consultalo en el portal.' });
        const row = await db.get(`SELECT * FROM ${def.table} WHERE id = ?`, [savedId]);
        return key === 'usuarios' ? safeUser(row) : row;
      });
      res.status(method === 'post' ? 201 : 200).json(result);
    });
    app.delete(`/api/${key}/:id`, async (req: Request, res: Response) => {
      assert(req.user?.rol === 'admin', 403, 'Solo administración puede dar de baja registros.');
      await db.transaction(async () => {
        const id = idOf(req.params.id);
        assert(await db.get(`SELECT id FROM ${def.table} WHERE id = ?`, [id]), 404, 'Registro no encontrado.');
        if (def.soft) {
          const data = key === 'usuarios' ? await validateEntity(key, { estado: 'inactivo' }, id) : { estado: 'inactivo' };
          await db.update(def.table, id, data);
          if (key === 'docentes' || key === 'alumnos') await db.run("UPDATE usuarios_acceso SET estado = 'inactivo', session_version = session_version + 1 WHERE referencia_id = ? AND rol = ?", [id, key === 'docentes' ? 'docente' : 'alumno']);
        } else {
          const checks: Record<string, [string, string][]> = {
            niveles: [['cursos', 'nivel_id']], cursos: [['alumnos', 'curso_id'], ['asignaciones_docentes', 'curso_id'], ['matriculas', 'curso_id']],
            materias: [['asignaciones_docentes', 'materia_id']], deportes: [['grupos_deporte', 'deporte_id']],
            'grupos-deporte': [['inscripciones', 'grupo_deporte_id']], recorridos: [['inscripciones', 'recorrido_id']],
          };
          for (const [table, field] of checks[key] ?? []) assert(!(await db.get(`SELECT id FROM ${table} WHERE ${field} = ?`, [id])), 409, 'El registro tiene información relacionada. Reasignala antes de eliminarlo.');
          await db.run(`DELETE FROM ${def.table} WHERE id = ?`, [id]);
        }
        await audit(req.user!.id, 'baja', def.table, id);
      });
      res.json({ ok: true });
    });
  }
}

import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Pencil, Search, X } from 'lucide-react';
import { request } from '../services/api';
import { Button } from './Button';
import { Feedback } from './PortalShell';
export type Row = Record<string, any>;
type Field = { key: string; label: string; type?: string; required?: boolean; source?: string; options?: string[]; initial?: string | number };
export type Entity = { path: string; title: string; fields: Field[]; columns: string[]; soft?: boolean };
const f = (key: string, label: string, required = true, type = 'text'): Field => ({ key, label, required, type });
const ref = (key: string, label: string, source: string, required = true): Field => ({ key, label, source, required });
const state: Field = { key: 'estado', label: 'Estado', options: ['activo', 'inactivo'], initial: 'activo' };
const days: Field = { key: 'dia', label: 'Día', options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'], required: true };
const schedule = f('horario', 'Horario (HH:MM - HH:MM)');
const cupo: Field = { ...f('cupo', 'Cupo', true, 'number'), initial: 40 };
const visible: Field = { key: 'visible', label: 'Publicada', options: ['1', '0'], initial: 1 };
export const entityDefinitions: Record<string, Entity> = {
  tarifas: { path: 'tarifas', title: 'Aranceles mensuales', columns: ['tipo', 'monto'], fields: [{ key: 'tipo', label: 'Concepto', options: ['base', 'deporte', 'transporte', 'comedor'], required: true }, f('monto', 'Importe mensual en pesos', true, 'number')] },
  alumnos: { path: 'alumnos', title: 'Alumnos', soft: true, columns: ['apellido', 'nombre', 'legajo', 'dni', 'curso_id', 'estado'], fields: [f('nombre', 'Nombre'), f('apellido', 'Apellido'), f('legajo', 'Legajo'), f('dni', 'DNI'), f('fecha_nacimiento', 'Fecha de nacimiento', false, 'date'), ref('curso_id', 'Curso', 'cursos'), ref('usuario_padre_id', 'Padre / Tutor', 'padres', false), f('email', 'Email', false, 'email'), f('telefono', 'Teléfono', false), f('domicilio', 'Domicilio', false), state] },
  docentes: { path: 'docentes', title: 'Docentes', soft: true, columns: ['apellido', 'nombre', 'legajo', 'especialidad', 'email', 'estado'], fields: [f('nombre', 'Nombre'), f('apellido', 'Apellido'), f('legajo', 'Legajo'), f('dni', 'DNI'), f('email', 'Email', true, 'email'), f('telefono', 'Teléfono', false), f('especialidad', 'Especialidad'), state] },
  niveles: { path: 'niveles', title: 'Niveles', columns: ['nombre', 'etiqueta', 'descripcion'], fields: [f('nombre', 'Nombre'), f('etiqueta', 'Salas / Años'), f('descripcion', 'Descripción', true, 'textarea')] },
  cursos: { path: 'cursos', title: 'Cursos', columns: ['nivel_id', 'anio', 'division', 'turno', 'cupo'], fields: [ref('nivel_id', 'Nivel', 'niveles'), f('anio', 'Año / Sala'), f('division', 'División'), { key: 'turno', label: 'Turno', options: ['A confirmar', 'Mañana', 'Tarde', 'Jornada extendida'], required: true }, cupo, f('descripcion', 'Descripción', false, 'textarea')] },
  materias: { path: 'materias', title: 'Materias', columns: ['nombre', 'descripcion'], fields: [f('nombre', 'Nombre'), f('descripcion', 'Descripción', false, 'textarea')] },
  asignaciones: { path: 'asignaciones-docentes', title: 'Asignaciones docentes', columns: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'], fields: [ref('docente_id', 'Docente', 'docentes'), ref('curso_id', 'Curso', 'cursos'), ref('materia_id', 'Materia', 'materias'), days, schedule] },
  deportes: { path: 'deportes', title: 'Deportes', columns: ['nombre', 'profesor_id', 'descripcion'], fields: [f('nombre', 'Nombre'), ref('profesor_id', 'Profesor responsable', 'docentes'), f('descripcion', 'Descripción', false, 'textarea')] },
  grupos: { path: 'grupos-deporte', title: 'Grupos deportivos', columns: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id', 'cupo'], fields: [ref('deporte_id', 'Deporte', 'deportes'), { key: 'nivel', label: 'Nivel', options: ['Inicial', 'Primario', 'Secundario'], required: true }, days, schedule, ref('profesor_id', 'Profesor', 'docentes'), cupo] },
  recorridos: { path: 'recorridos', title: 'Transporte', columns: ['nombre', 'zona', 'horario', 'cupo'], fields: [f('nombre', 'Nombre'), f('zona', 'Zona'), f('horario', 'Horario de salida', true, 'time'), cupo, f('descripcion', 'Descripción', true, 'textarea')] },
  usuarios: { path: 'usuarios', title: 'Usuarios y permisos', soft: true, columns: ['nombre', 'email', 'rol', 'referencia_id', 'estado'], fields: [f('nombre', 'Nombre'), f('email', 'Email', true, 'email'), { key: 'rol', label: 'Rol', options: ['admin', 'docente', 'padre', 'alumno', 'personal'], required: true }, ref('referencia_id', 'Legajo asociado (docente / alumno)', 'referencias', false), f('password', 'Contraseña (10 a 72 caracteres)', false, 'password'), state] },
  servicios: { path: 'servicios', title: 'Servicios', columns: ['nombre', 'tipo', 'disponible'], fields: [f('nombre', 'Nombre'), f('tipo', 'Tipo'), f('descripcion', 'Descripción', true, 'textarea'), { key: 'disponible', label: 'Disponible', options: ['1', '0'], initial: 1 }] },
  instalaciones: { path: 'instalaciones', title: 'Instalaciones', columns: ['nombre', 'tipo', 'disponible'], fields: [f('nombre', 'Nombre'), f('tipo', 'Tipo'), f('descripcion', 'Descripción', true, 'textarea'), f('imagen_url', 'URL de imagen', false, 'url'), { key: 'disponible', label: 'Disponible', options: ['1', '0'], initial: 1 }] },
  noticias: { path: 'noticias', title: 'Noticias', columns: ['titulo', 'tipo', 'fecha_publicacion', 'visible'], fields: [f('titulo', 'Título'), f('descripcion', 'Resumen', true, 'textarea'), f('contenido', 'Contenido', false, 'textarea'), { ...f('fecha_publicacion', 'Fecha', true, 'date'), initial: new Date().toISOString().slice(0, 10) }, { ...f('tipo', 'Tipo'), initial: 'Institucional' }, f('imagen_url', 'URL de imagen', false, 'url'), visible] },
  actividades: { path: 'actividades', title: 'Actividades', columns: ['titulo', 'nivel', 'fecha', 'visible'], fields: [f('titulo', 'Título'), f('descripcion', 'Descripción', true, 'textarea'), f('nivel', 'Nivel'), f('fecha', 'Fecha', true, 'date'), visible] },
  galeria: { path: 'galeria', title: 'Galería', columns: ['titulo', 'categoria', 'visible'], fields: [f('titulo', 'Título'), f('descripcion', 'Descripción', false, 'textarea'), f('url_imagen', 'URL de imagen', true, 'url'), f('categoria', 'Categoría'), visible] },
};
export function rowLabel(row: Row) { return row.anio ? `${row.nivel} · ${row.anio} ${row.division}` : row.apellido ? `${row.apellido}, ${row.nombre}` : row.nombre || row.titulo || row.email || `#${row.id}`; }
export function EntityManager({ definition, rows, catalog, reload }: { definition: Entity; rows: Row[]; catalog: Record<string, Row[]>; reload: () => Promise<void> }) {
  const [query, setQuery] = useState(''), [editing, setEditing] = useState<Row | null>(null), [pending, setPending] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  useEffect(() => { setEditing(null); setMessage(''); setError(''); setQuery(''); }, [definition.path]);
  const options = (field: Field, row: Row): Row[] => field.source === 'padres' ? (catalog.usuarios || []).filter((u) => u.rol === 'padre') : field.source === 'referencias' ? catalog[row.rol === 'docente' ? 'docentes' : 'alumnos'] || [] : catalog[field.source || ''] || [];
  const label = (field: Field | undefined, value: unknown, row: Row) => field?.source ? rowLabel(options(field, row).find((r) => String(r.id) === String(value)) || { id: value ?? '—' }) : value == null || value === '' ? '—' : String(value);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!editing) return; setPending(true); setError('');
    try {
      const data = Object.fromEntries(definition.fields.filter((f) => !(f.key === 'password' && !editing.password)).map((field) => [field.key, field.source ? (editing[field.key] ? Number(editing[field.key]) : null) : field.type === 'number' || ['visible', 'disponible'].includes(field.key) ? Number(editing[field.key]) : editing[field.key] ?? '']));
      await request(`/${definition.path}${editing.id ? `/${editing.id}` : ''}`, { method: editing.id ? 'PUT' : 'POST', body: JSON.stringify(data) });
      await reload(); setEditing(null); setMessage('Los cambios se guardaron correctamente.');
    } catch (e) { setError((e as Error).message); } finally { setPending(false); }
  };
  const remove = async (row: Row) => {
    if (!window.confirm(`¿${definition.soft ? 'Dar de baja' : 'Eliminar'} a ${rowLabel(row)}?`)) return;
    setPending(true); setError('');
    try { await request(`/${definition.path}/${row.id}`, { method: 'DELETE' }); await reload(); setMessage('Registro dado de baja.'); }
    catch (e) { setError((e as Error).message); } finally { setPending(false); }
  };
  const filtered = rows.filter((r) => Object.values(r).join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className="panel-card"><div className="section-toolbar"><div><h2>{definition.title}</h2><p>{rows.length} registros</p></div><Button onClick={() => { setError(''); setEditing(Object.fromEntries(definition.fields.map((f) => [f.key, f.initial ?? '']))); }}><Plus size={17} /> Nuevo registro</Button></div>
    <Feedback error>{error}</Feedback><Feedback>{message}</Feedback>
    {editing && <form className="entity-editor" onSubmit={save}><div className="section-toolbar"><h3>{editing.id ? 'Editar registro' : 'Nuevo registro'}</h3><button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Cerrar formulario"><X size={20} /></button></div><div className="editor-grid">{definition.fields.map((field) => <label key={field.key}>{field.label}{field.required ? ' *' : ''}
      {field.options || field.source ? <select value={editing[field.key] ?? ''} required={field.required} onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value, ...(field.key === 'rol' ? { referencia_id: '' } : {}) })}><option value="">Seleccionar…</option>{field.options?.map((o) => <option key={o} value={o}>{o === '1' ? 'Sí' : o === '0' ? 'No' : o}</option>)}{field.source && options(field, editing).map((r) => <option key={r.id} value={r.id}>{rowLabel(r)}</option>)}</select>
      : field.type === 'textarea' ? <textarea rows={3} required={field.required} value={editing[field.key] ?? ''} onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value })} />
      : <input type={field.type || 'text'} required={field.required || (field.key === 'password' && !editing.id)} min={field.type === 'number' ? 1 : undefined} minLength={field.type === 'password' ? 10 : undefined} autoComplete={field.type === 'password' ? 'new-password' : undefined} value={editing[field.key] ?? ''} onChange={(e) => setEditing({ ...editing, [field.key]: e.target.value })} />}
    </label>)}</div><div className="form-actions"><Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar cambios'}</Button><Button type="button" variant="outline" disabled={pending} onClick={() => setEditing(null)}>Cancelar</Button></div></form>}
    <label className="search-field"><Search size={18} /><input aria-label={`Buscar en ${definition.title}`} placeholder="Buscar por nombre, legajo, DNI…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    <div className="report-table-wrapper"><table className="report-table"><thead><tr>{definition.columns.map((key) => <th key={key}>{definition.fields.find((f) => f.key === key)?.label ?? key}</th>)}<th>Acciones</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}>{definition.columns.map((key) => <td key={key}>{key === 'estado' ? <span className={`badge ${row[key] === 'activo' ? 'badge-green' : 'badge-blue'}`}>{row[key]}</span> : label(definition.fields.find((f) => f.key === key), row[key], row)}</td>)}<td><div className="table-actions"><button className="text-button" onClick={() => { setEditing({ ...row }); setError(''); }}><Pencil size={15} /> Editar</button><button className="text-button danger-text" disabled={pending} onClick={() => remove(row)}>{definition.soft ? 'Dar de baja' : 'Eliminar'}</button></div></td></tr>)}</tbody></table>{!filtered.length && <p className="empty-state">No hay registros que coincidan con la búsqueda.</p>}</div>
  </section>;
}

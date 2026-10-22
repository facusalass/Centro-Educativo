import { useEffect, useState, type FormEvent } from 'react';
import { request } from '../services/api';
import { useSession } from '../services/session';
import { Button } from './Button';
import { Feedback } from './PortalShell';
import type { Row } from './EntityManager';
export function AcademicPanel({ studentId }: { studentId?: number }) {
  const { user } = useSession();
  const teacher = user?.rol === 'docente' || user?.rol === 'admin';
  const [items, setItems] = useState<Row[]>([]), [assignments, setAssignments] = useState<Row[]>([]), [roster, setRoster] = useState<Row[]>([]), [selected, setSelected] = useState('');
  const [form, setForm] = useState({ asignacion_id: '', titulo: '', fecha: '' }), [grade, setGrade] = useState({ alumno_id: '', calificacion: '', observacion: '' }), [submission, setSubmission] = useState({ archivo_url: '', comentario: '' });
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [pending, setPending] = useState(false);
  const load = async () => { setItems(await request<Row[]>(`/evaluaciones${studentId ? `?alumno_id=${studentId}` : ''}`)); if (teacher) setAssignments(await request<Row[]>('/asignaciones-docentes')); };
  useEffect(() => { setSelected(''); setError(''); if (teacher || studentId) load().catch((e: Error) => setError(e.message)); }, [studentId, teacher]);
  useEffect(() => { setRoster([]); if (teacher && selected) request<Row[]>(`/evaluaciones/${selected}/alumnos`).then(setRoster).catch((e: Error) => setError(e.message)); }, [selected, teacher]);
  const save = async (path: string, body: Row, success: string) => {
    setPending(true); setError(''); setMessage('');
    try { await request(path, { method: 'POST', body: JSON.stringify(body) }); await load(); setMessage(success); }
    catch (e) { setError((e as Error).message); } finally { setPending(false); }
  };
  const create = (e: FormEvent) => { e.preventDefault(); void save('/evaluaciones', { ...form, asignacion_id: Number(form.asignacion_id) }, 'Evaluación creada.'); };
  const rate = (e: FormEvent) => { e.preventDefault(); void save('/calificaciones', { ...grade, alumno_id: Number(grade.alumno_id), evaluacion_id: Number(selected), calificacion: Number(grade.calificacion) }, 'Calificación y devolución publicadas.'); };
  const submit = (e: FormEvent) => { e.preventDefault(); void save('/entregas', { ...submission, evaluacion_id: Number(selected), alumno_id: studentId }, 'Entrega registrada.'); };
  const item = items.find((i) => i.id === Number(selected));
  return <section className="panel-card"><h2>Evaluaciones y devoluciones</h2><Feedback error>{error}</Feedback><Feedback>{message}</Feedback>
    {teacher && <details className="evaluation-create"><summary>Crear evaluación</summary><form onSubmit={create}><label>Asignación<select required value={form.asignacion_id} onChange={(e) => setForm({ ...form, asignacion_id: e.target.value })}><option value="">Seleccionar…</option>{assignments.map((a) => <option key={a.id} value={a.id}>{a.materia} · Curso #{a.curso_id}</option>)}</select></label><div className="editor-grid"><label>Título<input required minLength={3} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} /></label><label>Fecha<input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label></div><Button disabled={pending} type="submit">Crear evaluación</Button></form></details>}
    <label>Evaluación<select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Seleccionar…</option>{items.map((i) => <option key={i.id} value={i.id}>{i.materia} · {i.titulo} · {i.fecha}</option>)}</select></label>
    {!items.length && <p className="empty-state">No hay evaluaciones registradas para este curso.</p>}
    {item && <><h3>{item.titulo}</h3><p>{item.materia} · {item.nivel} {item.anio} {item.division}</p>
      {teacher ? <form className="entity-editor" onSubmit={rate}><h3>Publicar calificación y devolución</h3><label>Alumno<select required value={grade.alumno_id} onChange={(e) => setGrade({ ...grade, alumno_id: e.target.value })}><option value="">Seleccionar…</option>{roster.map((s) => <option key={s.id} value={s.id}>{s.apellido}, {s.nombre} · {s.legajo}</option>)}</select></label><label>Calificación (1 a 10)<input required type="number" min="1" max="10" step="0.1" value={grade.calificacion} onChange={(e) => setGrade({ ...grade, calificacion: e.target.value })} /></label><label>Devolución<textarea required value={grade.observacion} onChange={(e) => setGrade({ ...grade, observacion: e.target.value })} /></label><Button disabled={pending} type="submit">Publicar y notificar</Button></form>
      : <form className="entity-editor" onSubmit={submit}><h3>Entregar trabajo</h3><p>Compartí el enlace al archivo para que el docente pueda revisarlo.</p><label>Enlace HTTPS al archivo<input required type="url" placeholder="https://…" value={submission.archivo_url} onChange={(e) => setSubmission({ ...submission, archivo_url: e.target.value })} /></label><label>Comentario<textarea value={submission.comentario} onChange={(e) => setSubmission({ ...submission, comentario: e.target.value })} /></label><Button disabled={pending} type="submit">Guardar entrega</Button></form>}
      <h3>Entregas</h3>{(item.entregas || []).map((s: Row) => <p key={s.id}><a className="text-button" href={s.archivo_url} target="_blank" rel="noreferrer">Ver archivo entregado</a> · {s.comentario} · {new Date(s.fecha).toLocaleString('es-AR')}</p>)}
      <h3>Calificaciones publicadas</h3>{!(item.calificaciones || []).length && <p className="empty-state">Todavía no se publicó una calificación.</p>}{(item.calificaciones || []).map((g: Row) => <article className="notice" key={g.id}><div><strong>{g.apellido}, {g.nombre} · {g.calificacion}/10</strong><p>{g.observacion}</p></div></article>)}
      {!!item.historial?.length && <details><summary>Historial de devoluciones</summary>{item.historial.map((h: Row) => <p key={h.id}>{new Date(h.fecha).toLocaleString('es-AR')} · {h.calificacion}/10 · {h.observacion}</p>)}</details>}
    </>}
  </section>;
}

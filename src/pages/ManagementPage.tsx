import { useEffect, useState } from 'react';
import type { Alumno, Docente } from '../types';
import { RefreshCw } from 'lucide-react';
import { api, request } from '../services/api';
import { PortalShell, Feedback } from '../components/PortalShell';
import { EntityManager, entityDefinitions, type Row } from '../components/EntityManager';
import { ReportesViewer } from '../components/ReportesViewer';
import { AsistenciasSection } from '../components/AsistenciasSection';
import { AcademicPanel } from '../components/AcademicPanel';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
import { Button } from '../components/Button';
export function ManagementPage() {
  const [catalog, setCatalog] = useState<Record<string, Row[]>>({}), [tab, setTab] = useState('alumnos'), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ database: string; smtp: boolean } | null>(null);
  const load = async () => {
    const [bootstrap, niveles, actividades, galeria, tarifas, service] = await Promise.all([api.getAdminBootstrap(), api.getNiveles(), api.getActividades(), api.getGaleria(), request<Row[]>('/tarifas'), request<{ database: string; smtp: boolean }>('/admin/status')]);
    setCatalog({ ...bootstrap, niveles, actividades, galeria, tarifas }); setStatus(service);
  };
  useEffect(() => { load().catch((e: Error) => setError(e.message)).finally(() => setLoading(false)); }, []);
  const refresh = async () => { setLoading(true); setError(''); try { await load(); } catch (e) { setError((e as Error).message); } finally { setLoading(false); } };
  const extraTabs = { inscripciones: 'Inscripciones y matrícula', evaluaciones: 'Evaluaciones', asistencias: 'Asistencias', reportes: 'Reportes', comunicaciones: 'Solicitudes y mensajes', auditoria: 'Auditoría' };
  return <PortalShell title="Gestión institucional"><div className="admin-stats"><article><span>Alumnos activos</span><strong>{catalog.alumnos?.filter((a) => a.estado === 'activo').length ?? '—'}</strong></article><article><span>Docentes activos</span><strong>{catalog.docentes?.filter((a) => a.estado === 'activo').length ?? '—'}</strong></article><article><span>Cursos</span><strong>{catalog.cursos?.length ?? '—'}</strong></article><article><span>Base de datos</span><strong className="stat-text">{status?.database === 'postgres' ? 'PostgreSQL' : status?.database ?? 'Conectando…'}</strong></article></div>
    {status && !status.smtp && <Feedback>El correo está pendiente de configurar. Las notificaciones se guardan en la bandeja familiar y quedan en cola para su envío.</Feedback>}
    <Feedback error>{error}</Feedback><div className="workspace-layout"><nav className="workspace-nav" aria-label="Módulos de administración">{Object.entries(entityDefinitions).map(([key, value]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{value.title}</button>)}{Object.entries(extraTabs).map(([key, title]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{title}</button>)}</nav>
      <div className="workspace-content"><div className="refresh-toolbar"><Button variant="outline" disabled={loading} onClick={refresh}><RefreshCw size={16} /> {loading ? 'Cargando…' : 'Actualizar datos'}</Button></div>
        {!loading && entityDefinitions[tab] && <EntityManager key={tab} definition={entityDefinitions[tab]} rows={catalog[tab] || []} catalog={catalog} reload={load} />}
        {!loading && tab === 'reportes' && <ReportesViewer alumnos={(catalog.alumnos || []) as Alumno[]} docentes={(catalog.docentes || []) as Docente[]} />}
        {tab === 'asistencias' && <AsistenciasSection />}{tab === 'evaluaciones' && <AcademicPanel />}{tab === 'inscripciones' && <EnrollmentPanel admin />}
        {tab === 'comunicaciones' && <Communications />}{tab === 'auditoria' && <AuditLog />}
      </div></div></PortalShell>;
}
function Communications() {
  const [type, setType] = useState('solicitudes-inscripcion'), [rows, setRows] = useState<Row[]>([]), [error, setError] = useState('');
  const load = () => request<Row[]>(`/${type}${type === 'opiniones' ? '?all=1' : ''}`).then(setRows).catch((e: Error) => setError(e.message));
  useEffect(() => { setError(''); setRows([]); void load(); }, [type]);
  const change = async (row: Row, value: string) => {
    try { await request(`/${type}/${row.id}/${type === 'opiniones' ? 'moderar' : 'estado'}`, { method: 'PUT', body: JSON.stringify(type === 'opiniones' ? { estado_moderacion: value } : type === 'postulaciones' ? { estado: value } : { estado_tramite: value }) }); await load(); }
    catch (e) { setError((e as Error).message); }
  };
  return <section className="panel-card"><h2>Solicitudes y comunicaciones</h2><label>Tipo de consulta<select value={type} onChange={(e) => setType(e.target.value)}><option value="solicitudes-inscripcion">Solicitudes de inscripción</option><option value="contacto">Mensajes de contacto</option><option value="opiniones">Opiniones</option><option value="postulaciones">Postulaciones de empleo</option></select></label><Feedback error>{error}</Feedback>{!rows.length && <p className="empty-state">No hay solicitudes en esta sección.</p>}{rows.map((row) => <article className="notice" key={row.id}><div><strong>{row.nombre_tutor || row.nombre_candidato || row.nombre || row.autor_anonimo}</strong><p>{row.nombre_aspirante || row.puesto_interes || row.asunto}</p><p>{row.mensaje || row.comentario}</p><small>{row.email_contacto || row.email} · {row.telefono}</small>{row.enlace_cv && <p><a className="text-button" href={row.enlace_cv} target="_blank" rel="noreferrer">Ver CV</a></p>}</div>{type !== 'contacto' && <label>Estado<select value={row.estado_tramite || row.estado_moderacion || row.estado} onChange={(e) => change(row, e.target.value)}>{(type === 'opiniones' ? ['pendiente', 'visible', 'oculta'] : type === 'postulaciones' ? ['recibida', 'en revision', 'aceptada', 'rechazada'] : ['pendiente', 'en revision', 'aprobada', 'rechazada']).map((state) => <option key={state}>{state}</option>)}</select></label>}</article>)}</section>;
}
function AuditLog() {
  const [rows, setRows] = useState<Row[]>([]), [error, setError] = useState('');
  useEffect(() => { request<Row[]>('/admin/auditoria').then(setRows).catch((e: Error) => setError(e.message)); }, []);
  return <section className="panel-card"><h2>Registro de cambios</h2><Feedback error>{error}</Feedback><div className="report-table-wrapper"><table className="report-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Recurso</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.fecha).toLocaleString('es-AR')}</td><td>{row.usuario || 'Sistema'}</td><td>{row.accion}</td><td>{row.recurso} #{row.recurso_id}</td></tr>)}</tbody></table></div></section>;
}

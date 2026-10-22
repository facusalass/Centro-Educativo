import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { request } from '../services/api';
import { useSession } from '../services/session';
import { PortalShell, Feedback } from '../components/PortalShell';
import { Button } from '../components/Button';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
import { Notifications } from '../components/Notifications';
import { DocenteDashboard } from '../components/DocenteDashboard';
import { AcademicPanel } from '../components/AcademicPanel';
import { AsistenciasSection } from '../components/AsistenciasSection';
import type { UsuarioAcceso, Curso, Alumno } from '../types';

export function PortalPage() {
  const { user, loading, setUser } = useSession();
  const [register, setRegister] = useState(false), [pending, setPending] = useState(false), [error, setError] = useState(''), [tab, setTab] = useState('inicio');
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [courses, setCourses] = useState<Curso[]>([]);
  const [form, setForm] = useState({ nombre_padre: '', nombre_hijo: '', apellido_hijo: '', dni_hijo: '', curso_id: '' });
  useEffect(() => { request<Curso[]>('/auth/catalogo').then(setCourses).catch(() => {}); }, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError('');
    try {
      const response = await request<{ usuario: UsuarioAcceso }>(register ? '/padres/registro' : '/auth/login', { method: 'POST', body: JSON.stringify(register ? { ...form, curso_id: Number(form.curso_id), email, password } : { email, password }) });
      setUser(response.usuario); setPassword('');
      if (response.usuario.rol === 'admin') window.location.assign('/admin');
    } catch (e) { setError((e as Error).message); } finally { setPending(false); }
  };
  if (loading) return <main className="portal-main"><Feedback>Comprobando sesión…</Feedback></main>;
  if (!user) return <div className="internal-page"><header className="internal-header"><a className="text-button" href="/"><ArrowLeft size={17} /> Volver al sitio</a><strong>Educar para Transformar</strong></header><main className="login-layout"><section className="login-intro"><span className="eyebrow"><ShieldCheck size={18} /> Comunidad educativa</span><h1>Tu escuela,<br />más cerca.</h1><p>Ingresá para consultar tus cursos, gestionar inscripciones y seguir las novedades de la institución.</p><ul className="login-benefits"><li>Gestión académica en un solo lugar</li><li>Información de tus hijos y sus actividades</li><li>Calificaciones y comunicaciones</li></ul></section><form className="form-card login-card" onSubmit={submit}><KeyRound size={30} /><h2>{register ? 'Crear cuenta familiar' : 'Iniciar sesión'}</h2><Feedback error>{error}</Feedback>
    {register && <label>Nombre del padre, madre o tutor<input required autoComplete="name" value={form.nombre_padre} onChange={(e) => setForm({ ...form, nombre_padre: e.target.value })} /></label>}
    <label>Email<input required type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Contraseña<input required type="password" minLength={register ? 10 : undefined} maxLength={72} autoComplete={register ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {register && <><small>Usá entre 10 y 72 caracteres.</small><div className="editor-grid"><label>Nombre del hijo<input required value={form.nombre_hijo} onChange={(e) => setForm({ ...form, nombre_hijo: e.target.value })} /></label><label>Apellido del hijo<input required value={form.apellido_hijo} onChange={(e) => setForm({ ...form, apellido_hijo: e.target.value })} /></label></div><label>DNI del hijo<input required inputMode="numeric" pattern="[0-9]{7,9}" value={form.dni_hijo} onChange={(e) => setForm({ ...form, dni_hijo: e.target.value })} /></label><label>Curso solicitado<select required value={form.curso_id} onChange={(e) => setForm({ ...form, curso_id: e.target.value })}><option value="">Seleccionar…</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.nivel} · {c.anio} {c.division}</option>)}</select></label><small>Registrar al alumno permite gestionar su matrícula. La confirmación del ciclo lectivo se realiza desde el portal.</small></>}
    <Button disabled={pending} type="submit">{pending ? 'Procesando…' : register ? 'Crear cuenta' : 'Ingresar'}</Button><button className="text-button" type="button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Ya tengo una cuenta' : 'Soy una familia nueva: crear cuenta'}</button><small>Si necesitás vincular un alumno ya registrado o recuperar el acceso, contactá a secretaría.</small>
  </form></main></div>;
  const tabs: Record<string, string> = { inicio: user.rol === 'padre' ? 'Mis hijos e inscripciones' : 'Mi actividad', evaluaciones: 'Evaluaciones', novedades: 'Novedades', seguridad: 'Mi cuenta' };
  if (user.rol === 'docente') tabs.asistencias = 'Asistencias';
  return <PortalShell title={user.rol === 'padre' ? 'Portal de familias' : user.rol === 'docente' ? 'Portal docente' : 'Mi portal'}><nav className="portal-tabs" aria-label="Secciones del portal">{Object.entries(tabs).map(([key, label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {tab === 'inicio' && (user.rol === 'padre' ? <EnrollmentPanel /> : user.rol === 'docente' ? <DocenteDashboard usuario={user} /> : user.rol === 'admin' ? <section className="panel-card"><h2>Administración</h2><a href="/admin" className="btn btn-primary">Abrir gestión institucional</a></section> : <section className="panel-card"><h2>Bienvenido/a, {user.nombre}</h2><p>Consultá las evaluaciones y novedades desde las secciones del portal.</p></section>)}
    {tab === 'evaluaciones' && (user.rol === 'padre' ? <FamilyGrades /> : user.rol === 'personal' ? <Feedback>Tu perfil no tiene evaluaciones asignadas.</Feedback> : <AcademicPanel studentId={user.rol === 'alumno' ? user.referencia_id ?? undefined : undefined} />)}
    {tab === 'novedades' && <Notifications />}{tab === 'asistencias' && <AsistenciasSection />}{tab === 'seguridad' && <PasswordForm />}
  </PortalShell>;
}
function FamilyGrades() {
  const [children, setChildren] = useState<Alumno[]>([]), [id, setId] = useState(''), [error, setError] = useState('');
  useEffect(() => { request<Alumno[]>('/padres/hijos').then((rows) => { setChildren(rows); setId(rows[0] ? String(rows[0].id) : ''); }).catch((e: Error) => setError(e.message)); }, []);
  return <><Feedback error>{error}</Feedback><section className="panel-card"><label>Hijo<select value={id} onChange={(e) => setId(e.target.value)}><option value="">Seleccionar…</option>{children.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}</select></label></section>{id && <AcademicPanel key={id} studentId={Number(id)} />}</>;
}
function PasswordForm() {
  const [actual, setActual] = useState(''), [password, setPassword] = useState(''), [error, setError] = useState(''), [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setPending(true); setError(''); try { await request('/auth/password', { method: 'PUT', body: JSON.stringify({ actual, password }) }); window.location.assign('/login'); } catch (e) { setError((e as Error).message); } finally { setPending(false); } };
  return <section className="panel-card"><h2>Cambiar contraseña</h2><p>Al guardar, volvé a ingresar con tu nueva contraseña.</p><Feedback error>{error}</Feedback><form onSubmit={submit}><label>Contraseña actual<input type="password" required autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} /></label><label>Nueva contraseña<input type="password" minLength={10} maxLength={72} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label><Button type="submit" disabled={pending}>Guardar contraseña</Button></form></section>;
}

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, Clock, GraduationCap, KeyRound, LogOut, PlusCircle, ShieldCheck, Users } from 'lucide-react';
import { Button } from '../components/Button';
import { api } from '../services/api';
import type {
  ActividadEscolar,
  Alumno,
  AsignacionDocente,
  Curso,
  Deporte,
  GrupoDeporte,
  InscripcionTipo,
  InscripcionDetalle,
  Instalacion,
  Noticia,
  RecorridoTransporte,
  ReporteAlumno,
  ReporteDocente,
  Servicio,
  UsuarioAcceso,
} from '../types';

const demoUsers = [
  ['admin@educar.com', 'admin123', 'admin'],
  ['docente@educar.com', 'docente123', 'docente'],
  ['padre@educar.com', 'padre123', 'padre'],
  ['alumno@educar.com', 'alumno123', 'alumno'],
  ['personal@educar.com', 'personal123', 'personal'],
];

const roleDescriptions = {
  admin: 'Acceso general a la gestión institucional y sus módulos administrativos.',
  docente: 'Acceso a cursos, materias y horarios asignados.',
  padre: 'Acceso a avisos institucionales y actividades para las familias.',
  alumno: 'Acceso a novedades y actividades escolares.',
  personal: 'Acceso a servicios e instalaciones de la institución.',
};

type RoleData = {
  noticias?: Noticia[];
  actividades?: ActividadEscolar[];
  cursos?: Curso[];
  asignaciones?: AsignacionDocente[];
  servicios?: Servicio[];
  instalaciones?: Instalacion[];
};

export function LoginDemoPage() {
  const [email, setEmail] = useState('admin@educar.com');
  const [password, setPassword] = useState('admin123');
  const [usuario, setUsuario] = useState<UsuarioAcceso | null>(null);
  const [roleData, setRoleData] = useState<RoleData>({});
  const [status, setStatus] = useState('');
  const [showRegistration, setShowRegistration] = useState(false);
  const [registration, setRegistration] = useState({
    nombre_padre: '',
    email: '',
    password: '',
    telefono_padre: '',
    nombre_hijo: '',
    apellido_hijo: '',
    nivel: 'Nivel Inicial',
    curso: '',
    division: '',
  });

  useEffect(() => {
    if (!usuario) return;

    async function loadRoleData() {
      const [noticias, actividades, cursos, asignaciones, servicios, instalaciones] = await Promise.all([
        api.getNoticias(),
        api.getActividades(),
        api.getCursos(),
        api.getAsignaciones(),
        api.getServicios(),
        api.getInstalaciones(),
      ]);
      setRoleData({ noticias, actividades, cursos, asignaciones, servicios, instalaciones });
    }

    loadRoleData().catch(() => setStatus('No se pudieron cargar todos los datos del rol.'));
  }, [usuario]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Validando credenciales demo...');
    try {
      const response = await api.loginDemo(email, password);
      setUsuario(response.usuario);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo iniciar sesion.');
    }
  }

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Creando cuenta familiar y registrando alumno...');
    try {
      const response = await api.registrarPadre(registration);
      setUsuario(response.usuario);
      setStatus('Cuenta creada y alumno registrado correctamente.');
      setShowRegistration(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo crear la cuenta familiar.');
    }
  }

  return (
    <div className="internal-page">
      <header className="internal-header">
        <a href="/" className="text-button"><ArrowLeft size={17} /> Volver al sitio</a>
        <strong>Educar para Transformar</strong>
      </header>

      {!usuario ? (
        <main className="login-layout">
          <section>
            <span className="eyebrow">Acceso demo</span>
            <h1>Ingreso por roles</h1>
            <p>
              Este login es solo demostrativo para el TP. Permite mostrar vistas basicas para admin,
              docente, padre, alumno y personal sin implementar seguridad avanzada.
            </p>
            <div className="demo-credentials">
              {demoUsers.map(([userEmail, userPassword, role]) => (
                <button
                  type="button"
                  key={userEmail}
                  onClick={() => {
                    setEmail(userEmail);
                    setPassword(userPassword);
                  }}
                >
                  <span>{role}</span>
                  <strong>{userEmail}</strong>
                  <small>{userPassword}</small>
                </button>
              ))}
            </div>
          </section>

          <form className="form-card login-card" onSubmit={showRegistration ? handleRegistration : handleSubmit}>
            <KeyRound size={32} />
            <h2>{showRegistration ? 'Crear cuenta familiar' : 'Iniciar sesion'}</h2>
            {showRegistration ? (
              <>
                <label>
                  Nombre del padre, madre o tutor
                  <input required value={registration.nombre_padre} onChange={(event) => setRegistration({ ...registration, nombre_padre: event.target.value })} />
                </label>
                <label>
                  Email
                  <input required type="email" value={registration.email} onChange={(event) => setRegistration({ ...registration, email: event.target.value })} />
                </label>
                <label>
                  Password
                  <input required minLength={6} type="password" value={registration.password} onChange={(event) => setRegistration({ ...registration, password: event.target.value })} />
                </label>
                <label>
                  Nombre del hijo
                  <input required value={registration.nombre_hijo} onChange={(event) => setRegistration({ ...registration, nombre_hijo: event.target.value })} />
                </label>
                <label>
                  Apellido del hijo
                  <input required value={registration.apellido_hijo} onChange={(event) => setRegistration({ ...registration, apellido_hijo: event.target.value })} />
                </label>
                <label>
                  Nivel
                  <select value={registration.nivel} onChange={(event) => setRegistration({ ...registration, nivel: event.target.value })}>
                    <option>Nivel Inicial</option>
                    <option>Nivel Primario</option>
                    <option>Nivel Secundario</option>
                  </select>
                </label>
                <div className="form-row">
                  <label>
                    Curso
                    <input value={registration.curso} onChange={(event) => setRegistration({ ...registration, curso: event.target.value })} />
                  </label>
                  <label>
                    Division
                    <input value={registration.division} onChange={(event) => setRegistration({ ...registration, division: event.target.value })} />
                  </label>
                </div>
                <Button type="submit">Crear cuenta y registrar hijo</Button>
              </>
            ) : (
              <>
                <label>
                  Email
                  <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                </label>
                <label>
                  Password demo
                  <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
                <Button type="submit">Ingresar</Button>
              </>
            )}
            {status && <span className="form-status">{status}</span>}
            <button className="text-button" type="button" onClick={() => { setShowRegistration(!showRegistration); setStatus(''); }}>
              {showRegistration ? 'Ya tengo una cuenta' : 'Soy un padre nuevo: registrar cuenta e hijo'}
            </button>
          </form>
        </main>
      ) : (
        <main className="role-dashboard">
          <div className="role-hero">
            <ShieldCheck size={36} />
            <div>
              <span className="eyebrow">Rol {usuario.rol}</span>
              <h1>Bienvenido/a, {usuario.nombre || usuario.email}</h1>
              <p>{roleDescriptions[usuario.rol]}</p>
            </div>
            <div className="role-actions">
              {usuario.rol === 'admin' && <a className="btn btn-primary" href="/admin">Abrir panel general</a>}
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setUsuario(null);
                  setRoleData({});
                  setStatus('');
                }}
              >
                  <LogOut size={18} /> Cerrar sesión
              </Button>
            </div>
          </div>
          <RoleContent usuario={usuario} data={roleData} />
        </main>
      )}
    </div>
  );
}

function RoleContent({ usuario, data }: { usuario: UsuarioAcceso; data: RoleData }) {
  if (usuario.rol === 'admin') {
    return (
      <div className="role-grid">
        <RoleCard title="Resumen institucional" items={[
          `${(data.noticias ?? []).length} noticias cargadas`,
          `${(data.actividades ?? []).length} actividades cargadas`,
          `${(data.cursos ?? []).length} cursos registrados`,
        ]} />
        <RoleCard title="Gestión disponible" items={['Solicitudes de inscripción', 'Opiniones y moderación', 'Postulaciones de empleo', 'Alumnos, docentes y cursos']} />
      </div>
    );
  }

  if (usuario.rol === 'docente') {
    return <DocenteDashboard usuario={usuario} />;
  }

  if (usuario.rol === 'personal') {
    return (
      <div className="role-grid">
        <RoleCard title="Servicios" items={(data.servicios ?? []).map((servicio) => `${servicio.nombre}: ${servicio.tipo}`)} />
        <RoleCard title="Instalaciones" items={(data.instalaciones ?? []).map((item) => `${item.nombre}: ${item.disponible ? 'disponible' : 'no disponible'}`)} />
      </div>
    );
  }

  if (usuario.rol === 'padre') {
    return <PadreDashboard usuario={usuario} />;
  }

  if (usuario.rol === 'alumno') {
    return <AlumnoDashboard usuario={usuario} />;
  }

  return null;
}

function DocenteDashboard({ usuario }: { usuario: UsuarioAcceso }) {
  const [reporte, setReporte] = useState<ReporteDocente | null>(null);
  const [status, setStatus] = useState('Cargando...');
  const [vista, setVista] = useState<'horario' | 'cursos' | 'deportes'>('horario');

  useEffect(() => {
    api
      .getReporteDocente(usuario.referencia_id ?? 1)
      .then((data) => {
        setReporte(data);
        setStatus('');
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : 'No se pudo cargar.'));
  }, [usuario]);

  if (status) return <p className="form-status">{status}</p>;
  if (!reporte) return null;

  const totalAlumnos = reporte.cursos.reduce((sum, c) => sum + c.alumnos.length, 0);
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Metric Cards */}
      <div className="admin-stats" style={{ marginBottom: '24px' }}>
        <article>
          <span>Materias a cargo</span>
          <strong>{reporte.materiasACargo.length}</strong>
        </article>
        <article>
          <span>Cursos asignados</span>
          <strong>{reporte.cursos.length}</strong>
        </article>
        <article>
          <span>Total alumnos</span>
          <strong>{totalAlumnos}</strong>
        </article>
        <article>
          <span>Grupos deportivos</span>
          <strong>{reporte.gruposDeporte.length}</strong>
        </article>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant={vista === 'horario' ? 'primary' : 'outline'}
          onClick={() => setVista('horario')}
        >
          <Clock size={16} /> Mi Horario Semanal
        </Button>
        <Button
          type="button"
          variant={vista === 'cursos' ? 'primary' : 'outline'}
          onClick={() => setVista('cursos')}
        >
          <GraduationCap size={16} /> Nómina de Cursos y Alumnos
        </Button>
        {reporte.gruposDeporte.length > 0 && (
          <Button
            type="button"
            variant={vista === 'deportes' ? 'primary' : 'outline'}
            onClick={() => setVista('deportes')}
          >
            <Users size={16} /> Deportes a Cargo
          </Button>
        )}
      </div>

      {/* View 1: Horario Semanal */}
      {vista === 'horario' && (
        <div>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>Grilla de Horario Semanal</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
            {diasSemana.map((dia) => {
              const pref = dia.slice(0, 3).toLowerCase();
              const clasesDelDia = reporte.cursos.filter((c) => (c.dia || '').toLowerCase().includes(pref));
              const deportesDelDia = reporte.gruposDeporte.filter((g) => (g.grupo.dia || '').toLowerCase().includes(pref));

              return (
                <div
                  key={dia}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ borderBottom: '2px solid var(--blue-700)', paddingBottom: '6px', marginBottom: '10px' }}>
                    <strong style={{ color: 'var(--blue-900)', fontSize: '1rem' }}>{dia}</strong>
                  </div>

                  {clasesDelDia.length === 0 && deportesDelDia.length === 0 ? (
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', margin: 0 }}>Sin actividades asignadas</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {clasesDelDia.map((c, idx) => (
                        <div key={idx} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '8px' }}>
                          <span className="badge badge-green" style={{ marginBottom: '4px' }}>{c.horario}</span>
                          <div style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.88rem' }}>{c.materia}</div>
                          <div style={{ color: 'var(--gray-600)', fontSize: '0.78rem' }}>
                            {c.curso?.nivel} - {c.curso?.anio} "{c.curso?.division}"
                          </div>
                        </div>
                      ))}
                      {deportesDelDia.map((d, idx) => (
                        <div key={idx} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px' }}>
                          <span className="badge badge-blue" style={{ marginBottom: '4px' }}>{d.grupo.horario}</span>
                          <div style={{ fontWeight: 600, color: 'var(--blue-900)', fontSize: '0.88rem' }}>
                            {d.deporte?.nombre ?? 'Deporte'}
                          </div>
                          <div style={{ color: 'var(--gray-600)', fontSize: '0.78rem' }}>
                            Nivel: {d.grupo.nivel}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Cursos y Nóminas */}
      {vista === 'cursos' && (
        <div>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>Nómina de Cursos y Alumnos Asignados</h3>
          {reporte.cursos.map((c, i) => (
            <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '18px', marginBottom: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--blue-900)', fontSize: '1.05rem' }}>
                    {c.materia} — {c.curso?.nivel} {c.curso?.anio} "{c.curso?.division}"
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    Día y horario: {c.dia} {c.horario} • Turno: {c.curso?.turno || '—'}
                  </span>
                </div>
                <span className="badge badge-blue">{c.alumnos.length} Alumnos</span>
              </div>

              <div className="report-table-wrapper" style={{ margin: 0 }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Legajo</th>
                      <th>Apellido y Nombre</th>
                      <th>Nivel</th>
                      <th>Curso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.alumnos.length > 0 ? (
                      c.alumnos.map((a, ai) => (
                        <tr key={ai}>
                          <td>{ai + 1}</td>
                          <td><strong>{a.legajo}</strong></td>
                          <td>{a.apellido}, {a.nombre}</td>
                          <td>{a.nivel}</td>
                          <td>{a.curso}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Sin alumnos registrados en este curso.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 3: Grupos Deportivos */}
      {vista === 'deportes' && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: '8px', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>Comisiones y Grupos Deportivos a Cargo</h3>
          <div className="report-table-wrapper" style={{ margin: 0 }}>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Deporte</th>
                  <th>Nivel Educativo</th>
                  <th>Día Asignado</th>
                  <th>Franja Horaria</th>
                </tr>
              </thead>
              <tbody>
                {reporte.gruposDeporte.map((g, i) => (
                  <tr key={i}>
                    <td><strong>{g.deporte?.nombre ?? 'Deporte'}</strong></td>
                    <td><span className="badge badge-blue">{g.grupo.nivel}</span></td>
                    <td>{g.grupo.dia}</td>
                    <td><span className="badge badge-green">{g.grupo.horario}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AlumnoDashboard({ usuario }: { usuario: UsuarioAcceso }) {
  const [reporte, setReporte] = useState<ReporteAlumno | null>(null);
  const [status, setStatus] = useState('Cargando...');

  useEffect(() => {
    api
      .getReporteAlumno(usuario.referencia_id ?? 1)
      .then((data) => {
        setReporte(data);
        setStatus('');
      })
      .catch((error) => setStatus(error instanceof Error ? error.message : 'No se pudo cargar.'));
  }, [usuario]);

  if (status) return <p className="form-status">{status}</p>;
  if (!reporte) return null;

  return (
    <div className="role-grid">
      <RoleCard
        title="Materias"
        items={reporte.materias.map((materia) => `${materia.materia} - ${materia.profesor ? `${materia.profesor.apellido}, ${materia.profesor.nombre}` : 'sin docente'} (${materia.dia} ${materia.horario})`)}
      />
      <RoleCard
        title="Deportes"
        items={reporte.deportes.map((item) => `${item.deporte?.nombre ?? ''} (${item.dia ?? ''} ${item.horario ?? ''})`)}
      />
      <RoleCard title="Transporte" items={reporte.transporte.map((recorrido) => `${recorrido.nombre} - ${recorrido.horario}`)} />
      <RoleCard title="Comedor" items={reporte.comedor ? ['Inscripto al servicio de comedor'] : []} />
    </div>
  );
}

function PadreDashboard({ usuario }: { usuario: UsuarioAcceso }) {
  const [hijos, setHijos] = useState<Alumno[]>([]);
  const [reportes, setReportes] = useState<Record<number, ReporteAlumno>>({});
  const [grupos, setGrupos] = useState<GrupoDeporte[]>([]);
  const [deportes, setDeportes] = useState<Deporte[]>([]);
  const [recorridos, setRecorridos] = useState<RecorridoTransporte[]>([]);
  const [status, setStatus] = useState('Cargando...');
  const [form, setForm] = useState({ alumno_id: '', tipo: 'deporte' as InscripcionTipo, grupo_deporte_id: '', recorrido_id: '' });
  const [inscripciones, setInscripciones] = useState<InscripcionDetalle[]>([]);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childForm, setChildForm] = useState({ nombre_hijo: '', apellido_hijo: '', nivel: 'Nivel Inicial', curso: '', division: '' });

  async function cargar() {
    const [hijosData, gruposData, deportesData, recorridosData, inscripcionesData] = await Promise.all([
      api.getHijos(usuario.email, usuario.id),
      api.getGruposDeporte(),
      api.getDeportes(),
      api.getRecorridos(),
      api.getInscripciones(),
    ]);
    setHijos(hijosData);
    setGrupos(gruposData);
    setDeportes(deportesData);
    setRecorridos(recorridosData);
    setInscripciones(inscripcionesData.filter((inscripcion) => hijosData.some((hijo) => hijo.id === inscripcion.alumno_id)));

    const mapa: Record<number, ReporteAlumno> = {};
    for (const hijo of hijosData) {
      mapa[hijo.id] = await api.getReporteAlumno(hijo.id);
    }
    setReportes(mapa);
  }

  useEffect(() => {
    cargar()
      .then(() => setStatus(''))
      .catch((error) => setStatus(error instanceof Error ? error.message : 'No se pudo cargar.'));
  }, [usuario]);

  async function inscribir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Inscribiendo...');
    try {
      await api.crearInscripcion({
        alumno_id: Number(form.alumno_id),
        tipo: form.tipo,
        grupo_deporte_id: form.grupo_deporte_id ? Number(form.grupo_deporte_id) : null,
        recorrido_id: form.recorrido_id ? Number(form.recorrido_id) : null,
      });
      await cargar();
      setStatus('Inscripcion realizada.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo inscribir.');
    }
  }

  async function agregarHijo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Registrando hijo...');
    try {
      await api.agregarHijo({ ...childForm, usuario_padre_id: usuario.id });
      await cargar();
      setChildForm({ nombre_hijo: '', apellido_hijo: '', nivel: 'Nivel Inicial', curso: '', division: '' });
      setShowAddChild(false);
      setStatus('Hijo registrado correctamente.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo registrar al hijo.');
    }
  }

  async function desinscribir(inscripcion: InscripcionDetalle) {
    setStatus('Revirtiendo inscripcion...');
    try {
      await api.desinscribirHijo(usuario.id, inscripcion.alumno_id, inscripcion.id);
      await cargar();
      setStatus('Inscripcion cancelada y cambio revertido.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo cancelar la inscripcion.');
    }
  }

  const selectedChild = hijos.find((hijo) => String(hijo.id) === form.alumno_id);
  const availableGroups = selectedChild ? grupos.filter((grupo) => grupo.nivel === selectedChild.nivel) : grupos;

  return (
    <div>
      <div className="role-grid">
        {hijos.map((hijo) => {
          const reporte = reportes[hijo.id];
          const materias = reporte?.materias ?? [];
          const deportes = reporte?.deportes ?? [];
          return (
            <RoleCard
              key={hijo.id}
              title={`${hijo.nombre} ${hijo.apellido} (${hijo.curso} ${hijo.division})`}
              items={[
                ...materias.map((materia) => `Materia: ${materia.materia} (${materia.profesor ? `${materia.profesor.apellido}` : 'sin docente'})`),
                ...deportes.map((item) => `Deporte: ${item.deporte?.nombre ?? ''} ${item.dia ?? ''} ${item.horario ?? ''}`),
              ]}
            />
          );
        })}
      </div>

      <div className="role-grid">
        {inscripciones.map((inscripcion) => (
          <article className="role-card" key={inscripcion.id}>
            <BookOpen size={24} />
            <h2>Inscripcion activa</h2>
            <p>
              {inscripcion.alumno?.nombre} {inscripcion.alumno?.apellido}: {' '}
              {inscripcion.tipo === 'deporte'
                ? `${inscripcion.deporte?.nombre ?? 'Deporte'} - ${inscripcion.grupo?.dia ?? ''} ${inscripcion.grupo?.horario ?? ''}`
                : inscripcion.tipo === 'transporte'
                  ? inscripcion.recorrido?.nombre ?? 'Transporte'
                  : 'Comedor'}
            </p>
            <Button variant="outline" type="button" onClick={() => desinscribir(inscripcion)}>Desinscribir</Button>
          </article>
        ))}
      </div>

      {hijos.length === 0 && !status && <p className="form-status">No hay hijos asociados a este usuario.</p>}

      <button className="text-button" type="button" onClick={() => setShowAddChild(!showAddChild)}>
        {showAddChild ? 'Cancelar alta de hijo' : 'Registrar otro hijo'}
      </button>

      {showAddChild && (
        <form className="form-card" onSubmit={agregarHijo}>
          <PlusCircle size={24} />
          <h2>Registrar hijo</h2>
          <label>
            Nombre
            <input required value={childForm.nombre_hijo} onChange={(event) => setChildForm({ ...childForm, nombre_hijo: event.target.value })} />
          </label>
          <label>
            Apellido
            <input required value={childForm.apellido_hijo} onChange={(event) => setChildForm({ ...childForm, apellido_hijo: event.target.value })} />
          </label>
          <label>
            Nivel
            <select value={childForm.nivel} onChange={(event) => setChildForm({ ...childForm, nivel: event.target.value })}>
              <option>Nivel Inicial</option>
              <option>Nivel Primario</option>
              <option>Nivel Secundario</option>
            </select>
          </label>
          <div className="form-row">
            <label>Curso<input value={childForm.curso} onChange={(event) => setChildForm({ ...childForm, curso: event.target.value })} /></label>
            <label>Division<input value={childForm.division} onChange={(event) => setChildForm({ ...childForm, division: event.target.value })} /></label>
          </div>
          <Button type="submit">Guardar hijo</Button>
        </form>
      )}

      <form className="form-card inscripcion-padre" onSubmit={inscribir}>
        <PlusCircle size={24} />
        <h2>Inscribir a un hijo</h2>
        <label>
          Hijo
          <select required value={form.alumno_id} onChange={(event) => setForm({ ...form, alumno_id: event.target.value, grupo_deporte_id: '', recorrido_id: '' })}>
            <option value="">Seleccionar...</option>
            {hijos.map((hijo) => <option key={hijo.id} value={hijo.id}>{hijo.nombre} {hijo.apellido}</option>)}
          </select>
        </label>
        <label>
          Servicio
          <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value as InscripcionTipo })}>
            <option value="deporte">Deporte</option>
            <option value="transporte">Transporte</option>
            <option value="comedor">Comedor</option>
          </select>
        </label>
        {form.tipo === 'deporte' && (
          <label>
            Grupo deportivo
            <select required value={form.grupo_deporte_id} onChange={(event) => setForm({ ...form, grupo_deporte_id: event.target.value })}>
              <option value="">Seleccionar...</option>
              {availableGroups.map((grupo) => {
                const deporte = deportes.find((d) => d.id === grupo.deporte_id);
                return <option key={grupo.id} value={grupo.id}>{deporte?.nombre ?? 'Deporte'} - {grupo.nivel} {grupo.dia} {grupo.horario}</option>;
              })}
            </select>
          </label>
        )}
        {form.tipo === 'transporte' && (
          <label>
            Recorrido
            <select required value={form.recorrido_id} onChange={(event) => setForm({ ...form, recorrido_id: event.target.value })}>
              <option value="">Seleccionar...</option>
              {recorridos.map((recorrido) => <option key={recorrido.id} value={recorrido.id}>{recorrido.nombre}</option>)}
            </select>
          </label>
        )}
        <Button type="submit">Inscribir</Button>
        {status && <span className="form-status">{status}</span>}
      </form>
    </div>
  );
}

function RoleCard({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="role-card">
      <BookOpen size={24} />
      <h2>{title}</h2>
      <ul>
        {items.length > 0 ? items.slice(0, 6).map((item) => <li key={item}><CalendarDays size={15} /> {item}</li>) : <li>No hay datos cargados.</li>}
      </ul>
    </article>
  );
}

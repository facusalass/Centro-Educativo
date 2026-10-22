import { FormEvent, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Database, PlusCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button';
import { ReportesViewer } from '../components/ReportesViewer';
import { api } from '../services/api';
import type {
  Alumno,
  AdminBootstrap,
  Asistencia,
  AsistenciaRegistro,
  Curso,
  Deporte,
  Docente,
  GrupoDeporte,
  InscripcionDetalle,
  InscripcionTipo,
  Instalacion,
  Materia,
  Noticia,
  Opinion,
  PostulacionEmpleo,
  RecorridoTransporte,
  Servicio,
  SolicitudInscripcion,
  UsuarioAcceso,
} from '../types';

type AdminData = AdminBootstrap;

const emptyData: AdminData = {
  solicitudes: [],
  opiniones: [],
  postulaciones: [],
  alumnos: [],
  docentes: [],
  cursos: [],
  asignaciones: [],
  servicios: [],
  instalaciones: [],
  noticias: [],
  usuarios: [],
  materias: [],
  deportes: [],
  grupos: [],
  recorridos: [],
  inscripciones: [],
};

export function AdminPanel() {
  const [data, setData] = useState<AdminData>(emptyData);
  const [status, setStatus] = useState('Cargando datos...');
  const [alumno, setAlumno] = useState({ nombre: '', apellido: '', nivel: 'Inicial', curso: 'Sala de 5', division: 'A' });
  const [docente, setDocente] = useState({ nombre: '', apellido: '', email: '', especialidad: '' });
  const [curso, setCurso] = useState({ nivel: 'Primario', anio: '', division: 'A', turno: 'Manana', descripcion: '' });
  const [noticia, setNoticia] = useState({ titulo: '', descripcion: '', tipo: 'Institucional' });
  const [servicio, setServicio] = useState({ nombre: '', descripcion: '', tipo: 'general', icono: 'school' });
  const [instalacion, setInstalacion] = useState({ nombre: '', descripcion: '', tipo: 'educativa', imagen_url: '' });
  const [materia, setMateria] = useState({ nombre: '', descripcion: '' });
  const [deporte, setDeporte] = useState({ nombre: '', descripcion: '', profesor_id: '' });
  const [grupo, setGrupo] = useState({ deporte_id: '', nivel: 'Primario', dia: '', horario: '', profesor_id: '' });
  const [recorrido, setRecorrido] = useState({ nombre: '', descripcion: '', horario: '', zona: '' });
  const [inscripcion, setInscripcion] = useState({ alumno_id: '', tipo: 'deporte' as InscripcionTipo, grupo_deporte_id: '', recorrido_id: '' });
  const [asignacion, setAsignacion] = useState({ docente_id: '', curso_id: '', materia: '', dia: 'Lunes', horario: '08:00 - 09:30' });
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', password_demo: '', rol: 'docente' });

  async function loadData() {
    setStatus('Cargando datos...');
    try {
      setData(await api.getAdminBootstrap());
      setStatus('Datos actualizados.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudieron cargar los datos.');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitAndReload(event: FormEvent<HTMLFormElement>, action: () => Promise<unknown>, message: string) {
    event.preventDefault();
    setStatus(message);
    try {
      await action();
      await loadData();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo completar la accion.');
    }
  }

  return (
    <div className="internal-page admin-page">
      <header className="internal-header">
        <a href="/" className="text-button"><ArrowLeft size={17} /> Volver al sitio</a>
        <strong>Panel de gestion</strong>
      </header>

      <main className="admin-shell">
        <div className="admin-hero">
          <Database size={38} />
          <div>
            <span className="eyebrow">Administracion demo</span>
            <h1>Panel de gestion institucional</h1>
            <p>Vista simple para administrar los modulos principales del Proyecto Integrador.</p>
          </div>
          <Button onClick={loadData} type="button"><RefreshCw size={18} /> Actualizar</Button>
        </div>

        <div className="admin-stats">
          <Stat label="Solicitudes" value={data.solicitudes.length} />
          <Stat label="Opiniones" value={data.opiniones.length} />
          <Stat label="Postulaciones" value={data.postulaciones.length} />
          <Stat label="Alumnos" value={data.alumnos.length} />
          <Stat label="Docentes" value={data.docentes.length} />
          <Stat label="Cursos" value={data.cursos.length} />
          <Stat label="Materias" value={data.materias.length} />
          <Stat label="Deportes" value={data.deportes.length} />
          <Stat label="Inscripciones" value={data.inscripciones.length} />
        </div>

        <span className="admin-status">{status}</span>

        <section className="admin-section">
          <h2>Acciones rapidas</h2>
          <div className="quick-forms">
            <form onSubmit={(event) => submitAndReload(event, () => api.crearAlumno(alumno), 'Creando alumno...')}>
              <h3><PlusCircle size={17} /> Crear alumno</h3>
              <input required placeholder="Nombre" value={alumno.nombre} onChange={(event) => setAlumno({ ...alumno, nombre: event.target.value })} />
              <input required placeholder="Apellido" value={alumno.apellido} onChange={(event) => setAlumno({ ...alumno, apellido: event.target.value })} />
              <input required placeholder="Nivel" value={alumno.nivel} onChange={(event) => setAlumno({ ...alumno, nivel: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearDocente(docente), 'Creando docente...')}>
              <h3><PlusCircle size={17} /> Crear docente</h3>
              <input required placeholder="Nombre" value={docente.nombre} onChange={(event) => setDocente({ ...docente, nombre: event.target.value })} />
              <input required placeholder="Apellido" value={docente.apellido} onChange={(event) => setDocente({ ...docente, apellido: event.target.value })} />
              <input required type="email" placeholder="Email" value={docente.email} onChange={(event) => setDocente({ ...docente, email: event.target.value })} />
              <input required placeholder="Especialidad" value={docente.especialidad} onChange={(event) => setDocente({ ...docente, especialidad: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearCurso(curso), 'Creando curso...')}>
              <h3><PlusCircle size={17} /> Crear curso</h3>
              <input required placeholder="Nivel" value={curso.nivel} onChange={(event) => setCurso({ ...curso, nivel: event.target.value })} />
              <input required placeholder="Anio" value={curso.anio} onChange={(event) => setCurso({ ...curso, anio: event.target.value })} />
              <input required placeholder="Turno" value={curso.turno} onChange={(event) => setCurso({ ...curso, turno: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearNoticia(noticia), 'Creando noticia...')}>
              <h3><PlusCircle size={17} /> Crear noticia</h3>
              <input required placeholder="Titulo" value={noticia.titulo} onChange={(event) => setNoticia({ ...noticia, titulo: event.target.value })} />
              <input required placeholder="Tipo" value={noticia.tipo} onChange={(event) => setNoticia({ ...noticia, tipo: event.target.value })} />
              <textarea required placeholder="Descripcion" rows={3} value={noticia.descripcion} onChange={(event) => setNoticia({ ...noticia, descripcion: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearServicio(servicio), 'Creando servicio...')}>
              <h3><PlusCircle size={17} /> Crear servicio</h3>
              <input required placeholder="Nombre" value={servicio.nombre} onChange={(event) => setServicio({ ...servicio, nombre: event.target.value })} />
              <input required placeholder="Tipo" value={servicio.tipo} onChange={(event) => setServicio({ ...servicio, tipo: event.target.value })} />
              <textarea required placeholder="Descripcion" rows={3} value={servicio.descripcion} onChange={(event) => setServicio({ ...servicio, descripcion: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearInstalacion(instalacion), 'Creando instalacion...')}>
              <h3><PlusCircle size={17} /> Crear instalacion</h3>
              <input required placeholder="Nombre" value={instalacion.nombre} onChange={(event) => setInstalacion({ ...instalacion, nombre: event.target.value })} />
              <input required placeholder="Tipo" value={instalacion.tipo} onChange={(event) => setInstalacion({ ...instalacion, tipo: event.target.value })} />
              <textarea required placeholder="Descripcion" rows={3} value={instalacion.descripcion} onChange={(event) => setInstalacion({ ...instalacion, descripcion: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearMateria(materia), 'Creando materia...')}>
              <h3><PlusCircle size={17} /> Crear materia</h3>
              <input required placeholder="Nombre" value={materia.nombre} onChange={(event) => setMateria({ ...materia, nombre: event.target.value })} />
              <textarea placeholder="Descripcion" rows={2} value={materia.descripcion} onChange={(event) => setMateria({ ...materia, descripcion: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearDeporte({ nombre: deporte.nombre, descripcion: deporte.descripcion, profesor_id: deporte.profesor_id ? Number(deporte.profesor_id) : null }), 'Creando deporte...')}>
              <h3><PlusCircle size={17} /> Crear deporte</h3>
              <input required placeholder="Nombre" value={deporte.nombre} onChange={(event) => setDeporte({ ...deporte, nombre: event.target.value })} />
               <select value={deporte.profesor_id} onChange={(event) => setDeporte({ ...deporte, profesor_id: event.target.value })}>
                 <option value="">Profesor responsable</option>
                 {data.docentes.map((item) => <option key={item.id} value={item.id}>{item.apellido}, {item.nombre}</option>)}
               </select>
              <textarea placeholder="Descripcion" rows={2} value={deporte.descripcion} onChange={(event) => setDeporte({ ...deporte, descripcion: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearGrupoDeporte({ deporte_id: Number(grupo.deporte_id), nivel: grupo.nivel, dia: grupo.dia, horario: grupo.horario, profesor_id: grupo.profesor_id ? Number(grupo.profesor_id) : null }), 'Creando grupo deportivo...')}>
              <h3><PlusCircle size={17} /> Crear grupo deportivo</h3>
               <select required value={grupo.deporte_id} onChange={(event) => setGrupo({ ...grupo, deporte_id: event.target.value })}>
                 <option value="">Deporte</option>
                 {data.deportes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}
               </select>
              <input required placeholder="Nivel" value={grupo.nivel} onChange={(event) => setGrupo({ ...grupo, nivel: event.target.value })} />
              <input placeholder="Dia" value={grupo.dia} onChange={(event) => setGrupo({ ...grupo, dia: event.target.value })} />
              <input placeholder="Horario (ej. 10:00 - 11:30)" value={grupo.horario} onChange={(event) => setGrupo({ ...grupo, horario: event.target.value })} />
               <select value={grupo.profesor_id} onChange={(event) => setGrupo({ ...grupo, profesor_id: event.target.value })}>
                 <option value="">Profesor a cargo</option>
                 {data.docentes.map((item) => <option key={item.id} value={item.id}>{item.apellido}, {item.nombre}</option>)}
               </select>
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearRecorrido(recorrido), 'Creando recorrido...')}>
              <h3><PlusCircle size={17} /> Crear recorrido</h3>
              <input required placeholder="Nombre" value={recorrido.nombre} onChange={(event) => setRecorrido({ ...recorrido, nombre: event.target.value })} />
              <input placeholder="Horario" value={recorrido.horario} onChange={(event) => setRecorrido({ ...recorrido, horario: event.target.value })} />
              <input placeholder="Zona" value={recorrido.zona} onChange={(event) => setRecorrido({ ...recorrido, zona: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearInscripcion({ alumno_id: Number(inscripcion.alumno_id), tipo: inscripcion.tipo, grupo_deporte_id: inscripcion.grupo_deporte_id ? Number(inscripcion.grupo_deporte_id) : null, recorrido_id: inscripcion.recorrido_id ? Number(inscripcion.recorrido_id) : null }), 'Creando inscripcion...')}>
              <h3><PlusCircle size={17} /> Crear inscripcion</h3>
               <select required value={inscripcion.alumno_id} onChange={(event) => setInscripcion({ ...inscripcion, alumno_id: event.target.value, grupo_deporte_id: '', recorrido_id: '' })}>
                 <option value="">Alumno</option>
                 {data.alumnos.map((item) => <option key={item.id} value={item.id}>{item.apellido}, {item.nombre} ({item.nivel})</option>)}
               </select>
              <select value={inscripcion.tipo} onChange={(event) => setInscripcion({ ...inscripcion, tipo: event.target.value as InscripcionTipo })}>
                <option value="deporte">Deporte</option>
                <option value="transporte">Transporte</option>
                <option value="comedor">Comedor</option>
              </select>
              {inscripcion.tipo === 'deporte' && (
                 <select required value={inscripcion.grupo_deporte_id} onChange={(event) => setInscripcion({ ...inscripcion, grupo_deporte_id: event.target.value })}>
                   <option value="">Grupo deportivo</option>
                   {data.grupos.filter((item) => !inscripcion.alumno_id || item.nivel === data.alumnos.find((alumno) => String(alumno.id) === inscripcion.alumno_id)?.nivel).map((item) => <option key={item.id} value={item.id}>{data.deportes.find((deporte) => deporte.id === item.deporte_id)?.nombre ?? 'Deporte'} - {item.nivel} ({item.dia} {item.horario})</option>)}
                 </select>
              )}
              {inscripcion.tipo === 'transporte' && (
                 <select required value={inscripcion.recorrido_id} onChange={(event) => setInscripcion({ ...inscripcion, recorrido_id: event.target.value })}>
                   <option value="">Recorrido</option>
                   {data.recorridos.map((item) => <option key={item.id} value={item.id}>{item.nombre} - {item.zona}</option>)}
                 </select>
              )}
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearAsignacion({ docente_id: Number(asignacion.docente_id), curso_id: Number(asignacion.curso_id), materia: asignacion.materia, dia: asignacion.dia, horario: asignacion.horario }), 'Asignando materia a docente...')}>
              <h3><PlusCircle size={17} /> Asignar materia a docente</h3>
              <select required value={asignacion.docente_id} onChange={(event) => setAsignacion({ ...asignacion, docente_id: event.target.value })}>
                <option value="">Docente</option>
                {data.docentes.map((item) => <option key={item.id} value={item.id}>{item.apellido}, {item.nombre}</option>)}
              </select>
              <select required value={asignacion.curso_id} onChange={(event) => setAsignacion({ ...asignacion, curso_id: event.target.value })}>
                <option value="">Curso</option>
                {data.cursos.map((item) => <option key={item.id} value={item.id}>{item.nivel} - {item.anio} "{item.division}"</option>)}
              </select>
              <input required placeholder="Materia (ej. Matemática)" value={asignacion.materia} onChange={(event) => setAsignacion({ ...asignacion, materia: event.target.value })} />
              <input placeholder="Día (ej. Lunes)" value={asignacion.dia} onChange={(event) => setAsignacion({ ...asignacion, dia: event.target.value })} />
              <input placeholder="Horario (ej. 08:00 - 09:30)" value={asignacion.horario} onChange={(event) => setAsignacion({ ...asignacion, horario: event.target.value })} />
              <Button type="submit">Guardar</Button>
            </form>

            <form onSubmit={(event) => submitAndReload(event, () => api.crearUsuario({ nombre: nuevoUsuario.nombre, email: nuevoUsuario.email, password_demo: nuevoUsuario.password_demo, rol: nuevoUsuario.rol as any }), 'Creando usuario...')}>
              <h3><PlusCircle size={17} /> Crear usuario demo</h3>
              <input required placeholder="Nombre completo" value={nuevoUsuario.nombre} onChange={(event) => setNuevoUsuario({ ...nuevoUsuario, nombre: event.target.value })} />
              <input required type="email" placeholder="Email" value={nuevoUsuario.email} onChange={(event) => setNuevoUsuario({ ...nuevoUsuario, email: event.target.value })} />
              <input required type="password" placeholder="Password demo" value={nuevoUsuario.password_demo} onChange={(event) => setNuevoUsuario({ ...nuevoUsuario, password_demo: event.target.value })} />
              <select value={nuevoUsuario.rol} onChange={(event) => setNuevoUsuario({ ...nuevoUsuario, rol: event.target.value })}>
                <option value="admin">Administrador</option>
                <option value="docente">Docente</option>
                <option value="padre">Padre / Tutor</option>
                <option value="alumno">Alumno</option>
                <option value="personal">Personal</option>
              </select>
              <Button type="submit">Guardar</Button>
            </form>
          </div>
        </section>

        <section className="admin-grid">
          <AdminList title="Solicitudes de inscripcion">
            {data.solicitudes.map((item) => (
              <AdminItem key={item.id} title={item.nombre_aspirante} subtitle={`${item.nivel_solicitado} - ${item.estado_tramite ?? 'recibida'}`}>
                <button onClick={() => api.cambiarEstadoSolicitud(item.id!, 'en revision').then(loadData)}>En revision</button>
                <button onClick={() => api.cambiarEstadoSolicitud(item.id!, 'aprobada').then(loadData)}>Aprobar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Opiniones web">
            {data.opiniones.map((item) => (
              <AdminItem key={item.id} title={item.autor_anonimo} subtitle={item.estado_moderacion}>
                <button onClick={() => api.moderarOpinion(item.id, 'visible').then(loadData)}>Publicar</button>
                <button onClick={() => api.moderarOpinion(item.id, 'oculta').then(loadData)}>Ocultar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Postulaciones">
            {data.postulaciones.map((item) => (
              <AdminItem key={item.id} title={item.nombre_candidato} subtitle={`${item.puesto_interes} - ${item.estado ?? 'recibida'}`}>
                <button onClick={() => api.cambiarEstadoPostulacion(item.id!, 'en revision').then(loadData)}>En revision</button>
                <button onClick={() => api.cambiarEstadoPostulacion(item.id!, 'contactar').then(loadData)}>Contactar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Alumnos">
            {data.alumnos.map((item) => (
              <AdminItem key={item.id} title={`${item.nombre} ${item.apellido}`} subtitle={`${item.nivel} ${item.curso} ${item.division} - Legajo: ${item.legajo || '—'}`}>
                <button onClick={() => api.eliminarAlumno(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Docentes">
            {data.docentes.map((item) => (
              <AdminItem key={item.id} title={`${item.nombre} ${item.apellido}`} subtitle={`${item.especialidad} - ${item.email}`}>
                <button onClick={() => api.eliminarDocente(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Cursos">
            {data.cursos.map((item) => (
              <AdminItem key={item.id} title={`${item.nivel} ${item.anio} ${item.division}`} subtitle={item.turno}>
                <button onClick={() => api.eliminarCurso(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Asignaciones docentes">
            {data.asignaciones.map((item) => {
              const doc = data.docentes.find((d) => d.id === item.docente_id);
              const cur = data.cursos.find((c) => c.id === item.curso_id);
              return (
                <AdminItem
                  key={item.id}
                  title={`${item.materia} — ${doc ? `${doc.apellido}, ${doc.nombre}` : 'Docente #' + item.docente_id}`}
                  subtitle={`${cur ? `${cur.nivel} ${cur.anio} "${cur.division}"` : 'Curso #' + item.curso_id} (${item.dia} ${item.horario})`}
                >
                  <button onClick={() => api.eliminarAsignacion(item.id).then(loadData)}>Eliminar</button>
                </AdminItem>
              );
            })}
          </AdminList>

          <AdminList title="Servicios">
            {data.servicios.map((item) => <AdminItem key={item.id} title={item.nombre} subtitle={item.tipo} />)}
          </AdminList>

          <AdminList title="Instalaciones">
            {data.instalaciones.map((item) => <AdminItem key={item.id} title={item.nombre} subtitle={item.tipo} />)}
          </AdminList>

          <AdminList title="Noticias">
            {data.noticias.map((item) => <AdminItem key={item.id} title={item.titulo} subtitle={`${item.tipo} - ${item.visible ? 'visible' : 'oculta'}`} />)}
          </AdminList>

          <AdminList title="Usuarios demo">
            {data.usuarios.map((item) => (
              <AdminItem key={item.id} title={item.email} subtitle={`${item.rol} - ${item.estado}`}>
                <button onClick={() => api.eliminarUsuario(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Materias">
            {data.materias.map((item) => (
              <AdminItem key={item.id} title={item.nombre} subtitle={item.descripcion}>
                <button onClick={() => api.eliminarMateria(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Deportes">
            {data.deportes.map((item) => (
              <AdminItem key={item.id} title={item.nombre} subtitle={`Profesor id: ${item.profesor_id ?? 'sin asignar'}`}>
                <button onClick={() => api.eliminarDeporte(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Grupos deportivos">
            {data.grupos.map((item) => (
              <AdminItem key={item.id} title={`Deporte #${item.deporte_id} - ${item.nivel}`} subtitle={`${item.dia} ${item.horario}`}>
                <button onClick={() => api.eliminarGrupoDeporte(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Recorridos de transporte">
            {data.recorridos.map((item) => (
              <AdminItem key={item.id} title={item.nombre} subtitle={`${item.zona} - ${item.horario}`}>
                <button onClick={() => api.eliminarRecorrido(item.id).then(loadData)}>Eliminar</button>
              </AdminItem>
            ))}
          </AdminList>

          <AdminList title="Inscripciones">
            {data.inscripciones.map((item) => (
              <AdminItem
                key={item.id}
                title={`${item.alumno?.apellido ?? ''}, ${item.alumno?.nombre ?? ''} - ${item.tipo}`}
                subtitle={item.tipo === 'deporte' ? `${item.deporte?.nombre ?? ''} ${item.grupo ? `(${item.grupo.dia} ${item.grupo.horario})` : ''}` : item.tipo === 'transporte' ? `${item.recorrido?.nombre ?? ''}` : 'Servicio de comedor'}
              >
                <button onClick={() => api.eliminarInscripcion(item.id).then(loadData)}>Cancelar</button>
              </AdminItem>
            ))}
          </AdminList>
        </section>

        <ReportesViewer alumnos={data.alumnos} docentes={data.docentes} />
        <AsistenciasSection />
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AdminList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="admin-list">
      <h2>{title}</h2>
      <div>{children}</div>
    </article>
  );
}

function AdminItem({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="admin-item">
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
      {children && <div className="admin-actions">{children}</div>}
    </div>
  );
}


function AsistenciasSection() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [nivel, setNivel] = useState('');
  const [anio, setAnio] = useState('');
  const [division, setDivision] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [lista, setLista] = useState<AsistenciaRegistro[]>([]);
  const [estado, setEstado] = useState('');

  useEffect(() => {
    api
      .getCursos()
      .then((data) => {
        setCursos(data);
        if (data[0]) {
          setNivel(data[0].nivel);
          setAnio(data[0].anio);
          setDivision(data[0].division);
        }
      })
      .catch(() => setEstado('No se pudieron cargar los cursos.'));
  }, []);

  const niveles = [...new Set(cursos.map((curso) => curso.nivel))];
  const anios = [...new Set(cursos.filter((curso) => curso.nivel === nivel).map((curso) => curso.anio))];
  const divisiones = [...new Set(cursos.filter((curso) => curso.nivel === nivel && curso.anio === anio).map((curso) => curso.division))];

  async function cargarLista() {
    setEstado('Cargando lista...');
    try {
      setLista(await api.getAsistencias({ fecha, nivel, curso: anio, division }));
      setEstado('Lista cargada.');
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'Error al cargar la lista.');
    }
  }

  async function guardar() {
    setEstado('Guardando...');
    try {
      const registros = lista.map((item) => ({
        alumno_id: item.alumno.id,
        presente: item.asistencia?.presente === 1,
        observacion: item.asistencia?.observacion ?? '',
      }));
      await api.registrarAsistencias({ fecha, registros });
      setEstado('Asistencia guardada.');
      await cargarLista();
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'Error al guardar.');
    }
  }

  function toggle(index: number) {
    setLista((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const presente = item.asistencia?.presente !== 1;
        return {
          ...item,
          asistencia: {
            id: item.asistencia?.id ?? 0,
            alumno_id: item.alumno.id,
            fecha,
            presente: presente ? 1 : 0,
            observacion: item.asistencia?.observacion ?? null,
          } as Asistencia,
        };
      }),
    );
  }

  return (
    <section className="admin-section asistencias-section">
      <h2>Control de asistencias</h2>
      <div className="reportes-controls">
        <input type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
        <select value={nivel} onChange={(event) => setNivel(event.target.value)}>
          {niveles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={anio} onChange={(event) => setAnio(event.target.value)}>
          {anios.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={division} onChange={(event) => setDivision(event.target.value)}>
          {divisiones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Button type="button" onClick={cargarLista}>Cargar lista</Button>
        <Button type="button" onClick={guardar} disabled={lista.length === 0}>Guardar</Button>
        <span className="admin-status">{estado}</span>
      </div>

      {lista.length > 0 && (
        <div className="asistencia-list">
          {lista.map((item, index) => (
            <div className="admin-item" key={item.alumno.id}>
              <div>
                <strong>{item.alumno.apellido}, {item.alumno.nombre}</strong>
                <span>Legajo: {item.alumno.legajo}</span>
              </div>
              <label className="asistencia-toggle">
                <input
                  type="checkbox"
                  checked={item.asistencia?.presente === 1}
                  onChange={() => toggle(index)}
                />
                Presente
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

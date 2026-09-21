import type {
  ActividadEscolar,
  Alumno,
  AsignacionDocente,
  AsistenciaRegistro,
  ContactoMensaje,
  Curso,
  Deporte,
  Docente,
  GaleriaImagen,
  GrupoDeporte,
  Inscripcion,
  InscripcionDetalle,
  InscripcionTipo,
  Instalacion,
  Materia,
  Noticia,
  Opinion,
  PostulacionEmpleo,
  RecorridoTransporte,
  ResumenAsistencia,
  Servicio,
  SolicitudInscripcion,
  UsuarioAcceso,
  Nivel,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.json().catch(() => ({ error: 'No se pudo completar la solicitud.' }));
    throw new Error(message.error ?? 'No se pudo completar la solicitud.');
  }

  return response.json() as Promise<T>;
}

const post = <T, D>(path: string, data: D) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(data) });

const put = <T, D>(path: string, data: D) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(data) });

const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });

export const api = {
  getNiveles: () => request<Nivel[]>('/niveles'),
  getServicios: () => request<Servicio[]>('/servicios'),
  crearServicio: (data: Partial<Servicio>) => post<Servicio, Partial<Servicio>>('/servicios', data),
  getInstalaciones: () => request<Instalacion[]>('/instalaciones'),
  crearInstalacion: (data: Partial<Instalacion>) => post<Instalacion, Partial<Instalacion>>('/instalaciones', data),
  getNoticias: (all = false) => request<Noticia[]>(`/noticias${all ? '?all=1' : ''}`),
  crearNoticia: (data: Partial<Noticia>) => post<Noticia, Partial<Noticia>>('/noticias', data),
  getOpiniones: (all = false) => request<Opinion[]>(`/opiniones${all ? '?all=1' : ''}`),
  crearOpinion: (data: Pick<Opinion, 'autor_anonimo' | 'comentario'>) =>
    post<Opinion, Pick<Opinion, 'autor_anonimo' | 'comentario'>>('/opiniones', data),
  moderarOpinion: (id: number, estado_moderacion: string) =>
    put<Opinion, { estado_moderacion: string }>(`/opiniones/${id}/moderar`, { estado_moderacion }),
  crearSolicitud: (data: SolicitudInscripcion) =>
    post<SolicitudInscripcion, SolicitudInscripcion>('/solicitudes-inscripcion', data),
  getSolicitudes: () => request<SolicitudInscripcion[]>('/solicitudes-inscripcion'),
  cambiarEstadoSolicitud: (id: number, estado_tramite: string) =>
    put<SolicitudInscripcion, { estado_tramite: string }>(`/solicitudes-inscripcion/${id}/estado`, { estado_tramite }),
  crearPostulacion: (data: PostulacionEmpleo) =>
    post<PostulacionEmpleo, PostulacionEmpleo>('/postulaciones', data),
  getPostulaciones: () => request<PostulacionEmpleo[]>('/postulaciones'),
  cambiarEstadoPostulacion: (id: number, estado: string) =>
    put<PostulacionEmpleo, { estado: string }>(`/postulaciones/${id}/estado`, { estado }),
  getAlumnos: () => request<Alumno[]>('/alumnos'),
  crearAlumno: (data: Partial<Alumno>) => post<Alumno, Partial<Alumno>>('/alumnos', data),
  getDocentes: () => request<Docente[]>('/docentes'),
  crearDocente: (data: Partial<Docente>) => post<Docente, Partial<Docente>>('/docentes', data),
  getCursos: () => request<Curso[]>('/cursos'),
  crearCurso: (data: Partial<Curso>) => post<Curso, Partial<Curso>>('/cursos', data),
  getAsignaciones: () => request<AsignacionDocente[]>('/asignaciones-docentes'),
  getActividades: () => request<ActividadEscolar[]>('/actividades'),
  crearActividad: (data: Partial<ActividadEscolar>) => post<ActividadEscolar, Partial<ActividadEscolar>>('/actividades', data),
  getGaleria: () => request<GaleriaImagen[]>('/galeria'),
  crearGaleriaImagen: (data: Partial<GaleriaImagen>) => post<GaleriaImagen, Partial<GaleriaImagen>>('/galeria', data),
  getUsuarios: () => request<UsuarioAcceso[]>('/usuarios'),
  crearUsuario: (data: Partial<UsuarioAcceso> & { password_demo: string }) => post<UsuarioAcceso, Partial<UsuarioAcceso> & { password_demo: string }>('/usuarios', data),
  loginDemo: (email: string, password: string) =>
    post<{ usuario: UsuarioAcceso }, { email: string; password: string }>('/login-demo', { email, password }),
  enviarContacto: (data: ContactoMensaje) => post<ContactoMensaje, ContactoMensaje>('/contacto', data),

  getMaterias: () => request<Materia[]>('/materias'),
  crearMateria: (data: Partial<Materia>) => post<Materia, Partial<Materia>>('/materias', data),

  getDeportes: () => request<Deporte[]>('/deportes'),
  crearDeporte: (data: Partial<Deporte>) => post<Deporte, Partial<Deporte>>('/deportes', data),

  getGruposDeporte: () => request<GrupoDeporte[]>('/grupos-deporte'),
  crearGrupoDeporte: (data: Partial<GrupoDeporte>) => post<GrupoDeporte, Partial<GrupoDeporte>>('/grupos-deporte', data),

  getRecorridos: () => request<RecorridoTransporte[]>('/recorridos'),
  crearRecorrido: (data: Partial<RecorridoTransporte>) => post<RecorridoTransporte, Partial<RecorridoTransporte>>('/recorridos', data),

  getInscripciones: () => request<InscripcionDetalle[]>('/inscripciones'),
  crearInscripcion: (data: { alumno_id: number; tipo: InscripcionTipo; grupo_deporte_id?: number | null; recorrido_id?: number | null }) =>
    post<Inscripcion, { alumno_id: number; tipo: InscripcionTipo; grupo_deporte_id?: number | null; recorrido_id?: number | null }>('/inscripciones', data),
  eliminarInscripcion: (id: number) => del<{ ok: boolean }>(`/inscripciones/${id}`),

  getReporteAlumno: (id: number) => request<Record<string, unknown>>(`/reportes/alumno/${id}`),
  getReporteDocente: (id: number) => request<Record<string, unknown>>(`/reportes/docente/${id}`),
  getAlumnosPorDeporte: () => request<Record<string, unknown>[]>('/reportes/alumnos-por-deporte'),
  getAlumnosPorDeporteNivel: () => request<Record<string, unknown>[]>('/reportes/alumnos-por-deporte-nivel'),
  getAlumnosPorDeporteDetalle: () => request<Record<string, unknown>[]>('/reportes/alumnos-por-deporte-detalle'),
  getAlumnosPorRecorrido: () => request<Record<string, unknown>[]>('/reportes/alumnos-por-recorrido'),
  getAlumnosPorMateria: () => request<Record<string, unknown>[]>('/reportes/alumnos-por-materia'),
  getDocentesPorNivel: () => request<Record<string, unknown>[]>('/reportes/docentes-por-nivel'),

  getAsistencias: (filtros: { fecha?: string; nivel?: string; curso?: string; division?: string }) => {
    const query = new URLSearchParams();
    if (filtros.fecha) query.set('fecha', filtros.fecha);
    if (filtros.nivel) query.set('nivel', filtros.nivel);
    if (filtros.curso) query.set('curso', filtros.curso);
    if (filtros.division) query.set('division', filtros.division);
    return request<AsistenciaRegistro[]>(`/asistencias?${query.toString()}`);
  },
  registrarAsistencias: (data: { fecha: string; registros: { alumno_id: number; presente: boolean; observacion?: string }[] }) =>
    post<unknown, { fecha: string; registros: { alumno_id: number; presente: boolean; observacion?: string }[] }>('/asistencias', data),
  getAsistenciaAlumno: (id: number) => request<ResumenAsistencia>(`/asistencias/alumno/${id}`),
  getHijos: (email: string) => request<Alumno[]>(`/padres/hijos?email=${encodeURIComponent(email)}`),
};

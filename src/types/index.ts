export type Nivel = {
  id: number;
  nombre: string;
  descripcion: string;
  etiqueta: string;
};

export type Alumno = {
  id: number;
  nombre: string;
  apellido: string;
  legajo: string;
  dni: string;
  fecha_nacimiento: string;
  domicilio: string;
  telefono: string;
  email: string;
  nivel: string;
  curso: string;
  division: string;
  tutor_nombre: string;
  tutor_email: string;
  tutor_telefono: string;
  usuario_padre_id?: number | null;
  estado: string;
  created_at: string;
};

export type Docente = {
  id: number;
  nombre: string;
  apellido: string;
  legajo: string;
  dni: string;
  email: string;
  telefono: string;
  especialidad: string;
  estado: string;
  created_at: string;
};

export type Materia = {
  id: number;
  nombre: string;
  descripcion: string;
};

export type Deporte = {
  id: number;
  nombre: string;
  descripcion: string;
  profesor_id: number | null;
};

export type GrupoDeporte = {
  id: number;
  deporte_id: number;
  nivel: string;
  dia: string;
  horario: string;
  profesor_id: number | null;
};

export type RecorridoTransporte = {
  id: number;
  nombre: string;
  descripcion: string;
  horario: string;
  zona: string;
};

export type InscripcionTipo = 'deporte' | 'transporte' | 'comedor';

export type Inscripcion = {
  id: number;
  alumno_id: number;
  tipo: InscripcionTipo;
  grupo_deporte_id: number | null;
  recorrido_id: number | null;
  fecha_inscripcion: string;
  estado: string;
};

export type InscripcionDetalle = Inscripcion & {
  alumno: Alumno | null;
  grupo: GrupoDeporte | null;
  deporte: Deporte | null;
  recorrido: RecorridoTransporte | null;
};

export type Asistencia = {
  id: number;
  alumno_id: number;
  fecha: string;
  presente: number;
  observacion: string | null;
};

export type AsistenciaRegistro = {
  alumno: Alumno;
  asistencia: Asistencia | null;
};

export type ResumenAsistencia = {
  alumno: Alumno;
  registros: Asistencia[];
  resumen: { presentes: number; ausentes: number; total: number; porcentaje: number };
};

export type ReporteAlumno = {
  alumno: Alumno;
  curso: Curso | null;
  materias: Array<{ materia: string; dia: string; horario: string; profesor: Docente | null }>;
  deportes: Array<{
    deporte: Deporte | null;
    grupo: GrupoDeporte | null;
    dia?: string;
    horario?: string;
    profesor: Docente | null;
  }>;
  transporte: RecorridoTransporte[];
  comedor: boolean;
};

export type ReporteDocente = {
  docente: Docente;
  cursos: Array<{
    curso: Curso | null;
    materia: string;
    dia: string;
    horario: string;
    alumnos: Array<{ legajo: string; apellido: string; nombre: string; nivel: string; curso: string }>;
  }>;
  materiasACargo: string[];
  gruposDeporte: Array<{ grupo: GrupoDeporte; deporte: Deporte | null }>;
};

export type AlumnoResumen = {
  legajo: string;
  apellido: string;
  nombre: string;
  curso?: string;
  nivel?: string;
};

export type AlumnosPorDeporte = Array<{
  deporte: string;
  profesor: Docente | null;
  grupos: Array<{
    nivel: string;
    dia: string;
    horario: string;
    profesor: Docente | null;
    alumnos: AlumnoResumen[];
  }>;
}>;

export type AlumnosPorDeporteNivel = Array<{
  deporte: string;
  nivel: string;
  alumnos: Array<{ legajo: string; apellido: string; nombre: string; curso: string }>;
}>;

export type AlumnosPorDeporteDetalle = Array<{
  deporte: string | null;
  nivel: string;
  dia: string;
  horario: string;
  profesor: Docente | null;
  alumnos: AlumnoResumen[];
}>;

export type AlumnosPorRecorrido = Array<{
  recorrido: string;
  horario: string;
  zona: string;
  alumnos: AlumnoResumen[];
}>;

export type AlumnosPorMateria = Array<{
  nivel: string | null;
  curso: string | null;
  materia: string;
  profesor: string | null;
  alumnos: Array<{ legajo: string; apellido: string; nombre: string }>;
}>;

export type DocentesPorNivel = Array<{
  nivel: string;
  docentes: Array<{ profesor: string | null; materias: string[]; cursos: Array<string | null> }>;
}>;

export type Curso = {
  id: number;
  nivel: string;
  anio: string;
  division: string;
  turno: string;
  descripcion: string;
};

export type AsignacionDocente = {
  id: number;
  docente_id: number;
  curso_id: number;
  materia: string;
  dia: string;
  horario: string;
};

export type Servicio = {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  disponible: number;
  icono: string;
};

export type Instalacion = {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  disponible: number;
  imagen_url: string;
};

export type Noticia = {
  id: number;
  titulo: string;
  descripcion: string;
  contenido: string;
  fecha_publicacion: string;
  tipo: string;
  visible: number;
  imagen_url: string;
};

export type Opinion = {
  id: number;
  autor_anonimo: string;
  comentario: string;
  fecha_publicacion: string;
  estado_moderacion: string;
  visible: number;
};

export type SolicitudInscripcion = {
  id?: number;
  nombre_tutor: string;
  nombre_aspirante: string;
  nivel_solicitado: string;
  email_contacto: string;
  telefono: string;
  mensaje: string;
  fecha_solicitud?: string;
  estado_tramite?: string;
};

export type PostulacionEmpleo = {
  id?: number;
  nombre_candidato: string;
  email: string;
  telefono: string;
  puesto_interes: string;
  enlace_cv: string;
  mensaje: string;
  fecha_recepcion?: string;
  estado?: string;
};

export type ActividadEscolar = {
  id: number;
  titulo: string;
  descripcion: string;
  nivel: string;
  fecha: string;
  visible: number;
};

export type GaleriaImagen = {
  id: number;
  titulo: string;
  descripcion: string;
  url_imagen: string;
  categoria: string;
  visible: number;
};

export type UsuarioAcceso = {
  id: number;
  nombre: string;
  nombre_usuario: string;
  email: string;
  rol: 'admin' | 'docente' | 'padre' | 'alumno' | 'personal';
  estado: string;
  referencia_id?: number | null;
  created_at: string;
};

export type RegistroPadre = {
  nombre_padre: string;
  email: string;
  password: string;
  telefono_padre?: string;
  nombre_hijo: string;
  apellido_hijo: string;
  dni_hijo?: string;
  fecha_nacimiento_hijo?: string;
  domicilio_hijo?: string;
  telefono_hijo?: string;
  email_hijo?: string;
  nivel: string;
  curso?: string;
  division?: string;
  legajo_hijo?: string;
};

export type RegistroHijo = Omit<RegistroPadre, 'email' | 'password' | 'nombre_padre'> & {
  usuario_padre_id: number;
};

export type ContactoMensaje = {
  nombre: string;
  email: string;
  asunto: string;
  mensaje: string;
};

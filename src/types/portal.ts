export type Matricula = {
  id: number;
  alumno_id: number;
  ciclo: number;
  nivel: string;
  anio: string;
  division: string;
  estado: string;
};
export type MonthlyQuote = {
  configurado: boolean;
  conceptos: { concepto: string; monto: number }[];
  total: number | null;
};
export type StudentRosterEntry = { id: number; nombre: string; apellido: string; legajo: string };
export type Submission = {
  id: number;
  alumno_id: number;
  evaluacion_id: number;
  archivo_url: string;
  comentario: string;
  fecha: string;
};
export type Grade = {
  id: number;
  alumno_id: number;
  evaluacion_id: number;
  calificacion: number;
  observacion: string;
  nombre: string;
  apellido: string;
  publicada: number;
};
export type GradeHistory = {
  id: number;
  alumno_id: number;
  evaluacion_id: number;
  calificacion: number;
  observacion: string;
  fecha: string;
};
export type Evaluation = {
  id: number;
  curso_id: number;
  docente_id: number;
  materia: string;
  titulo: string;
  fecha: string;
  nivel: string;
  anio: string;
  division: string;
  calificaciones: Grade[];
  entregas: Submission[];
  historial: GradeHistory[];
};

export type Communication = {
  id: number;
  nombre_tutor?: string;
  nombre_candidato?: string;
  nombre?: string;
  autor_anonimo?: string;
  nombre_aspirante?: string;
  puesto_interes?: string;
  asunto?: string;
  mensaje?: string;
  comentario?: string;
  email_contacto?: string;
  email?: string;
  telefono?: string;
  enlace_cv?: string;
  estado_tramite?: string;
  estado_moderacion?: string;
  estado?: string;
};
export type AuditEntry = {
  id: number;
  fecha: string;
  usuario: string | null;
  accion: string;
  recurso: string;
  recurso_id: number | null;
};

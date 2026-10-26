import { request } from './http';

export const reportDefinitions = {
  'alumnos-por-curso': 'Nómina de Alumnos por Curso y División',
  'alumnos-por-deporte': 'Nómina de Alumnos por Deporte y Comisiones',
  'alumnos-por-deporte-nivel': 'Nómina de Alumnos por Deporte y Nivel Educativo',
  'alumnos-por-deporte-detalle': 'Nómina de Deportes por Horario y Docente a Cargo',
  'alumnos-por-recorrido': 'Nómina de Alumnos por Recorrido de Transporte',
  'alumnos-por-materia': 'Nómina de Alumnos por Materia y Docente',
  'docentes-por-nivel': 'Planta Docente por Nivel Educativo y Cursos',
  alumno: 'Ficha y Legajo Integral del Alumno',
  docente: 'Carga Horaria y Asignaciones del Docente',
} as const;

export type ReportType = keyof typeof reportDefinitions;

export function isPersonalReport(type: ReportType) {
  return type === 'alumno' || type === 'docente';
}

export async function fetchReport(type: ReportType, id: string, signal: AbortSignal) {
  const suffix = isPersonalReport(type) ? `/${encodeURIComponent(id)}` : '';
  const data = await request<unknown>(`/reportes/${type}${suffix}`, { signal });
  if (
    isPersonalReport(type)
      ? !data || typeof data !== 'object' || Array.isArray(data)
      : !Array.isArray(data)
  ) {
    throw new Error('El servidor devolvió un reporte con formato inválido. Volvé a intentar.');
  }
  return data;
}

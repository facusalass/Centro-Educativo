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
  'ingresos-periodo': 'Ingresos por Período',
  'pagos-completos': 'Pagos Completos por Período, Ciclo y Curso',
  'pagos-incompletos': 'Pagos Incompletos por Período, Ciclo y Curso',
  'pagos-por-deporte': 'Pagos por Deporte, Nivel, Horario y Profesor',
  'pagos-por-transporte': 'Pagos por Recorrido de Transporte',
} as const;

export type ReportType = keyof typeof reportDefinitions;

export function isPersonalReport(type: ReportType) {
  return type === 'alumno' || type === 'docente';
}

export function isFinancialReport(type: ReportType) {
  return type === 'ingresos-periodo' || type.startsWith('pagos-');
}

export type ReportFiltros = {
  desde?: string;
  hasta?: string;
  ciclo?: string;
  curso_id?: string;
  deporte_id?: string;
  nivel?: string;
  horario?: string;
  profesor_id?: string;
  recorrido_id?: string;
};

export function filtrosToQuery(filtros: ReportFiltros) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filtros)) {
    if (typeof value === 'string' && value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function fetchReport(
  type: ReportType,
  id: string,
  signal: AbortSignal,
  filtros: ReportFiltros = {},
) {
  const suffix = isPersonalReport(type) ? `/${encodeURIComponent(id)}` : filtrosToQuery(filtros);
  const data = await request<unknown>(`/reportes/${type}${suffix}`, { signal });
  // Todos los reportes devuelven un arreglo, salvo los personales (objeto) y
  // 'ingresos-periodo' (objeto de totales).
  const formatoOk =
    isPersonalReport(type) || type === 'ingresos-periodo'
      ? Boolean(data) && typeof data === 'object' && !Array.isArray(data)
      : Array.isArray(data);
  if (!formatoOk) {
    throw new Error('El servidor devolvió un reporte con formato inválido. Volvé a intentar.');
  }
  return data;
}

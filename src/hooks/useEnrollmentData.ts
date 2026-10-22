import { useCallback } from 'react';
import { request } from '../services/api';
import { useResource } from '../services/useResource';
import type {
  Alumno,
  Curso,
  Deporte,
  GrupoDeporte,
  InscripcionDetalle,
  RecorridoTransporte,
  ReporteAlumno,
} from '../types';
import type { Matricula, MonthlyQuote } from '../types/portal';

const emptyCatalog = {
  courses: [] as Curso[],
  groups: [] as GrupoDeporte[],
  sports: [] as Deporte[],
  routes: [] as RecorridoTransporte[],
};
const emptyActivity = {
  students: [] as Alumno[],
  items: [] as InscripcionDetalle[],
  matriculas: [] as Matricula[],
};

export function useEnrollmentData(admin: boolean) {
  const loadCatalog = useCallback(async (signal: AbortSignal) => {
    const [courses, groups, sports, routes] = await Promise.all([
      request<Curso[]>('/cursos', { signal }),
      request<GrupoDeporte[]>('/grupos-deporte', { signal }),
      request<Deporte[]>('/deportes', { signal }),
      request<RecorridoTransporte[]>('/recorridos', { signal }),
    ]);
    return { courses, groups, sports, routes };
  }, []);
  const loadActivity = useCallback(
    async (signal: AbortSignal) => {
      const [students, items, matriculas] = await Promise.all([
        request<Alumno[]>(admin ? '/alumnos' : '/padres/hijos', { signal }),
        request<InscripcionDetalle[]>('/inscripciones', { signal }),
        request<Matricula[]>('/matriculas', { signal }),
      ]);
      return { students, items, matriculas };
    },
    [admin],
  );
  const catalog = useResource(loadCatalog, emptyCatalog);
  const activity = useResource(loadActivity, emptyActivity);
  return {
    ...catalog.data,
    ...activity.data,
    error: catalog.error || activity.error,
    reload: activity.reload,
  };
}

type StudentProfile = { report: ReporteAlumno; quote: MonthlyQuote };
export function useStudentProfile(studentId: string, enrollments: InscripcionDetalle[]) {
  const loader = useCallback(
    async (signal: AbortSignal): Promise<StudentProfile | null> => {
      if (!studentId) return null;
      const [report, quote] = await Promise.all([
        request<ReporteAlumno>(`/reportes/alumno/${studentId}`, { signal }),
        request<MonthlyQuote>(`/padres/hijos/${studentId}/arancel`, { signal }),
      ]);
      return { report, quote };
    },
    [studentId, enrollments],
  );
  return useResource(loader, null);
}

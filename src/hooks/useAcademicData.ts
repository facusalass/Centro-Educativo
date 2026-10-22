import { useCallback } from 'react';
import { request } from '../services/api';
import { useResource } from '../services/useResource';
import type { AsignacionDocente } from '../types';
import type { Evaluation, StudentRosterEntry } from '../types/portal';

const emptyAcademic = { items: [] as Evaluation[], assignments: [] as AsignacionDocente[] };
export function useAcademicData(studentId: number | undefined, teacher: boolean) {
  const loader = useCallback(
    async (signal: AbortSignal) => {
      if (!teacher && !studentId) return emptyAcademic;
      const [items, assignments] = await Promise.all([
        request<Evaluation[]>(`/evaluaciones${studentId ? `?alumno_id=${studentId}` : ''}`, {
          signal,
        }),
        teacher
          ? request<AsignacionDocente[]>('/asignaciones-docentes', { signal })
          : Promise.resolve([]),
      ]);
      return { items, assignments };
    },
    [studentId, teacher],
  );
  return useResource(loader, emptyAcademic);
}

export function useEvaluationRoster(evaluationId: string, teacher: boolean) {
  const loader = useCallback(
    (signal: AbortSignal) => {
      if (!teacher || !evaluationId) return Promise.resolve([]);
      return request<StudentRosterEntry[]>(`/evaluaciones/${evaluationId}/alumnos`, { signal });
    },
    [evaluationId, teacher],
  );
  return useResource<StudentRosterEntry[]>(loader, []);
}

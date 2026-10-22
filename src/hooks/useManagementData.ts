import { useCallback } from 'react';
import { request } from '../services/api';
import { useResource } from '../services/useResource';
import type { AdminBootstrap, Nivel, ActividadEscolar, GaleriaImagen } from '../types';
import type { Row } from '../components/EntityManager';

export type ManagementSnapshot = {
  catalog: Record<string, Row[]>;
  status: { database: string; smtp: boolean };
};
export function useManagementData() {
  const loader = useCallback(async (signal: AbortSignal): Promise<ManagementSnapshot> => {
    const [bootstrap, niveles, actividades, galeria, tarifas, status] = await Promise.all([
      request<AdminBootstrap>('/admin/bootstrap', { signal }),
      request<Nivel[]>('/niveles', { signal }),
      request<ActividadEscolar[]>('/actividades', { signal }),
      request<GaleriaImagen[]>('/galeria', { signal }),
      request<Row[]>('/tarifas', { signal }),
      request<ManagementSnapshot['status']>('/admin/status', { signal }),
    ]);
    return { catalog: { ...bootstrap, niveles, actividades, galeria, tarifas }, status };
  }, []);
  return useResource<ManagementSnapshot | null>(loader, null);
}

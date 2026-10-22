import { useCallback } from 'react';
import { request } from '../../services/api';
import { Feedback } from '../PortalShell';
import type { AuditEntry } from '../../types/portal';
import { useResource } from '../../services/useResource';
export function AuditLog() {
  const loader = useCallback(
    (signal: AbortSignal) => request<AuditEntry[]>('/admin/auditoria', { signal }),
    [],
  );
  const { data: rows, error, loading } = useResource<AuditEntry[]>(loader, []);
  return (
    <section className="panel-card">
      <h2>Registro de cambios</h2>
      <Feedback error>{error}</Feedback>
      {loading && <Feedback>Cargando auditoría…</Feedback>}
      <div className="report-table-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Recurso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.fecha).toLocaleString('es-AR')}</td>
                <td>{row.usuario || 'Sistema'}</td>
                <td>{row.accion}</td>
                <td>
                  {row.recurso} #{row.recurso_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { request } from '../../services/api';
import { Feedback } from '../PortalShell';
import type { Communication } from '../../types/portal';
import { useResource } from '../../services/useResource';
export function Communications() {
  const [type, setType] = useState('solicitudes-inscripcion');
  const [error, setError] = useState('');
  const loader = useCallback(
    (signal: AbortSignal) =>
      request<Communication[]>(`/${type}${type === 'opiniones' ? '?all=1' : ''}`, { signal }),
    [type],
  );
  const {
    data: rows,
    loading,
    error: loadError,
    reload,
  } = useResource<Communication[]>(loader, []);
  useEffect(() => setError(''), [type]);
  const change = async (row: Communication, value: string) => {
    try {
      await request(`/${type}/${row.id}/${type === 'opiniones' ? 'moderar' : 'estado'}`, {
        method: 'PUT',
        body: JSON.stringify(
          type === 'opiniones'
            ? { estado_moderacion: value }
            : type === 'postulaciones'
              ? { estado: value }
              : { estado_tramite: value },
        ),
      });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <section className="panel-card">
      <h2>Solicitudes y comunicaciones</h2>
      <label>
        Tipo de consulta
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="solicitudes-inscripcion">Solicitudes de inscripción</option>
          <option value="contacto">Mensajes de contacto</option>
          <option value="opiniones">Opiniones</option>
          <option value="postulaciones">Postulaciones de empleo</option>
        </select>
      </label>
      <Feedback error>{error || loadError}</Feedback>
      {loading && <Feedback>Cargando comunicaciones…</Feedback>}
      {!loading && !rows.length && (
        <p className="empty-state">No hay solicitudes en esta sección.</p>
      )}
      {rows.map((row) => (
        <article className="notice" key={row.id}>
          <div>
            <strong>
              {row.nombre_tutor || row.nombre_candidato || row.nombre || row.autor_anonimo}
            </strong>
            <p>{row.nombre_aspirante || row.puesto_interes || row.asunto}</p>
            <p>{row.mensaje || row.comentario}</p>
            <small>
              {row.email_contacto || row.email} · {row.telefono}
            </small>
            {row.enlace_cv && (
              <p>
                <a className="text-button" href={row.enlace_cv} target="_blank" rel="noreferrer">
                  Ver CV
                </a>
              </p>
            )}
          </div>
          {type !== 'contacto' && (
            <label>
              Estado
              <select
                value={row.estado_tramite || row.estado_moderacion || row.estado}
                onChange={(e) => change(row, e.target.value)}
              >
                {(type === 'opiniones'
                  ? ['pendiente', 'visible', 'oculta']
                  : type === 'postulaciones'
                    ? ['recibida', 'en revision', 'aceptada', 'rechazada']
                    : ['pendiente', 'en revision', 'aprobada', 'rechazada']
                ).map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>
          )}
        </article>
      ))}
    </section>
  );
}

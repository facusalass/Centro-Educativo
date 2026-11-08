import { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { Feedback } from '../PortalShell';
import { Button } from '../Button';

type Comprobante = {
  id: number;
  factura_id: number;
  monto_declarado: number;
  estado: string;
  archivo_nombre: string;
  motivo_rechazo: string | null;
  referencia_transferencia?: string | null;
};

export function PaymentProofsQueue() {
  const [rows, setRows] = useState<Comprobante[]>([]);
  const [filtro, setFiltro] = useState('en_revision');
  const [error, setError] = useState('');
  const [motivo, setMotivo] = useState<Record<number, string>>({});

  const load = () => {
    setError('');
    request<Comprobante[]>(`/admin/comprobantes${filtro ? `?estado=${filtro}` : ''}`)
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  };

  useEffect(load, [filtro]);

  const validar = async (id: number, accion: 'aprobar' | 'rechazar') => {
    setError('');
    try {
      if (accion === 'rechazar' && !(motivo[id] ?? '').trim()) {
        setError('El motivo de rechazo es obligatorio.');
        return;
      }
      await request(`/admin/comprobantes/${id}/validar`, {
        method: 'PUT',
        body: JSON.stringify({ accion, motivo_rechazo: motivo[id] ?? '' }),
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <section className="panel-card">
      <div className="section-toolbar">
        <div>
          <span className="eyebrow">Pagos</span>
          <h2>Validación de comprobantes</h2>
        </div>
        <label>
          Estado
          <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todos</option>
            <option value="en_revision">En revisión</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado">Rechazados</option>
          </select>
        </label>
      </div>
      <Feedback error>{error}</Feedback>
      {!rows.length && <p className="empty-state">No hay comprobantes en este estado.</p>}
      {rows.map((c) => (
        <article className="notice" key={c.id}>
          <div>
            <strong>
              #{c.id} · Factura {c.factura_id} · {c.monto_declarado}
            </strong>
            <p>
              {c.archivo_nombre} · {c.estado}
              {c.referencia_transferencia ? ` · Ref: ${c.referencia_transferencia}` : ''}
              {c.motivo_rechazo ? ` · Motivo: ${c.motivo_rechazo}` : ''}
            </p>
            <a href={`/api/comprobantes/${c.id}/archivo`} target="_blank" rel="noreferrer">
              Ver archivo
            </a>
          </div>
          {c.estado === 'en_revision' && (
            <div>
              <input
                placeholder="Motivo de rechazo"
                value={motivo[c.id] ?? ''}
                onChange={(e) => setMotivo({ ...motivo, [c.id]: e.target.value })}
              />
              <Button variant="outline" onClick={() => void validar(c.id, 'aprobar')}>
                Aprobar
              </Button>
              <Button variant="outline" onClick={() => void validar(c.id, 'rechazar')}>
                Rechazar
              </Button>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

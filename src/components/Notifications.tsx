import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { request } from '../services/api';
import { Feedback } from './PortalShell';
type Notice = { id: number; titulo: string; mensaje: string; fecha: string; leida: number };
export function Notifications() {
  const [items, setItems] = useState<Notice[]>([]),
    [error, setError] = useState('');
  const load = () =>
    request<Notice[]>('/notificaciones')
      .then(setItems)
      .catch((e: Error) => setError(e.message));
  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      void load();
    }, 30000);
    return () => clearInterval(timer);
  }, []);
  const read = async (id: number) => {
    try {
      await request(`/notificaciones/${id}/leida`, { method: 'PUT' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <section className="panel-card">
      <h2>
        <Bell size={22} /> Novedades{' '}
        <span className="badge badge-blue">{items.filter((i) => !i.leida).length} nuevas</span>
      </h2>
      <Feedback error>{error}</Feedback>
      {!items.length && (
        <p className="empty-state">Tus confirmaciones y novedades aparecerán acá.</p>
      )}
      <div className="notice-list">
        {items.map((item) => (
          <article className={`notice ${item.leida ? 'notice-read' : ''}`} key={item.id}>
            <div>
              <strong>{item.titulo}</strong>
              <p>{item.mensaje}</p>
              <small>{new Date(item.fecha).toLocaleString('es-AR')}</small>
            </div>
            {!item.leida && (
              <button
                className="text-button"
                onClick={() => read(item.id)}
                aria-label={`Marcar como leída: ${item.titulo}`}
              >
                <Check size={18} /> Leída
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

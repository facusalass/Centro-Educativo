import { useEffect, useState } from 'react';
export function usePublicList<T>(fetcher: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetcher());
    } catch {
      setError('No se pudo cargar esta información. Volvé a intentar en unos momentos.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void reload();
  }, [fetcher]);
  const status = loading ? (
    <p className="empty-state" role="status">
      Cargando información…
    </p>
  ) : error ? (
    <div className="feedback feedback-error" role="alert">
      {error}{' '}
      <button type="button" className="text-button" onClick={reload}>
        Reintentar
      </button>
    </div>
  ) : !items.length ? (
    <p className="empty-state">Todavía no hay información publicada.</p>
  ) : null;
  return { items, loading, status, reload };
}

import { useCallback, useEffect, useRef, useState } from 'react';

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}

/** The caller memoizes the loader; changing it cancels the previous request. */
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, initial: T) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialValue = useRef(initial);
  const controller = useRef<AbortController | null>(null);

  const reload = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setLoading(true);
    setError('');
    try {
      const value = await loader(current.signal);
      if (!current.signal.aborted) setData(value);
      return value;
    } catch (failure) {
      if (!current.signal.aborted) setError(errorMessage(failure));
      throw failure;
    } finally {
      if (!current.signal.aborted) setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    setData(initialValue.current);
    void reload().catch(() => {}); // Error is exposed as state; no unhandled rejection.
    return () => controller.current?.abort();
  }, [reload]);

  return { data, loading, error, reload };
}

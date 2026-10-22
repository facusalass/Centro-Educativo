const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function serverMessage(body: unknown): string | undefined {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string')
    return body.error;
  return undefined;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (typeof options.body === 'string' && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include', headers });
  } catch (failure) {
    if (options.signal?.aborted) throw failure;
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisá tu conexión y reintentá.');
  }
  const content = await response.text();
  let body: unknown;
  try {
    body = content ? JSON.parse(content) : undefined;
  } catch {
    throw new ApiError(
      response.ok ? 502 : response.status,
      'El servidor devolvió una respuesta no válida. Volvé a intentar.',
    );
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/') && !path.includes('/login'))
      window.dispatchEvent(new Event('session-expired'));
    throw new ApiError(
      response.status,
      serverMessage(body) ?? 'No se pudo completar la solicitud.',
    );
  }
  return body as T;
}

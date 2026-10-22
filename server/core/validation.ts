import { assert } from './errors.ts';

export function objectBody(value: unknown): Record<string, unknown> {
  assert(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    400,
    'El cuerpo de la solicitud no es válido.',
  );
  return value as Record<string, unknown>;
}
export function calendarDate(value: unknown): string {
  const date = String(value ?? '');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(date), 400, 'Ingresá una fecha válida (AAAA-MM-DD).');
  const parsed = new Date(`${date}T00:00:00Z`);
  assert(
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date,
    400,
    'La fecha no existe en el calendario.',
  );
  return date;
}
export function httpsUrl(value: unknown): string {
  const text = String(value ?? '').trim();
  let url: URL | undefined;
  try {
    url = new URL(text);
  } catch {
    /* The assertion below returns a public validation error. */
  }
  assert(
    url?.protocol === 'https:' &&
      url.hostname &&
      !url.username &&
      !url.password &&
      text.length <= 2000,
    400,
    'Ingresá un enlace HTTPS válido al archivo.',
  );
  return text;
}

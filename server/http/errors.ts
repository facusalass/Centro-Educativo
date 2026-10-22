import type { ErrorRequestHandler } from 'express';

const conflictCodes = new Set([
  '23505',
  '23503',
  'SQLITE_CONSTRAINT_UNIQUE',
  'SQLITE_CONSTRAINT_FOREIGNKEY',
]);

export function errorResponse(failure: unknown) {
  const details =
    failure && typeof failure === 'object' ? (failure as Record<string, unknown>) : {};
  const conflict = typeof details.code === 'string' && conflictCodes.has(details.code);
  const explicitStatus =
    typeof details.status === 'number' &&
    Number.isInteger(details.status) &&
    details.status >= 400 &&
    details.status < 600;
  const status = conflict ? 409 : explicitStatus ? Number(details.status) : 500;
  if (status >= 500)
    console.error('Request failed:', details.code || details.name || 'UnknownError');
  const message =
    status >= 500
      ? 'No se pudo completar la operación. Volvé a intentar.'
      : conflict && !explicitStatus
        ? 'El registro está duplicado o tiene información relacionada.'
        : typeof details.message === 'string'
          ? details.message
          : 'La solicitud no es válida.';
  return { status, body: { error: message } };
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  if (response.headersSent) return next(error);
  const result = errorResponse(error);
  response.status(result.status).json(result.body);
};

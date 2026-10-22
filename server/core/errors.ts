export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function assert(condition: unknown, status: number, message: string): asserts condition {
  if (!condition) throw new HttpError(status, message);
}
export const idOf = (value: unknown) => {
  const id = Number(value);
  assert(Number.isSafeInteger(id) && id > 0, 400, 'El identificador no es válido.');
  return id;
};

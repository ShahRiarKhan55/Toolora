/** An error whose message is safe to show to API clients. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export function notFoundError(message = 'Resource not found.'): HttpError {
  return new HttpError(404, 'not_found', message);
}

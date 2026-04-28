/**
 * Transport-agnostic error type thrown by providers, middlewares and route
 * handlers. The HTTP layer catches {@link ApiError}, maps its `status` to the
 * response code and serialises it in an OpenAI-compatible shape.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly type: string;
  public readonly code?: number | string;
  public readonly retriable: boolean;
  public readonly details?: unknown;

  constructor(input: {
    status: number;
    type: string;
    message: string;
    code?: number | string;
    retriable?: boolean;
    details?: unknown;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.type = input.type;
    this.code = input.code;
    this.retriable = input.retriable ?? false;
    this.details = input.details;
  }

  toResponse() {
    return {
      error: {
        message: this.message,
        type: this.type,
        code: this.code,
        status: this.status,
        retriable: this.retriable,
        details: this.details,
      },
    };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

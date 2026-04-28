import { ApiError } from './http-error';

export interface HttpJsonRequestInit extends Omit<RequestInit, 'signal'> {}

export interface HttpJsonResponse {
  status: number;
  ok: boolean;
  /** Parsed JSON body, or `{ raw: text }` if body is not JSON, or `null` if empty. */
  data: unknown;
}

export interface HttpJsonOptions {
  /** Human-readable label used in error messages, e.g. "Garena", "OpenAI". */
  label: string;
  timeoutMs: number;
}

/**
 * Fire a fetch with a hard timeout and parse the response body as JSON.
 * Throws {@link ApiError} for timeouts and network failures, never for HTTP
 * error statuses — callers inspect `status`/`ok` and map upstream payloads to
 * their own {@link ApiError}s.
 */
export async function httpJson(
  url: string,
  init: HttpJsonRequestInit,
  options: HttpJsonOptions,
): Promise<HttpJsonResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError({
        status: 504,
        type: 'request_timeout',
        message: `${options.label} request timed out after ${options.timeoutMs}ms.`,
        retriable: true,
      });
    }
    throw new ApiError({
      status: 502,
      type: 'network_error',
      message: `${options.label} request failed before receiving a response.`,
      retriable: true,
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  return { status: response.status, ok: response.ok, data };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

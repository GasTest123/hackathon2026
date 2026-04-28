import { ApiError } from './http-error';

/**
 * Returns a `beforeHandle` function that enforces `Authorization: Bearer <key>`
 * on routes it is attached to. When `expectedKey` is undefined the guard is a
 * no-op, which lets the caller register it unconditionally.
 */
export function requireBearerKey(expectedKey: string | undefined) {
  return ({ request }: { request: Request }) => {
    if (!expectedKey) {
      return;
    }

    const header = request.headers.get('authorization') ?? '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    const provided = match?.[1]?.trim();

    if (!provided || provided !== expectedKey) {
      throw new ApiError({
        status: 401,
        type: 'unauthorized',
        message: 'Missing or invalid API key. Pass "Authorization: Bearer <SERVER_API_KEY>".',
      });
    }
  };
}

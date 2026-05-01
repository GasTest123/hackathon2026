import { ApiError } from './http-error';
import { isUsableJwtAccessToken } from './jwt';

export function readBearerToken(request: Request) {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

/**
 * Returns a `beforeHandle` function for LLM routes. When SERVER_API_KEY is set,
 * callers may pass either that static key or a JWT access token signed with
 * JWT_SECRET via `Authorization: Bearer <token>`.
 */
export function requireLlmBearerAuth(expectedKey: string | undefined, jwtSecret: string) {
  return ({ request }: { request: Request }) => {
    const provided = readBearerToken(request);

    if (
      !provided ||
      ((!expectedKey || provided !== expectedKey) && !isUsableJwtAccessToken(provided, jwtSecret))
    ) {
      throw new ApiError({
        status: 401,
        type: 'unauthorized',
        message:
          'Missing or invalid credentials. Pass "Authorization: Bearer <SERVER_API_KEY>" or a valid access token.',
      });
    }
  };
}

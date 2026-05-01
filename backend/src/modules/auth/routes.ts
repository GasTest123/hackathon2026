import { Elysia } from 'elysia';

import type { DbClient } from '../../db';
import { readBearerToken } from '../../shared/bearer-guard';
import { accessTokenSecurity, ErrorResponseSchema } from '../../shared/schema';
import {
  AuthSessionResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  parseLoginRequest,
} from './schema';
import { createAuthService } from './service';

export interface AuthRoutesOptions {
  db: DbClient;
  serverApiKey?: string;
  jwtSecret: string;
}

/**
 * Elysia plugin for user-facing auth (login, session, OAuth logins, etc.).
 * Exposes:
 *   GET  /auth/session — returns the current login state for the caller.
 *   POST /auth/login   — returns an access token for the submitted email/device.
 */
export function authRoutes({ db, serverApiKey, jwtSecret }: AuthRoutesOptions) {
  const service = createAuthService({ db, serverApiKey, jwtSecret });

  return new Elysia({ name: 'auth' }).group('/auth', (group) =>
    group
      .get('/session', ({ request }) => service.session(readBearerToken(request)), {
        response: {
          200: AuthSessionResponseSchema,
          401: ErrorResponseSchema,
        },
        detail: {
          tags: ['Auth'],
          summary: 'Get current session',
          security: accessTokenSecurity,
        },
      })
      .post(
        '/login',
        async ({ body }) => {
          const input = parseLoginRequest(body);
          return service.login(input);
        },
        {
          body: LoginRequestSchema,
          response: {
            200: LoginResponseSchema,
            400: ErrorResponseSchema,
            500: ErrorResponseSchema,
          },
          detail: {
            tags: ['Auth'],
            summary: 'Login with credentials',
          },
        },
      ),
  );
}

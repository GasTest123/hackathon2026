import { Elysia } from 'elysia';

import type { DbClient } from '../../db';
import { parseLoginRequest } from './schema';
import { createAuthService } from './service';

export interface AuthRoutesOptions {
  db: DbClient;
}

/**
 * Elysia plugin for user-facing auth (login, session, OAuth logins, etc.).
 * Exposes:
 *   GET  /auth/ping   — smoke check, returns `{ ok: true, module: 'auth' }`
 *   POST /auth/login  — delegates to {@link createAuthService}; currently
 *                       throws `not_implemented` until the service is wired.
 */
export function authRoutes({ db }: AuthRoutesOptions) {
  const service = createAuthService({ db });

  return new Elysia({ name: 'auth' }).group('/auth', (group) =>
    group
      .get('/ping', () => ({ ok: true, module: 'auth' }))
      .post('/login', async ({ body }) => {
        const input = parseLoginRequest(body);
        return service.login(input);
      }),
  );
}

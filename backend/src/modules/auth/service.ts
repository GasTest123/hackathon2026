import type { DbClient } from '../../db';
import { ApiError } from '../../shared/http-error';
import type { LoginRequest } from './schema';

export interface AuthServiceDeps {
  db: DbClient;
}

export interface LoginResult {
  userId: string;
  token: string;
}

export interface AuthService {
  login(input: LoginRequest): Promise<LoginResult>;
}

/**
 * Placeholder business layer for the auth module. Concrete flows (password
 * hashing, session/JWT issuance, refresh tokens, OAuth) should live here so
 * routes.ts stays transport-only.
 */
export function createAuthService(_deps: AuthServiceDeps): AuthService {
  return {
    async login(_input: LoginRequest): Promise<LoginResult> {
      throw new ApiError({
        status: 501,
        type: 'not_implemented',
        message: 'Auth module is not implemented yet.',
      });
    },
  };
}

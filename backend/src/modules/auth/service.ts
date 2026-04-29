import type { DbClient } from '../../db';
import { ApiError } from '../../shared/http-error';
import { createAccessToken, parseVerifiedJwt } from '../../shared/jwt';
import type { AuthSessionResponse, LoginRequest } from './schema';

export interface AuthServiceDeps {
  db: DbClient;
  serverApiKey?: string;
  jwtSecret: string;
}

export interface LoginResult {
  accessToken: string;
}

export interface AuthService {
  login(input: LoginRequest): Promise<LoginResult>;
  session(accessToken: string | undefined): Promise<AuthSessionResponse>;
}

const API_KEY_SESSION = {
  email: 'hackathon2026@garena.com',
  deviceId: '00000000-0000-0000-0000-000000000000',
};

/**
 * Placeholder business layer for the auth module. Concrete flows (token
 * signing, session persistence, refresh tokens, OAuth) should live here so
 * routes.ts stays transport-only.
 */
export function createAuthService(deps: AuthServiceDeps): AuthService {
  return {
    async login(input: LoginRequest): Promise<LoginResult> {
      return {
        accessToken: createAccessToken(input, deps.jwtSecret),
      };
    },
    async session(accessToken: string | undefined): Promise<AuthSessionResponse> {
      if (!accessToken) {
        throw new ApiError({
          status: 401,
          type: 'unauthorized',
          message: 'Missing or invalid access token.',
        });
      }

      if (deps.serverApiKey && accessToken === deps.serverApiKey) {
        return {
          ...API_KEY_SESSION,
          accessToken: createAccessToken(API_KEY_SESSION, deps.jwtSecret),
        };
      }

      const payload = parseVerifiedJwt(accessToken, deps.jwtSecret)?.payload;
      if (!payload) {
        throw new ApiError({
          status: 401,
          type: 'unauthorized',
          message: 'Missing or invalid access token.',
        });
      }

      const email = typeof payload?.email === 'string' ? payload.email : '';
      const deviceId = typeof payload?.deviceId === 'string' ? payload.deviceId : '';

      if (!email || !deviceId) {
        throw new ApiError({
          status: 401,
          type: 'unauthorized',
          message: 'Access token does not include session identity.',
        });
      }

      return {
        email,
        deviceId,
        accessToken,
      };
    },
  };
}

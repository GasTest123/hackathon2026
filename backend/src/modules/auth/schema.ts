import { t, type Static } from 'elysia';

import { ApiError, isRecord } from '../../shared/http-error';

export const AuthSessionResponseSchema = t.Object({
  email: t.String(),
  deviceId: t.String(),
  accessToken: t.String(),
});

export const LoginRequestSchema = t.Object(
  {
    email: t.String({
      minLength: 3,
      format: 'email',
      description: 'User email address.',
    }),
    deviceId: t.String({
      minLength: 1,
      description: 'Client device identifier.',
    }),
  },
  { description: 'Login request.' },
);

export const LoginResponseSchema = t.Object({
  accessToken: t.String({
    description: 'User access token for Authorization: Bearer <access_token>.',
  }),
});

export type LoginRequest = Static<typeof LoginRequestSchema>;
export type AuthSessionResponse = Static<typeof AuthSessionResponseSchema>;

/**
 * Placeholder validator for `POST /auth/login`.
 */
export function parseLoginRequest(body: unknown): LoginRequest {
  if (!isRecord(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId.trim() : '';

  if (!email) {
    throw validationError('Field "email" is required.');
  }
  if (!isValidEmail(email)) {
    throw validationError('Field "email" must be a valid email address.');
  }
  if (!deviceId) {
    throw validationError('Field "deviceId" is required.');
  }

  return { email, deviceId };
}

function validationError(message: string) {
  return new ApiError({ status: 400, type: 'validation_error', message });
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

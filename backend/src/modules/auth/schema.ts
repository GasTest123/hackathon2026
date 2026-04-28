import { ApiError, isRecord } from '../../shared/http-error';

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Placeholder validator for `POST /auth/login`. Real implementations should
 * extend this to cover the full login payload (captcha, device id, etc.).
 */
export function parseLoginRequest(body: unknown): LoginRequest {
  if (!isRecord(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email) {
    throw validationError('Field "email" is required.');
  }
  if (!password) {
    throw validationError('Field "password" is required.');
  }

  return { email, password };
}

function validationError(message: string) {
  return new ApiError({ status: 400, type: 'validation_error', message });
}

import { Buffer } from 'node:buffer';
import { createHmac } from 'node:crypto';

export interface ParsedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export function createAccessToken(input: { email: string; deviceId: string }, secret: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJwtPart({ alg: 'HS256', typ: 'JWT' });
  const payload = encodeJwtPart({
    email: input.email,
    deviceId: input.deviceId,
    iat: now,
    exp: now + 31 * 24 * 60 * 60,
  });
  const signature = signJwt(`${header}.${payload}`, secret);

  return `${header}.${payload}.${signature}`;
}

export function parseJwt(token: string): ParsedJwt | undefined {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return undefined;
  }

  const header = parseJwtPart(parts[0]);
  const payload = parseJwtPart(parts[1]);
  if (!header || !payload) {
    return undefined;
  }

  return { header, payload };
}

export function parseVerifiedJwt(token: string, secret: string): ParsedJwt | undefined {
  const parsed = parseJwt(token);
  if (!parsed) {
    return undefined;
  }

  const { header, payload } = parsed;
  if (header.alg !== 'HS256') {
    return undefined;
  }
  if (!hasValidSignature(token, secret)) {
    return undefined;
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && now >= payload.exp) {
    return undefined;
  }
  if (typeof payload.nbf === 'number' && now < payload.nbf) {
    return undefined;
  }

  return parsed;
}

export function isUsableJwtAccessToken(token: string, secret: string) {
  return Boolean(parseVerifiedJwt(token, secret));
}

function encodeJwtPart(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signJwt(signingInput: string, secret: string) {
  return createHmac('sha256', secret).update(signingInput).digest('base64url');
}

function hasValidSignature(token: string, secret: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  return constantTimeEqual(signJwt(`${parts[0]}.${parts[1]}`, secret), parts[2]);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return diff === 0;
}

function parseJwtPart(part: string): Record<string, unknown> | undefined {
  try {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    return typeof parsed === 'object' && parsed !== null ? parsed : undefined;
  } catch {
    return undefined;
  }
}

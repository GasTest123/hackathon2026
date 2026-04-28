import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import type { GarenaConfig } from '../../../config';
import { ApiError, isRecord } from '../../../shared/http-error';
import { httpJson } from '../../../shared/http-client';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LlmProvider,
} from '../types';

interface AccessTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  token_quota?: number;
  token_used?: number;
}

interface CachedAccessToken {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  createdAt: number;
  tokenQuota?: number;
  tokenUsed?: number;
}

const REFRESH_LEAD_MS = 60_000;
const BACKOFF_MS = 30_000;

const KNOWN_MODELS = [
  'doubao-1-5-pro-32k-character',
  'doubao-seed-1-8',
  'doubao-seed-1-6-flash',
  'doubao-seed-1-6',
  'doubao-1-5-pro-32k',
  'deepseek-v3-2',
];

/**
 * Garena AI Agent Hackathon 2026 LLM provider.
 *
 * Handles OAuth2 client_credentials token acquisition, on-disk token caching
 * (mode 0600), proactive refresh before expiry, and transparent one-shot
 * retry on 401. Upstream errors are normalised to {@link ApiError}.
 */
export class GarenaProvider implements LlmProvider {
  readonly name = 'garena' as const;

  private readonly config: GarenaConfig;
  private token?: CachedAccessToken;
  private tokenLoaded = false;
  private refreshPromise?: Promise<CachedAccessToken>;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private autoRefreshEnabled = false;

  constructor(config: GarenaConfig) {
    this.config = config;
  }

  get defaultModel() {
    return this.config.defaultModel;
  }

  listModels() {
    return [...KNOWN_MODELS];
  }

  start() {
    if (this.autoRefreshEnabled) return;
    this.autoRefreshEnabled = true;
    void this.ensureTokenAndSchedule().catch((error) => {
      this.handleBackgroundRefreshError(error);
    });
  }

  stop() {
    this.autoRefreshEnabled = false;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  async chat(input: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body: ChatCompletionRequest = {
      ...input,
      model: input.model ?? this.config.defaultModel,
    };
    return this.authedRequest<ChatCompletionResponse>('/chat/completions', body);
  }

  async getAccessToken(forceRefresh = false): Promise<string> {
    await this.loadCachedToken();

    if (!forceRefresh && this.token && !this.isExpiring(this.token)) {
      this.scheduleNextRefresh();
      return this.token.accessToken;
    }

    const token = await this.refreshAccessToken();
    this.scheduleNextRefresh();
    return token.accessToken;
  }

  private async authedRequest<T>(path: string, body: unknown, retrying401 = false): Promise<T> {
    const { status, ok, data } = await httpJson(
      this.endpoint(path),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await this.getAccessToken()}`,
        },
        body: JSON.stringify(body ?? {}),
      },
      { label: 'Garena', timeoutMs: this.config.timeoutMs },
    );

    if (status === 401 && !retrying401) {
      await this.getAccessToken(true);
      return this.authedRequest<T>(path, body, true);
    }

    if (!ok) {
      throw toGarenaApiError(status, data);
    }
    return data as T;
  }

  private async refreshAccessToken() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.fetchAccessToken().finally(() => {
      this.refreshPromise = undefined;
    });
    return this.refreshPromise;
  }

  private async ensureTokenAndSchedule() {
    await this.loadCachedToken();

    if (!this.token || this.isExpiring(this.token)) {
      await this.refreshAccessToken();
    }

    this.scheduleNextRefresh();
  }

  private scheduleNextRefresh() {
    if (!this.autoRefreshEnabled || !this.token) return;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    const refreshAt = this.token.expiresAt - REFRESH_LEAD_MS;
    const delayMs = Math.max(refreshAt - Date.now(), 1_000);

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      void this.refreshAccessToken()
        .then(() => this.scheduleNextRefresh())
        .catch((error) => this.handleBackgroundRefreshError(error));
    }, delayMs);
  }

  private handleBackgroundRefreshError(error: unknown) {
    console.warn('[garena] background token refresh failed:', error);

    if (!this.autoRefreshEnabled) return;

    // Missing credentials cannot be fixed by retrying; bail out instead of
    // burning CPU in a tight loop.
    if (error instanceof ApiError && error.type === 'missing_credentials') {
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = undefined;
      void this.ensureTokenAndSchedule().catch((retryError) => {
        this.handleBackgroundRefreshError(retryError);
      });
    }, BACKOFF_MS);
  }

  private async fetchAccessToken() {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new ApiError({
        status: 500,
        type: 'missing_credentials',
        message: 'GARENA_CLIENT_ID and GARENA_CLIENT_SECRET are required.',
      });
    }

    const { status, ok, data } = await httpJson(
      this.endpoint('/oauth/token'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
      },
      { label: 'Garena', timeoutMs: this.config.timeoutMs },
    );

    if (!ok) {
      throw toGarenaApiError(status, data);
    }

    const tokenResponse = data as AccessTokenResponse;
    if (!tokenResponse?.access_token) {
      throw new ApiError({
        status: 502,
        type: 'invalid_token_response',
        message: 'OAuth token response does not include access_token.',
        retriable: true,
        details: data,
      });
    }

    const now = Date.now();
    const token: CachedAccessToken = {
      accessToken: tokenResponse.access_token,
      tokenType: tokenResponse.token_type ?? 'Bearer',
      expiresAt: now + (tokenResponse.expires_in ?? 3600) * 1000,
      createdAt: now,
      tokenQuota: tokenResponse.token_quota,
      tokenUsed: tokenResponse.token_used,
    };

    this.token = token;
    await this.saveCachedToken(token);
    console.log(
      `[garena] access token refreshed; expires in ${tokenResponse.expires_in ?? 3600}s` +
        (tokenResponse.token_quota !== undefined
          ? `, quota ${tokenResponse.token_used ?? 0}/${tokenResponse.token_quota}`
          : ''),
    );
    return token;
  }

  private async loadCachedToken() {
    if (this.tokenLoaded) return;
    this.tokenLoaded = true;

    try {
      const raw = await readFile(this.config.tokenCacheFile, 'utf8');
      const parsed = JSON.parse(raw) as Partial<CachedAccessToken>;

      if (typeof parsed.accessToken === 'string' && typeof parsed.expiresAt === 'number') {
        this.token = {
          accessToken: parsed.accessToken,
          tokenType: parsed.tokenType ?? 'Bearer',
          expiresAt: parsed.expiresAt,
          createdAt: parsed.createdAt ?? 0,
          tokenQuota: parsed.tokenQuota,
          tokenUsed: parsed.tokenUsed,
        };
        const remainingMs = this.token.expiresAt - Date.now();
        console.log(
          `[garena] loaded cached token from ${this.config.tokenCacheFile}; ` +
            `${remainingMs > 0 ? `${Math.round(remainingMs / 1000)}s remaining` : 'already expired'}`,
        );
      }
    } catch (error) {
      if (!isFileNotFound(error)) {
        console.warn('[garena] failed to read cached access token:', error);
      }
    }
  }

  private async saveCachedToken(token: CachedAccessToken) {
    await mkdir(dirname(this.config.tokenCacheFile), { recursive: true });
    await writeFile(this.config.tokenCacheFile, JSON.stringify(token, null, 2), {
      mode: 0o600,
    });
  }

  private isExpiring(token: CachedAccessToken) {
    return token.expiresAt - Date.now() <= REFRESH_LEAD_MS;
  }

  private endpoint(path: string) {
    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (/^https?:\/\//i.test(baseUrl)) {
      return `${baseUrl}${normalizedPath}`;
    }

    if (this.config.apiOrigin) {
      return new URL(`${baseUrl}${normalizedPath}`, this.config.apiOrigin).toString();
    }

    return `${baseUrl}${normalizedPath}`;
  }
}

function toGarenaApiError(status: number, body: unknown) {
  const payload = isRecord(body) ? body : {};
  const error = typeof payload.error === 'string' ? payload.error : undefined;
  const code =
    typeof payload.code === 'number' || typeof payload.code === 'string' ? payload.code : undefined;

  if (status === 400 && error === 'invalid model') {
    return new ApiError({
      status,
      type: 'invalid_model',
      message: 'Requested model is not allowed by Garena API.',
      code,
      details: body,
    });
  }

  if (status === 429 && (error === 'token quota exceeded' || code === 3003)) {
    return new ApiError({
      status,
      type: 'quota_exceeded',
      message: 'Garena token quota exceeded.',
      code,
      details: body,
    });
  }

  if (status === 502 && error === 'upstream error') {
    return new ApiError({
      status,
      type: 'upstream_error',
      message: 'Garena upstream model service returned an error.',
      code,
      retriable: true,
      details: body,
    });
  }

  if (status === 500 && error === 'internal server error') {
    return new ApiError({
      status,
      type: 'internal_server_error',
      message: 'Garena API returned an internal server error.',
      code,
      retriable: true,
      details: body,
    });
  }

  if (status === 401) {
    return new ApiError({
      status,
      type: 'unauthorized',
      message: 'Garena access token is invalid or expired.',
      code,
      details: body,
    });
  }

  return new ApiError({
    status,
    type: status === 400 ? 'bad_request' : 'garena_api_error',
    message: error ?? `Garena API returned HTTP ${status}.`,
    code,
    details: body,
    retriable: status >= 500,
  });
}

function isFileNotFound(error: unknown) {
  return isRecord(error) && (error as { code?: string }).code === 'ENOENT';
}

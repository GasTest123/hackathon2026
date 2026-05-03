import { resolve } from 'node:path';

export type ProviderName = 'garena' | 'openai';

export interface GarenaConfig {
  baseUrl: string;
  apiOrigin?: string;
  clientId?: string;
  clientSecret?: string;
  defaultModel?: string;
  timeoutMs: number;
  tokenCacheFile: string;
}

export interface OpenAIConfig {
  baseUrl: string;
  apiKey?: string;
  defaultModel?: string;
  timeoutMs: number;
  organization?: string;
  project?: string;
}

export interface AppConfig {
  port: number;
  prefix: string;
  serverApiKey?: string;
  jwtSecret: string;
  dataDir: string;
  systemPromptFile: string;
  profileSystemPromptFile: string;
  profileUserPromptFile: string;
  provider: ProviderName;
  garena: GarenaConfig;
  openai: OpenAIConfig;
}

const SUPPORTED_PROVIDERS: ProviderName[] = ['garena', 'openai'];

const DEFAULTS = {
  port: 3000,
  jwtSecret: '',
  dataDir: './data',
  systemPromptFile: './prompts/system.md',
  profileSystemPromptFile: './prompts/profile_system.md',
  profileUserPromptFile: './prompts/profile_user.md',
  garena: {
    baseUrl: '/api/v1',
    timeoutMs: 620_000,
    minTimeoutMs: 600_000,
    tokenCacheFile: '.cache/garena-access-token.json',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    timeoutMs: 60_000,
  },
} as const;

/**
 * Parse process.env into a typed AppConfig. Called once at boot. Throws on
 * unambiguously bad input (unknown provider, non-numeric port); missing
 * per-provider credentials are validated later by the provider itself so that
 * `LLM_PROVIDER=openai` does not trip when only Garena vars are set.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const provider = (env.LLM_PROVIDER ?? 'garena').trim().toLowerCase();
  if (!isProviderName(provider)) {
    throw new Error(
      `Unsupported LLM_PROVIDER='${provider}'. Expected one of: ${SUPPORTED_PROVIDERS.join(', ')}.`,
    );
  }

  const port = parsePositiveInt(env.PORT, DEFAULTS.port);
  const prefix = env.PREFIX?.trim() || '';
  const serverApiKey = env.SERVER_API_KEY?.trim() || undefined;
  const jwtSecret = env.JWT_SECRET?.trim() ?? DEFAULTS.jwtSecret;
  const dataDir = resolve(env.DATA_DIR?.trim() || DEFAULTS.dataDir);
  const systemPromptFile = resolve(
    env.SYSTEM_PROMPT_FILE?.trim() || DEFAULTS.systemPromptFile,
  );
  const profileSystemPromptFile = resolve(
    env.PROFILE_SYSTEM_PROMPT_FILE?.trim() || DEFAULTS.profileSystemPromptFile,
  );
  const profileUserPromptFile = resolve(
    env.PROFILE_USER_PROMPT_FILE?.trim() || DEFAULTS.profileUserPromptFile,
  );

  const garenaTimeout = parsePositiveInt(env.GARENA_HTTP_TIMEOUT_MS, DEFAULTS.garena.timeoutMs);
  const garena: GarenaConfig = {
    baseUrl: env.GARENA_BASE_URL?.trim() || DEFAULTS.garena.baseUrl,
    apiOrigin: env.GARENA_API_ORIGIN?.trim() || undefined,
    clientId: env.GARENA_CLIENT_ID?.trim() || undefined,
    clientSecret: env.GARENA_CLIENT_SECRET?.trim() || undefined,
    defaultModel: env.GARENA_MODEL?.trim() || undefined,
    timeoutMs: Math.max(garenaTimeout, DEFAULTS.garena.minTimeoutMs),
    tokenCacheFile: resolve(env.GARENA_TOKEN_CACHE_FILE?.trim() || DEFAULTS.garena.tokenCacheFile),
  };

  const openai: OpenAIConfig = {
    baseUrl: (env.OPENAI_BASE_URL?.trim() || DEFAULTS.openai.baseUrl).replace(/\/+$/, ''),
    apiKey: env.OPENAI_API_KEY?.trim() || undefined,
    defaultModel: env.OPENAI_MODEL?.trim() || undefined,
    timeoutMs: parsePositiveInt(env.OPENAI_HTTP_TIMEOUT_MS, DEFAULTS.openai.timeoutMs),
    organization: env.OPENAI_ORGANIZATION?.trim() || undefined,
    project: env.OPENAI_PROJECT?.trim() || undefined,
  };

  return {
    port,
    prefix,
    serverApiKey,
    jwtSecret,
    dataDir,
    systemPromptFile,
    profileSystemPromptFile,
    profileUserPromptFile,
    provider,
    garena,
    openai,
  };
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function isProviderName(value: string): value is ProviderName {
  return (SUPPORTED_PROVIDERS as string[]).includes(value);
}

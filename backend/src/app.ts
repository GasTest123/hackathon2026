import { Elysia } from 'elysia';
import { openapi } from '@elysia/openapi'

import type { AppConfig } from './config';
import type { DbClient } from './db';
import { authRoutes } from './modules/auth';
import { llmRoutes, type LlmProvider } from './modules/llm';
import { ApiError } from './shared/http-error';

export interface AppDeps {
  config: AppConfig;
  provider: LlmProvider;
  db: DbClient;
}

/**
 * Build the Elysia app. All cross-module dependencies are passed in explicitly
 * so the function stays pure — no reading process.env, no file I/O — which
 * makes it trivial to spin up in tests.
 */
export function buildApp(deps: AppDeps) {
  const { config, provider, db } = deps;

  let opts = {};
  if (config.prefix !== '') {
    opts = { prefix: config.prefix };
  }

  const home = () => ({
    ok: true,
    service: 'hackathon2026-backend',
    provider: provider.name,
    defaultModel: provider.defaultModel ?? null,
  });

  return new Elysia(opts)
    .use(openapi({ path: '/doc' }))
    .get('/', home)
    .get('/health', () => ({ ok: true }))
    .use(authRoutes({ db }))
    .use(llmRoutes({ provider, serverApiKey: config.serverApiKey }))
    .onError(({ code, error, set }) => {
      if (code === 'NOT_FOUND') {
        set.status = 404
        return { message: "Not Found" }
      }
      if (error instanceof ApiError) {
        set.status = error.status;
        return error.toResponse();
      }

      set.status = 500;
      return {
        error: {
          type: 'internal_server_error',
          message: error instanceof Error ? error.message : 'Unexpected server error.',
          status: 500,
          retriable: false,
        },
      };
    });
}

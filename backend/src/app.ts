import { Elysia, t } from 'elysia';

import type { AppConfig } from './config';
import type { DbClient } from './db';
import { errorMiddleware } from './middlewares/error';
import { openapiMiddleware } from './middlewares/openapi';
import { authRoutes } from './modules/auth';
import { profileRoutes } from './modules/profile';
import { resourceRoutes } from './modules/resource';
import { llmRoutes, type LlmProvider } from './modules/llm';

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
    .use(openapiMiddleware())
    .use(errorMiddleware())
    .get('/', home, {
      response: { 200: t.Object({ ok: t.Boolean() }) },
      detail: { tags: ['System'], summary: 'Home' },
    })
    .get('/healthcheck', () => ({ ok: true }), {
      response: { 200: t.Object({ ok: t.Boolean() }) },
      detail: { tags: ['System'], summary: 'Healthcheck' },
    })
    .use(authRoutes({ db, serverApiKey: config.serverApiKey, jwtSecret: config.jwtSecret }))
    .use(profileRoutes({
      dataDir: config.dataDir,
      provider,
      profileSystemPromptFile: config.profileSystemPromptFile,
      profileUserPromptFile: config.profileUserPromptFile,
      serverApiKey: config.serverApiKey,
      jwtSecret: config.jwtSecret,
    }))
    .use(resourceRoutes({
      dataDir: config.dataDir,
      serverApiKey: config.serverApiKey,
      jwtSecret: config.jwtSecret,
    }))
    .use(llmRoutes({
      provider,
      systemPromptFile: config.systemPromptFile,
      serverApiKey: config.serverApiKey,
      jwtSecret: config.jwtSecret,
    }));
}

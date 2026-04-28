import { Elysia } from 'elysia';

import { requireBearerKey } from '../../shared/bearer-guard';
import { createLlmService } from './service';
import type { LlmProvider } from './types';

export interface LlmRoutesOptions {
  provider: LlmProvider;
  /** When set, callers must send `Authorization: Bearer <serverApiKey>`. */
  serverApiKey?: string;
}

/**
 * Elysia plugin exposing OpenAI-compatible routes under /v1/*:
 *   POST /v1/chat/completions
 *   GET  /v1/models
 */
export function llmRoutes({ provider, serverApiKey }: LlmRoutesOptions) {
  const guard = requireBearerKey(serverApiKey);
  const service = createLlmService(provider);

  return new Elysia({ name: 'llm' })
    .group('/v1', (group) =>
      group
        .post(
          '/chat/completions',
          async ({ body, set }) => {
            const completion = await service.chatCompletion(body);
            set.status = 200;
            return completion;
          },
          { beforeHandle: guard },
        )
        .get(
          '/models',
          ({ set }) => {
            set.status = 200;
            return service.listModels();
          },
          { beforeHandle: guard },
        ),
    );
}

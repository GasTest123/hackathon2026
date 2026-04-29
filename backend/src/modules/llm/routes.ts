import { Elysia } from 'elysia';

import { requireLlmBearerAuth } from '../../shared/bearer-guard';
import { accessTokenSecurity, ErrorResponseSchema } from '../../shared/schema';
import {
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  ModelsListResponseSchema,
} from './schema';
import { createLlmService } from './service';
import type { LlmProvider } from './types';

export interface LlmRoutesOptions {
  provider: LlmProvider;
  systemPromptFile: string;
  /** When set, callers must send SERVER_API_KEY or a JWT access token. */
  serverApiKey?: string;
  jwtSecret: string;
}

/**
 * Elysia plugin exposing OpenAI-compatible routes under /v1/*:
 *   POST /v1/chat/completions
 *   GET  /v1/models
 */
export function llmRoutes({
  provider,
  systemPromptFile,
  serverApiKey,
  jwtSecret,
}: LlmRoutesOptions) {
  const guard = requireLlmBearerAuth(serverApiKey, jwtSecret);
  const service = createLlmService(provider, { systemPromptFile });

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
          {
            beforeHandle: guard,
            body: ChatCompletionRequestSchema,
            response: {
              200: ChatCompletionResponseSchema,
              400: ErrorResponseSchema,
              401: ErrorResponseSchema,
              429: ErrorResponseSchema,
              500: ErrorResponseSchema,
              502: ErrorResponseSchema,
            },
            detail: {
              tags: ['LLM'],
              summary: 'Create chat completion',
              description: 'OpenAI-compatible non-streaming chat completion endpoint.',
              security: accessTokenSecurity,
            },
          },
        )
        .get(
          '/models',
          ({ set }) => {
            set.status = 200;
            return service.listModels();
          },
          {
            beforeHandle: guard,
            response: {
              200: ModelsListResponseSchema,
              401: ErrorResponseSchema,
              500: ErrorResponseSchema,
            },
            detail: {
              tags: ['LLM'],
              summary: 'List available models',
              security: accessTokenSecurity,
            },
          },
        ),
    );
}

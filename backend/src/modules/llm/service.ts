import { parseChatCompletionRequest } from './schema';
import type { ChatCompletionResponse, LlmProvider } from './types';

export interface ModelsListResponse {
  object: 'list';
  data: Array<{
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }>;
}

export interface LlmService {
  chatCompletion(body: unknown): Promise<ChatCompletionResponse>;
  listModels(): ModelsListResponse;
}

/**
 * Business layer for the LLM module. Keeps routes.ts handlers to one-liners
 * and gives future concerns (logging, caching, rate-limits, fallbacks) an
 * obvious place to live.
 */
export function createLlmService(provider: LlmProvider): LlmService {
  return {
    chatCompletion(body) {
      return provider.chat(parseChatCompletionRequest(body));
    },
    listModels() {
      const ids =
        provider.listModels?.() ?? (provider.defaultModel ? [provider.defaultModel] : []);
      const created = Math.floor(Date.now() / 1000);
      return {
        object: 'list',
        data: ids.map((id) => ({
          id,
          object: 'model',
          created,
          owned_by: provider.name,
        })),
      };
    },
  };
}

import { readFile } from 'node:fs/promises';

import { ApiError } from '../../shared/http-error';
import { parseChatCompletionRequest } from './schema';
import type { ChatCompletionRequest, ChatCompletionResponse, LlmProvider } from './types';

const SYSTEM_PLACEHOLDER = '{{system}}';

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

export interface LlmServiceOptions {
  systemPromptFile: string;
}

/**
 * Business layer for the LLM module. Keeps routes.ts handlers to one-liners
 * and gives future concerns (logging, caching, rate-limits, fallbacks) an
 * obvious place to live.
 */
export function createLlmService(provider: LlmProvider, options: LlmServiceOptions): LlmService {
  return {
    async chatCompletion(body) {
      const request = parseChatCompletionRequest(body);
      return provider.chat(await withSystemPrompt(request, options.systemPromptFile));
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

async function withSystemPrompt(
  request: ChatCompletionRequest,
  systemPromptFile: string,
): Promise<ChatCompletionRequest> {
  const template = await readSystemPrompt(systemPromptFile);
  if (!template) return request;

  const requestSystemPrompt = request.messages
    .filter((message) => message.role === 'system')
    .map((message) => message.content)
    .join('\n\n');
  const nonSystemMessages = request.messages.filter((message) => message.role !== 'system');
  const systemPrompt = renderSystemPrompt(template, requestSystemPrompt);

  if (!systemPrompt.trim()) {
    return { ...request, messages: nonSystemMessages };
  }

  return {
    ...request,
    messages: [
      { role: 'system', content: systemPrompt },
      ...nonSystemMessages,
    ],
  };
}

async function readSystemPrompt(systemPromptFile: string): Promise<string | undefined> {
  try {
    const content = await readFile(systemPromptFile, 'utf8');
    return content.trim() ? content : undefined;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return undefined;
    }

    throw new ApiError({
      status: 500,
      type: 'internal_server_error',
      message: `Failed to read system prompt from ${systemPromptFile}.`,
      details: { path: systemPromptFile },
    });
  }
}

function renderSystemPrompt(template: string, requestSystemPrompt: string): string {
  if (template.includes(SYSTEM_PLACEHOLDER)) {
    return template.replaceAll(SYSTEM_PLACEHOLDER, requestSystemPrompt);
  }
  if (!requestSystemPrompt) {
    return template;
  }

  return [template, requestSystemPrompt].join('\n\n');
}

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

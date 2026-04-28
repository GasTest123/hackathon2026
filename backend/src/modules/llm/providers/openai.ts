import type { OpenAIConfig } from '../../../config';
import { ApiError, isRecord } from '../../../shared/http-error';
import { httpJson } from '../../../shared/http-client';
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  LlmProvider,
} from '../types';

/**
 * Thin pass-through to any OpenAI-compatible `/chat/completions` endpoint.
 * Provides a uniform {@link ApiError} shape for upstream failures.
 */
export class OpenAIProvider implements LlmProvider {
  readonly name = 'openai' as const;

  private readonly config: OpenAIConfig & { apiKey: string };

  constructor(config: OpenAIConfig) {
    if (!config.apiKey) {
      throw new ApiError({
        status: 500,
        type: 'missing_credentials',
        message: 'OPENAI_API_KEY is required when LLM_PROVIDER=openai.',
      });
    }
    this.config = { ...config, apiKey: config.apiKey };
  }

  get defaultModel() {
    return this.config.defaultModel;
  }

  listModels() {
    return this.config.defaultModel ? [this.config.defaultModel] : [];
  }

  async chat(input: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const body: ChatCompletionRequest = {
      ...input,
      model: input.model ?? this.config.defaultModel,
    };

    if (!body.model) {
      throw new ApiError({
        status: 400,
        type: 'validation_error',
        message:
          'OpenAI provider requires a model: pass `model` in the request body or set OPENAI_MODEL.',
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.config.apiKey}`,
    };
    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }
    if (this.config.project) {
      headers['OpenAI-Project'] = this.config.project;
    }

    const { status, ok, data } = await httpJson(
      `${this.config.baseUrl}/chat/completions`,
      { method: 'POST', headers, body: JSON.stringify(body) },
      { label: 'OpenAI', timeoutMs: this.config.timeoutMs },
    );

    if (!ok) {
      throw toOpenAIApiError(status, data);
    }
    return data as ChatCompletionResponse;
  }
}

function toOpenAIApiError(status: number, body: unknown) {
  const upstream = isRecord(body) && isRecord(body.error) ? body.error : undefined;
  const message =
    (upstream && typeof upstream.message === 'string' && upstream.message) ||
    `OpenAI API returned HTTP ${status}.`;
  const type =
    (upstream && typeof upstream.type === 'string' && upstream.type) ||
    (status === 401 ? 'unauthorized' : 'openai_api_error');
  const code =
    upstream && (typeof upstream.code === 'string' || typeof upstream.code === 'number')
      ? upstream.code
      : undefined;

  return new ApiError({
    status,
    type,
    message,
    code,
    details: body,
    retriable: status >= 500 || status === 429,
  });
}

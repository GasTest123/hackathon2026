export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  response_format?: ResponseFormat;
}

export type ResponseFormat =
  | { type: 'text' }
  | { type: 'json_object' }
  | {
      type: 'json_schema';
      json_schema: {
        name: string;
        description?: string;
        schema?: Record<string, unknown>;
        strict?: boolean;
      };
    };

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created?: number;
  model?: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

export type ProviderName = 'garena' | 'openai';

export interface LlmProvider {
  readonly name: ProviderName;
  readonly defaultModel?: string;
  chat(req: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  /**
   * Hook called once on server bootstrap. Garena uses it to warm the access
   * token cache and arm a refresh timer; providers without background work
   * can omit it.
   */
  start?(): void;
  stop?(): void;
  listModels?(): string[];
}

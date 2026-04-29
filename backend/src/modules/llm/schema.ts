import { t } from 'elysia';

import { ApiError, isRecord } from '../../shared/http-error';
import type { ChatCompletionRequest, ChatMessage, Role } from './types';

const VALID_ROLES = ['system', 'user', 'assistant'] as const satisfies readonly Role[];

export const RoleSchema = t.UnionEnum(VALID_ROLES);

export const ChatMessageSchema = t.Object({
  role: RoleSchema,
  content: t.String({ minLength: 1 }),
});

export const ChatCompletionRequestSchema = t.Object(
  {
    model: t.Optional(t.String({ minLength: 1 })),
    messages: t.Array(ChatMessageSchema, { minItems: 1 }),
    max_tokens: t.Optional(t.Integer({ minimum: 1 })),
    temperature: t.Optional(t.Number({ minimum: 0, maximum: 2 })),
    top_p: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
    stream: t.Optional(
      t.Boolean({
        description:
          'Streaming is not supported yet. Omit this field or pass false.',
      }),
    ),
  },
  { description: 'OpenAI-compatible non-streaming chat completion request.' },
);

export const ChatCompletionResponseSchema = t.Object(
  {
    id: t.String(),
    object: t.Literal('chat.completion'),
    created: t.Optional(t.Integer({ minimum: 0 })),
    model: t.Optional(t.String()),
    choices: t.Array(
      t.Object({
        index: t.Integer({ minimum: 0 }),
        message: t.Object({
          role: t.String(),
          content: t.Nullable(t.String()),
        }),
        finish_reason: t.Optional(t.Nullable(t.String())),
      }),
    ),
    usage: t.Optional(
      t.Object({
        prompt_tokens: t.Integer({ minimum: 0 }),
        completion_tokens: t.Integer({ minimum: 0 }),
        total_tokens: t.Integer({ minimum: 0 }),
      }),
    ),
  },
  { description: 'OpenAI-compatible non-streaming chat completion response.' },
);

export const ModelSchema = t.Object({
  id: t.String(),
  object: t.Literal('model'),
  created: t.Integer({ minimum: 0 }),
  owned_by: t.String(),
});

export const ModelsListResponseSchema = t.Object({
  object: t.Literal('list'),
  data: t.Array(ModelSchema),
});

/**
 * Parse and validate an OpenAI-compatible chat completion request body.
 * Rejects unsupported features (notably `stream:true`) and normalizes sampling
 * params. Throws {@link ApiError} on validation failure.
 */
export function parseChatCompletionRequest(body: unknown): ChatCompletionRequest {
  if (!isRecord(body)) {
    throw validationError('Request body must be a JSON object.');
  }

  if (body.stream === true) {
    throw new ApiError({
      status: 400,
      type: 'unsupported_parameter',
      message: 'Streaming responses are not supported yet; pass "stream":false or omit it.',
    });
  }

  if (!Array.isArray(body.messages)) {
    throw validationError('Field "messages" is required and must be an array.');
  }
  if (body.messages.length === 0) {
    throw validationError('Field "messages" cannot be empty.');
  }

  const messages = body.messages.map((entry, index) => parseMessage(entry, index));

  const model =
    typeof body.model === 'string' && body.model.trim() ? body.model.trim() : undefined;
  const max_tokens = parseOptionalPositiveInt(body.max_tokens, 'max_tokens');
  const temperature = parseOptionalNumberInRange(body.temperature, 'temperature', 0, 2);
  const top_p = parseOptionalNumberInRange(body.top_p, 'top_p', 0, 1);

  return { model, messages, max_tokens, temperature, top_p };
}

function parseMessage(value: unknown, index: number): ChatMessage {
  if (!isRecord(value)) {
    throw validationError(`messages[${index}] must be an object.`);
  }

  const role = value.role;
  if (typeof role !== 'string' || !VALID_ROLES.includes(role as Role)) {
    throw validationError(
      `messages[${index}].role must be one of: ${VALID_ROLES.join(', ')}.`,
    );
  }

  const content = value.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw validationError(`messages[${index}].content must be a non-empty string.`);
  }

  return { role: role as Role, content };
}

function parseOptionalPositiveInt(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0 ||
    !Number.isInteger(value)
  ) {
    throw validationError(`${field} must be a positive integer.`);
  }
  return value;
}

function parseOptionalNumberInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw validationError(`${field} must be a number within [${min}, ${max}].`);
  }
  return value;
}

function validationError(message: string) {
  return new ApiError({ status: 400, type: 'validation_error', message });
}

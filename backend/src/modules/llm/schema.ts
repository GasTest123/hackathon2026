import { ApiError, isRecord } from '../../shared/http-error';
import type { ChatCompletionRequest, ChatMessage, Role } from './types';

const VALID_ROLES: readonly Role[] = ['system', 'user', 'assistant'];

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

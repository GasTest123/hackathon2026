import { Elysia } from 'elysia';

import { ApiError, isRecord } from '../shared/http-error';

export function errorMiddleware() {
  return new Elysia({ name: 'error-middleware' }).onError(
    { as: 'global' },
    ({ code, error, set }) => {
      if (code === 'NOT_FOUND') {
        set.status = 404;
        return { message: 'Not Found' };
      }
      if (code === 'VALIDATION') {
        const target = validationTarget(error);
        const isResponseValidation = target === 'response';
        const status = isResponseValidation ? 500 : 400;
        set.status = status;
        return {
          error: {
            type: isResponseValidation ? 'internal_server_error' : 'validation_error',
            message: isResponseValidation ? 'Response validation failed.' : validationMessage(error),
            status,
            retriable: false,
            details: validationDetails(error),
          },
        };
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
    },
  );
}

function validationTarget(error: unknown) {
  return isRecord(error) && typeof error.type === 'string' ? error.type : undefined;
}

function validationMessage(error: unknown) {
  const first = firstValidationIssue(error);
  const message =
    first && typeof first.message === 'string'
      ? first.message
      : first && typeof first.summary === 'string'
        ? first.summary
        : undefined;
  const path = first && typeof first.path === 'string' ? first.path : undefined;

  if (message && path) {
    return `${message} at ${path}.`;
  }
  if (message) {
    return message;
  }
  return error instanceof Error ? error.message : 'Request validation failed.';
}

function validationDetails(error: unknown) {
  if (!isRecord(error) || !Array.isArray(error.all)) {
    return undefined;
  }

  return {
    on: validationTarget(error),
    issues: error.all.filter(isRecord).map((issue) => ({
      path: typeof issue.path === 'string' ? issue.path : undefined,
      message: typeof issue.message === 'string' ? issue.message : undefined,
      summary: typeof issue.summary === 'string' ? issue.summary : undefined,
    })),
  };
}

function firstValidationIssue(error: unknown) {
  if (!isRecord(error) || !Array.isArray(error.all)) return undefined;
  return error.all.find(isRecord);
}

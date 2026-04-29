import { t } from 'elysia';

export const ErrorResponseSchema = t.Object(
  {
    error: t.Object({
      message: t.String({ description: 'Human-readable error message.' }),
      type: t.String({ description: 'Stable machine-readable error type.' }),
      code: t.Optional(
        t.Nullable(
          t.Union([t.String(), t.Number()], { description: 'Provider-specific code.' }),
        ),
      ),
      status: t.Integer({ minimum: 100, maximum: 599 }),
      retriable: t.Boolean(),
      details: t.Optional(t.Any({ description: 'Optional upstream or validation details.' })),
    }),
  },
  { description: 'Standard API error envelope.' },
);

export const accessTokenSecurity = [{ accessToken: [] as string[] }];

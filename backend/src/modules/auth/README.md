# auth module

User-facing authentication (sessions, JWT, OAuth logins, etc.).

> Not to be confused with the `SERVER_API_KEY` bearer gate in
> `src/shared/bearer-guard.ts`, which protects our OpenAI-compatible API
> surface with a static bearer token or JWT access token. This module is
> about end-user sessions.

## Files

- `routes.ts` — `authRoutes({ db })` returns an Elysia plugin mounted under
  `/auth`. Currently `GET /auth/session` returns the current login state and
  `POST /auth/login` returns an access token for the submitted `email` and
  `deviceId`. `/auth/session` also accepts `SERVER_API_KEY` and returns a fixed
  service identity with a generated access token.
- `service.ts` — `createAuthService({ db })` builds the business layer (JWT
  issuance, session lookup). Placeholder for now.
- `schema.ts` — request validators returning typed DTOs, e.g.
  `parseLoginRequest(body)`.
- `index.ts` — barrel export.

## Intended endpoints (todo)

- `POST /auth/login`
- `POST /auth/logout`
- `GET  /auth/session`
- `POST /auth/refresh`

## Guidelines

- Register DB access through `src/db/` rather than reaching out to external
  clients directly.
- Reuse `ApiError` from `src/shared/http-error.ts` so responses share the same
  `{ error: { ... } }` envelope used by the LLM module.
- Keep handler code in this folder; cross-module state should go through
  explicit constructor arguments, not singletons.

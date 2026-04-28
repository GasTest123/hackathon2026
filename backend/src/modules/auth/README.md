# auth module

User-facing authentication (sessions, JWT, OAuth logins, etc.).

> Not to be confused with the `SERVER_API_KEY` bearer gate in
> `src/shared/bearer-guard.ts`, which protects our OpenAI-compatible API
> surface with a static bearer token. That guard is transport-level; this
> module is about end-users.

## Files

- `routes.ts` — `authRoutes({ db })` returns an Elysia plugin mounted under
  `/auth`. Currently `GET /auth/ping` is live and `POST /auth/login` calls the
  service (which throws `not_implemented` until the real flow lands).
- `service.ts` — `createAuthService({ db })` builds the business layer (JWT
  issuance, password hashing, session lookup). Placeholder for now.
- `schema.ts` — request validators returning typed DTOs, e.g.
  `parseLoginRequest(body)`.
- `index.ts` — barrel export.

## Intended endpoints (todo)

- `POST /auth/login`
- `POST /auth/logout`
- `GET  /auth/me`
- `POST /auth/refresh`

## Guidelines

- Register DB access through `src/db/` rather than reaching out to external
  clients directly.
- Reuse `ApiError` from `src/shared/http-error.ts` so responses share the same
  `{ error: { ... } }` envelope used by the LLM module.
- Keep handler code in this folder; cross-module state should go through
  explicit constructor arguments, not singletons.

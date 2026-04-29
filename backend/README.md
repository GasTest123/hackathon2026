# hackathon2026-backend

Elysia + Bun service that exposes an **OpenAI-compatible** `/v1/chat/completions`
endpoint backed by a pluggable LLM provider. Two providers ship out of the box:

- `garena` — Garena AI Agent Hackathon 2026 LLM (OAuth2 client_credentials, file-cached
  Access Token with scheduled refresh).
- `openai` — direct passthrough to OpenAI-compatible endpoints.

## Getting Started

```bash
cp .env.example .env
# fill in the credentials for the provider you want to use
bun install
bun run dev
```

Open http://localhost:3000/ and you should see the active provider in the
JSON response. Health probe lives at `/healthcheck`.

## Configuration

All configuration is via environment variables. See [`.env.example`](./.env.example)
for the full list. Key entries:

| Variable | Default | Notes |
|---|---|---|
| `LLM_PROVIDER` | `garena` | `garena` or `openai`. |
| `PORT` | `3000` | HTTP listen port. |
| `PREFIX` | `` | HTTP url prefix. |
| `SERVER_API_KEY` | unset | Optional. When set, LLM clients may send `Authorization: Bearer <SERVER_API_KEY>` or a JWT access token. |
| `JWT_SECRET` | unset | Secret used to sign and verify user access-token JWTs. May be empty for local development; use a strong secret in production. |
| `GARENA_API_ORIGIN` | — | Required when `GARENA_BASE_URL` is a relative path. |
| `GARENA_BASE_URL` | `/api/v1` | Use a full URL (`https://…/api/v1`) to skip `GARENA_API_ORIGIN`. |
| `GARENA_CLIENT_ID` / `GARENA_CLIENT_SECRET` | — | Required for the Garena provider. |
| `GARENA_MODEL` | unset | Default model when the request omits `model`. |
| `GARENA_HTTP_TIMEOUT_MS` | `620000` | Clamped to a minimum of 600000 (Garena gRPC limit). |
| `GARENA_TOKEN_CACHE_FILE` | `.cache/garena-access-token.json` | File path for the persistent token cache (mode `0600`). |
| `OPENAI_API_KEY` | — | Required for the OpenAI provider. |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Override for proxies / Azure-style hosts. |
| `OPENAI_MODEL` | unset | Default model when the request omits `model`. |
| `OPENAI_HTTP_TIMEOUT_MS` | `60000` | |

## API

### `POST /v1/chat/completions`

OpenAI-compatible request and response (non-streaming only). Example with the
Garena provider:

```bash
curl -sS http://localhost:3000/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "messages": [
      {"role": "system", "content": "你是一个有趣的 AI 分身"},
      {"role": "user", "content": "你好，介绍一下你自己"}
    ],
    "max_tokens": 256
  }'
```

The response uses the OpenAI shape:

```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "choices": [
    { "index": 0, "message": { "role": "assistant", "content": "..." }, "finish_reason": "stop" }
  ],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

The same call works against the OpenAI provider after switching
`LLM_PROVIDER=openai` and supplying `OPENAI_API_KEY` / `OPENAI_MODEL`. Use any
OpenAI SDK by pointing `baseURL` at `http://localhost:3000/v1`:

```ts
import OpenAI from 'openai';
const client = new OpenAI({ baseURL: 'http://localhost:3000/v1', apiKey: 'unused' });
await client.chat.completions.create({
  model: 'doubao-1-5-pro-32k-character',
  messages: [{ role: 'user', content: 'hi' }],
});
```

> Streaming is not implemented yet. Sending `"stream": true` returns HTTP 400.

### `GET /v1/models`

Lists model IDs advertised by the active provider. For Garena this is the
documented hackathon model list; for OpenAI it returns the configured default
(if any).

### Errors

All non-2xx responses use the OpenAI-style envelope:

```json
{
  "error": {
    "message": "...",
    "type": "validation_error",
    "code": null,
    "status": 400,
    "retriable": false
  }
}
```

## Garena Access Token lifecycle

On startup the service:

1. Reads `GARENA_TOKEN_CACHE_FILE` (default `.cache/garena-access-token.json`).
   If the cached token still has more than 60 seconds left, it is reused as-is.
2. Otherwise it calls `POST {GARENA_BASE_URL}/oauth/token` with
   `grant_type=client_credentials`, persists the result to disk (mode `0600`)
   and uses the new token.
3. Schedules a background refresh for `expiresAt - 60s`. Refresh failures are
   logged and retried after 30 seconds without affecting in-flight requests.

Business requests automatically attach `Authorization: Bearer <access_token>`.
On a `401 Unauthorized` from Garena, the provider refreshes once and retries
the original request transparently.

Because the cache file lives outside the process, restarting the server reuses
the previous token until it is close to expiry — no extra OAuth round-trip on
boot.

## Project layout

Code is sliced by feature. Each domain folder is self-contained and exposes
its public surface through `index.ts`; cross-module wiring happens only in
[`src/app.ts`](./src/app.ts) and [`src/index.ts`](./src/index.ts).

```
src/
  index.ts                 # bootstrap: loadConfig → createLlmProvider → buildApp → listen
  app.ts                   # Elysia app composition, root routes, onError envelope
  config.ts                # typed AppConfig parsed from process.env
  lib/                     # cross-cutting helpers, no feature dependencies
    http-error.ts          # ApiError class + isRecord helper
    http-client.ts         # httpJson(): timeout + JSON parsing + standard errors
    server-auth.ts         # requireLlmBearerAuth() beforeHandle for SERVER_API_KEY/JWT access tokens
  llm/                     # OpenAI-compatible chat API + provider abstraction
    index.ts               # barrel: createLlmProvider, llmRoutes, types
    routes.ts              # Elysia plugin: POST /v1/chat/completions, GET /v1/models
    schema.ts              # parseChatCompletionRequest (validation)
    types.ts               # LlmProvider, ChatMessage, ChatCompletion*
    providers/
      factory.ts           # dispatch on config.provider
      garena.ts            # OAuth + file-cached token + auto refresh + chat
      openai.ts            # pass-through to OpenAI-compatible upstream
  auth/                    # end-user auth module (currently stubbed)
    routes.ts              # Elysia plugin: GET /auth/session, POST /auth/login
    index.ts
    README.md
  db/                      # persistence module (currently stubbed)
    client.ts              # DbClient interface + createDbClient() stub
    index.ts
    README.md
```

### Adding a new API

1. Create `src/<feature>/` with at least `routes.ts` and `index.ts`.
2. Export an `Elysia` plugin factory from `routes.ts` that accepts its
   dependencies (provider, db, config) as explicit constructor arguments.
3. Register the plugin in [`src/app.ts`](./src/app.ts) via `.use(...)`.
4. Throw [`ApiError`](./src/lib/http-error.ts) to get the shared error
   envelope; the root `onError` handler will serialise it for you.

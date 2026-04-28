# db module

Persistence layer. Currently a stub: `createDbClient()` returns an object that
rejects any `query()` call with `ApiError{ type: 'not_implemented' }`, so route
handlers can already code against the interface.

## Files

- `client.ts` — exports the `DbClient` interface and `createDbClient()` stub.
- `index.ts` — barrel export.

## Adding a real driver

1. Pick a driver (e.g. `pg`, `bun:sqlite`, Cloudflare D1, etc.).
2. Implement `DbClient` in a new file such as `postgres-client.ts`.
3. Teach `createDbClient()` to pick the implementation, ideally driven by a
   new section in `src/config.ts` (for example `DATABASE_URL`).
4. Wire `client.connect()` / `client.close()` into the bootstrap in
   `src/index.ts` so connections are opened on startup and drained on
   `SIGINT` / `SIGTERM`.

## Guidelines

- Keep SQL / query-builder details in this folder. Callers should only see
  repository functions exposed via `src/db/index.ts`.
- Never import `src/auth/` or `src/llm/` from here; data access must stay
  leaf-level.
- Use `ApiError` from `src/shared/http-error.ts` for user-facing failures so
  the HTTP response envelope matches the rest of the service.

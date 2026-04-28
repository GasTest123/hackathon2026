import { ApiError } from '../shared/http-error';

/**
 * Very thin placeholder that encodes the shape other modules should code
 * against. Concrete drivers (Postgres, SQLite, KV, etc.) can implement this
 * interface; for now `createDbClient()` simply returns a stub that throws on
 * any query, so that callers that forget to wire a real driver fail loudly.
 */
export interface DbClient {
  readonly kind: 'stub' | 'postgres' | 'sqlite' | (string & {});
  /** Opens the connection / pool. Safe to call multiple times. */
  connect(): Promise<void>;
  /** Closes the connection / pool. Safe to call multiple times. */
  close(): Promise<void>;
  /**
   * Execute a parameterised SQL statement. Drivers may map `params` however
   * they like; the stub just rejects the call.
   */
  query<Row = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<Row[]>;
}

export function createDbClient(): DbClient {
  return {
    kind: 'stub',
    async connect() {
      /* nothing to do */
    },
    async close() {
      /* nothing to do */
    },
    async query() {
      throw new ApiError({
        status: 501,
        type: 'not_implemented',
        message: 'DB module is not implemented yet. Wire up a real driver in src/db/.',
      });
    },
  };
}

import { buildApp } from './app';
import { loadConfig } from './config';
import { createDbClient } from './db';
import { createLlmProvider } from './modules/llm';

const config = loadConfig();
const provider = createLlmProvider(config);
const db = createDbClient();

const app = buildApp({ config, provider, db }).listen(config.port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${config.port} ` +
    `(provider=${provider.name}` +
    (provider.defaultModel ? `, default model=${provider.defaultModel}` : '') +
    (config.serverApiKey ? ', server auth=on' : '') +
    `)`,
);

await db.connect();
provider.start?.();

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`[server] received ${signal}, shutting down`);
  try {
    provider.stop?.();
  } catch (error) {
    console.warn('[server] provider.stop() threw:', error);
  }
  void db
    .close()
    .catch((error) => {
      console.warn('[server] db.close() threw:', error);
    })
    .finally(() => {
      process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

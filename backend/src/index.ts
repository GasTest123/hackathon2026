import { Elysia } from 'elysia';

const PORT = process.env.PORT || 3000;

const apiHandler = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  return url.pathname + url.search;
};

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .group('/api', (app) =>
    app
      .all('', apiHandler)
      .all('/*', apiHandler)
  )
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${PORT}`
);

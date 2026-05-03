import { openapi } from '@elysia/openapi';

export function openapiMiddleware() {
  return openapi({
    path: '/doc',
    documentation: {
      info: {
        title: 'Hackathon 2026 Backend API',
        description: 'Elysia + Bun API server with OpenAI-compatible LLM endpoints.',
        version: '1.0.50',
      },
      tags: [
        { name: 'System', description: 'Service metadata and health checks.' },
        { name: 'Auth', description: 'User-facing authentication endpoints.' },
        { name: 'LLM', description: 'OpenAI-compatible LLM endpoints.' },
      ],
      components: {
        securitySchemes: {
          accessToken: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'Access Token / SERVER_API_KEY',
            description:
              'Use the JWT access token returned after login, or SERVER_API_KEY where allowed.',
          },
        },
      },
    },
    scalar: {
      authentication: {
        preferredSecurityScheme: 'accessToken',
        securitySchemes: {
          accessToken: {
            token: 'hackathon2026',
          },
        },
      },
    },
  });
}

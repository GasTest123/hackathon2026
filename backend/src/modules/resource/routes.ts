import { Elysia } from 'elysia';

import { readBearerToken } from '../../shared/bearer-guard';
import { accessTokenSecurity, ErrorResponseSchema } from '../../shared/schema';
import { resolveAuthSession } from '../auth';
import {
  ResourceDataSchema,
  ResourceNameParamsSchema,
  SaveResourceResponseSchema,
} from './schema';
import { createResourceService } from './service';

export interface ResourceRoutesOptions {
  dataDir: string;
  serverApiKey?: string;
  jwtSecret: string;
}

export function resourceRoutes({ dataDir, serverApiKey, jwtSecret }: ResourceRoutesOptions) {
  const service = createResourceService({ dataDir });

  return new Elysia({ name: 'resource' })
    .post(
      '/resource/:name',
      async ({ body, params, request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const result = await service.save(session.email, params.name, body);
        set.status = 200;
        return result;
      },
      {
        params: ResourceNameParamsSchema,
        body: ResourceDataSchema,
        response: {
          200: SaveResourceResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        detail: {
          tags: ['Resource'],
          summary: 'Save current user resource data',
          security: accessTokenSecurity,
        },
      },
    )
    .get(
      '/resource/:name',
      async ({ params, request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const resource = await service.get(session.email, params.name);
        set.status = 200;
        return resource;
      },
      {
        params: ResourceNameParamsSchema,
        response: {
          200: ResourceDataSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        detail: {
          tags: ['Resource'],
          summary: 'Get current user resource data',
          security: accessTokenSecurity,
        },
      },
    );
}

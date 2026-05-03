import { Elysia } from 'elysia';

import { readBearerToken } from '../../shared/bearer-guard';
import { accessTokenSecurity, ErrorResponseSchema } from '../../shared/schema';
import { resolveAuthSession } from '../auth';
import type { LlmProvider } from '../llm/types';
import {
  GenerateProfileResponseSchema,
  parseProfileData,
  ProfileDataSchema,
  ResetProfileResponseSchema,
  SaveProfileResponseSchema,
} from './schema';
import { createProfileService } from './service';

export interface ProfileRoutesOptions {
  dataDir: string;
  provider: LlmProvider;
  profileSystemPromptFile: string;
  profileUserPromptFile: string;
  serverApiKey?: string;
  jwtSecret: string;
}

export function profileRoutes({
  dataDir,
  provider,
  profileSystemPromptFile,
  profileUserPromptFile,
  serverApiKey,
  jwtSecret,
}: ProfileRoutesOptions) {
  const service = createProfileService({
    dataDir,
    provider,
    profileSystemPromptFile,
    profileUserPromptFile,
  });

  return new Elysia({ name: 'profile' })
    .post(
      '/profile',
      async ({ body, request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const data = parseProfileData(body);
        const result = await service.save(session.email, data);
        set.status = 200;
        return result;
      },
      {
        body: ProfileDataSchema,
        response: {
          200: SaveProfileResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        detail: {
          tags: ['Profile'],
          summary: 'Save current user profile',
          security: accessTokenSecurity,
        },
      },
    )
    .get(
      '/profile',
      async ({ request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const profile = await service.get(session.email);
        set.status = 200;
        return profile;
      },
      {
        response: {
          200: ProfileDataSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        detail: {
          tags: ['Profile'],
          summary: 'Get current user profile',
          security: accessTokenSecurity,
        },
      },
    )
    .post(
      '/profile/reset',
      async ({ request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const result = await service.reset(session.email);
        set.status = 200;
        return result;
      },
      {
        response: {
          200: ResetProfileResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
        detail: {
          tags: ['Profile'],
          summary: 'Reset current user profile data',
          security: accessTokenSecurity,
        },
      },
    )
    .post(
      '/profile/generate',
      async ({ request, set }) => {
        const session = resolveAuthSession(readBearerToken(request), { serverApiKey, jwtSecret });
        const result = await service.generate(session.email);
        set.status = 200;
        return result;
      },
      {
        response: {
          200: GenerateProfileResponseSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          500: ErrorResponseSchema,
          502: ErrorResponseSchema,
        },
        detail: {
          tags: ['Profile'],
          summary: 'Generate final profile',
          security: accessTokenSecurity,
        },
      },
    );
}

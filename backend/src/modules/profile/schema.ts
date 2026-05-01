import { t, type Static } from 'elysia';

import { ApiError, isRecord } from '../../shared/http-error';

export const ProfileDataSchema = t.Object(
  {},
  {
    description: 'User profile JSON object. Field names and values are not restricted.',
    additionalProperties: true,
    examples: [
      {
        profile: {
          email: 'hackathon2026@garena.com',
          deviceId: '00000000-0000-0000-0000-000000000000',
        },
        emotion_avatars: [
          {
            id: 0,
            name: '乐乐',
            level: 5,
            exp: 1250,
          },
          {
            id: 1,
            name: '忧忧',
            level: 8,
            exp: 4500,
          },
        ],
      },
    ],
  },
);

export const SaveProfileResponseSchema = t.Object({
  ok: t.Boolean(),
});

export const ResetProfileResponseSchema = t.Object({
  ok: t.Boolean(),
});

export type ProfileData = Record<string, unknown>;
export type SaveProfileResponse = Static<typeof SaveProfileResponseSchema>;
export type ResetProfileResponse = Static<typeof ResetProfileResponseSchema>;

export function parseProfileData(body: unknown): ProfileData {
  if (!isRecord(body)) {
    throw new ApiError({
      status: 400,
      type: 'validation_error',
      message: 'Request body must be a JSON object.',
    });
  }

  return body;
}

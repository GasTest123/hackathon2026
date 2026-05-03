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
            level: 8,
            exp: 800,
          },
          {
            id: 1,
            name: '丧丧',
            level: 1,
            exp: 100,
          },
          {
            id: 2,
            name: '怒怒',
            level: 2,
            exp: 200,
          },
          {
            id: 3,
            name: '哀哀',
            level: 3,
            exp: 300,
          },
          {
            id: 4,
            name: '稳稳',
            level: 5,
            exp: 500,
          },
          {
            id: 5,
            name: '冲冲',
            level: 6,
            exp: 600,
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

export const GenerateProfileResponseSchema = t.Object(
  {
    profile: t.String({
      description: 'Generated final profile in Markdown format.',
    }),
  },
  {
    examples: [
      {
        profile: [
          '# 用户画像',
          '',
          '## 基本倾向',
          '- 情绪表达积极，常用轻松、鼓励式语言回应日常压力。',
          '- 对陪伴感和即时反馈有较高需求，适合温暖但不冗长的互动。',
          '',
          '## 沟通建议',
          '- 优先使用具体、可执行的建议。',
          '- 在用户低落时先共情，再提供下一步行动。',
        ].join('\n'),
      },
    ],
  },
);

export type ProfileData = Record<string, unknown>;
export type SaveProfileResponse = Static<typeof SaveProfileResponseSchema>;
export type ResetProfileResponse = Static<typeof ResetProfileResponseSchema>;
export type GenerateProfileResponse = Static<typeof GenerateProfileResponseSchema>;

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

import { t, type Static } from 'elysia';

export const ResourceNameParamsSchema = t.Object({
  name: t.String({
    minLength: 1,
    pattern: '^[^/\\\\]+$',
    description: 'Resource name used in resource_{name}.json, for example "chat".',
    examples: ['chat'],
  }),
});

export const ResourceDataSchema = t.Object(
  {},
  {
    description: 'User-defined resource JSON object.',
    additionalProperties: true,
    examples: [
      {
        chat_history: [
          {
            message_id: 1,
            role: 'user',
            content: '闹钟响了，起床吧',
            timestamp: 111111111,
          },
          {
            message_id: 2,
            role: 'assistant',
            content: '又是新的一天，冲呀！',
            emotion_id: 0,
            is_me: true,
            not_me: false,
            timestamp: 111111112,
          },
          {
            message_id: 3,
            role: 'assistant',
            content: '还没睡够，想多懒一会。',
            emotion_id: 1,
            is_me: false,
            not_me: true,
            timestamp: 111111113,
          },
        ],
      },
    ],
  },
);

export const SaveResourceResponseSchema = t.Object({
  ok: t.Boolean(),
});

export type ResourceNameParams = Static<typeof ResourceNameParamsSchema>;
export type ResourceData = Record<string, unknown>;
export type SaveResourceResponse = Static<typeof SaveResourceResponseSchema>;

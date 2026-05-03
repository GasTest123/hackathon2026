import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { ApiError, isRecord } from '../../shared/http-error';
import type { LlmProvider } from '../llm/types';
import type {
  GenerateProfileResponse,
  ProfileData,
  ResetProfileResponse,
  SaveProfileResponse,
} from './schema';

const PROFILE_GENERATION_MAX_TOKENS = 8192;

export interface ProfileServiceDeps {
  dataDir: string;
  provider: LlmProvider;
  profileSystemPromptFile: string;
  profileUserPromptFile: string;
}

export interface ProfileService {
  save(email: string, data: ProfileData): Promise<SaveProfileResponse>;
  get(email: string): Promise<ProfileData>;
  reset(email: string): Promise<ResetProfileResponse>;
  generate(email: string): Promise<GenerateProfileResponse>;
}

export function createProfileService({
  dataDir,
  provider,
  profileSystemPromptFile,
  profileUserPromptFile,
}: ProfileServiceDeps): ProfileService {
  const rootDir = resolve(dataDir);

  return {
    async save(email: string, data: ProfileData) {
      const file = profileFilePath(rootDir, email);

      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify(data, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
      });

      return { ok: true };
    },

    async get(email: string) {
      const file = profileFilePath(rootDir, email);
      return readProfileFile(file);
    },

    async reset(email: string) {
      const dir = profileDirPath(rootDir, email);
      await rm(dir, { recursive: true, force: true });
      return { ok: true };
    },

    async generate(email: string) {
      const dir = profileDirPath(rootDir, email);
      const [profile, chatResource, systemPrompt, userPromptTemplate] = await Promise.all([
        readProfileFile(resolve(dir, 'profile.json')),
        readOptionalJsonObjectFile(resolve(dir, 'resource_chat.json'), 'resource_chat'),
        readPromptFile(profileSystemPromptFile, 'PROFILE_SYSTEM_PROMPT_FILE'),
        readPromptFile(profileUserPromptFile, 'PROFILE_USER_PROMPT_FILE'),
      ]);

      if (!userPromptTemplate.trim()) {
        throw new ApiError({
          status: 500,
          type: 'invalid_profile_prompt',
          message: 'PROFILE_USER_PROMPT_FILE must not be blank.',
          details: { path: profileUserPromptFile },
        });
      }

      const userPrompt = renderProfilePrompt(userPromptTemplate, profile, chatResource);
      await writeFile(resolve(dir, 'profile_input.md'), userPrompt, {
        encoding: 'utf8',
        mode: 0o600,
      });

      const messages = [
        ...(systemPrompt.trim() ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: userPrompt },
      ];
      const response = await provider.chat({
        messages,
        max_tokens: PROFILE_GENERATION_MAX_TOKENS,
      });
      const generatedProfile = response.choices[0]?.message?.content;

      if (typeof generatedProfile !== 'string') {
        throw new ApiError({
          status: 502,
          type: 'invalid_profile_generation_response',
          message: 'LLM response does not include a generated profile string.',
          details: response,
          retriable: true,
        });
      }

      await writeFile(resolve(dir, 'profile_output.md'), generatedProfile, {
        encoding: 'utf8',
        mode: 0o600,
      });

      return { profile: generatedProfile };
    },
  };
}

function profileFilePath(rootDir: string, email: string) {
  return resolve(profileDirPath(rootDir, email), 'profile.json');
}

function profileDirPath(rootDir: string, email: string) {
  if (!email || /[\\/]/.test(email) || email.includes('\0')) {
    throw new ApiError({
      status: 400,
      type: 'invalid_profile_owner',
      message: 'Access token email cannot be used as a profile directory.',
    });
  }

  const dir = resolve(rootDir, email);
  const prefix = rootDir.endsWith(sep) ? rootDir : `${rootDir}${sep}`;
  if (!dir.startsWith(prefix)) {
    throw new ApiError({
      status: 400,
      type: 'invalid_profile_owner',
      message: 'Access token email cannot be used as a profile directory.',
    });
  }

  return dir;
}

async function readProfileFile(file: string): Promise<ProfileData> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new ApiError({
        status: 404,
        type: 'profile_not_found',
        message: 'Profile does not exist.',
      });
    }
    throw error;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isJsonObject(parsed)) {
      throw new Error('Profile data must be a JSON object.');
    }
    return parsed;
  } catch (error) {
    throw new ApiError({
      status: 500,
      type: 'invalid_profile_data',
      message: error instanceof Error ? error.message : 'Profile data is invalid.',
    });
  }
}

async function readOptionalJsonObjectFile(
  file: string,
  label: string,
): Promise<Record<string, unknown>> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isJsonObject(parsed)) {
      throw new Error(`${label} data must be a JSON object.`);
    }
    return parsed;
  } catch (error) {
    throw new ApiError({
      status: 500,
      type: `invalid_${label}_data`,
      message: error instanceof Error ? error.message : `${label} data is invalid.`,
    });
  }
}

async function readPromptFile(file: string, configName: string): Promise<string> {
  try {
    return await readFile(file, 'utf8');
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new ApiError({
        status: 500,
        type: 'profile_prompt_not_found',
        message: `${configName} does not exist.`,
        details: { path: file },
      });
    }
    throw error;
  }
}

function renderProfilePrompt(
  template: string,
  profile: ProfileData,
  chatResource: Record<string, unknown>,
) {
  const replacements = buildPromptReplacements(profile, chatResource);
  return template.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match,
  );
}

function buildPromptReplacements(
  profile: ProfileData,
  chatResource: Record<string, unknown>,
) {
  const chatMessages = chatHistoryMessages(chatResource);
  const replacements: Record<string, string> = {
    profile: JSON.stringify(profile, null, 2),
    resource_chat: JSON.stringify(chatResource, null, 2),
    chat_history: formatChatHistory(chatMessages),
    my_message_ids: formatIds(
      explicitIds(chatResource, ['my_message_ids', 'user_message_ids']) ??
        collectMessageIds(chatMessages, isUserMessage),
    ),
    like_message_ids: formatIds(
      explicitIds(chatResource, ['like_message_ids', 'liked_message_ids']) ??
        collectMessageIds(chatMessages, (message) =>
          message.is_me === true || message.like === true || message.liked === true,
        ),
    ),
    unlike_message_ids: formatIds(
      explicitIds(chatResource, [
        'unlike_message_ids',
        'unliked_message_ids',
        'dislike_message_ids',
        'disliked_message_ids',
      ]) ??
        collectMessageIds(chatMessages, (message) =>
          message.not_me === true ||
          message.unlike === true ||
          message.unliked === true ||
          message.dislike === true ||
          message.disliked === true,
        ),
    ),
  };

  for (const [index, emotion] of emotionRecords(profile).entries()) {
    const id = promptValue(emotion.id) || String(index);
    for (const [key, value] of Object.entries(emotion)) {
      if (key === 'id') continue;
      replacements[`emotion_${id}_${key}`] = promptValue(value);
    }
  }

  return replacements;
}

function emotionRecords(profile: ProfileData) {
  const raw =
    (Array.isArray(profile.emotion_avatars) && profile.emotion_avatars) ||
    (Array.isArray(profile.emotions) && profile.emotions) ||
    [];
  return raw.filter(isJsonObject);
}

function chatHistoryMessages(chatResource: Record<string, unknown>) {
  return Array.isArray(chatResource.chat_history)
    ? chatResource.chat_history.filter(isJsonObject)
    : [];
}

function formatChatHistory(messages: Array<Record<string, unknown>>) {
  return messages
    .map((message) =>
      [
        promptValue(message.message_id),
        isUserMessage(message) ? '-' : promptValue(message.emotion_id),
        lineValue(message.content),
      ].join('|'),
    )
    .join('\n');
}

function isUserMessage(message: Record<string, unknown>) {
  return message.role === 'user';
}

function explicitIds(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.map(promptValue).filter(Boolean);
    }
    if (typeof value === 'string') {
      return value.split(',').map((entry) => entry.trim()).filter(Boolean);
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return [String(value)];
    }
  }

  return undefined;
}

function collectMessageIds(
  messages: Array<Record<string, unknown>>,
  predicate: (message: Record<string, unknown>) => boolean,
) {
  const ids: string[] = [];
  for (const message of messages) {
    if (!predicate(message)) continue;
    const id = promptValue(message.message_id);
    if (id) ids.push(id);
  }

  return ids;
}

function formatIds(ids: string[]) {
  return [...new Set(ids)].join(', ');
}

function lineValue(value: unknown) {
  return promptValue(value).replace(/\r?\n/g, ' ');
}

function promptValue(value: unknown) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value) ?? '';
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return isRecord(error) && typeof error.code === 'string';
}

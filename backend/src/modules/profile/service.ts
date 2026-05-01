import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { ApiError, isRecord } from '../../shared/http-error';
import type { ProfileData, ResetProfileResponse, SaveProfileResponse } from './schema';

export interface ProfileServiceDeps {
  dataDir: string;
}

export interface ProfileService {
  save(email: string, data: ProfileData): Promise<SaveProfileResponse>;
  get(email: string): Promise<ProfileData>;
  reset(email: string): Promise<ResetProfileResponse>;
}

export function createProfileService({ dataDir }: ProfileServiceDeps): ProfileService {
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
        if (!isRecord(parsed)) {
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
    },

    async reset(email: string) {
      const dir = profileDirPath(rootDir, email);
      await rm(dir, { recursive: true, force: true });
      return { ok: true };
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

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return isRecord(error) && typeof error.code === 'string';
}

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';

import { ApiError, isRecord } from '../../shared/http-error';
import type { ResourceData, SaveResourceResponse } from './schema';

export interface ResourceServiceDeps {
  dataDir: string;
}

export interface ResourceService {
  save(email: string, name: string, data: ResourceData): Promise<SaveResourceResponse>;
  get(email: string, name: string): Promise<ResourceData>;
}

export function createResourceService({ dataDir }: ResourceServiceDeps): ResourceService {
  const rootDir = resolve(dataDir);

  return {
    async save(email: string, name: string, data: ResourceData) {
      const file = resourceFilePath(rootDir, email, name);
      const serialized = serializeResourceData(data);

      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, serialized, {
        encoding: 'utf8',
        mode: 0o600,
      });

      return { ok: true };
    },

    async get(email: string, name: string) {
      const file = resourceFilePath(rootDir, email, name);

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
        if (!isRecord(parsed)) {
          throw new Error('Resource data must be a JSON object.');
        }
        return parsed;
      } catch (error) {
        throw new ApiError({
          status: 500,
          type: 'invalid_resource_data',
          message: error instanceof Error ? error.message : 'Resource data is invalid.',
        });
      }
    },
  };
}

function resourceFilePath(rootDir: string, email: string, name: string) {
  const dir = userDataDirPath(rootDir, email);
  assertResourceName(name);

  const file = resolve(dir, `resource_${name}.json`);
  const prefix = dir.endsWith(sep) ? dir : `${dir}${sep}`;
  if (!file.startsWith(prefix)) {
    throw invalidResourceName();
  }

  return file;
}

function userDataDirPath(rootDir: string, email: string) {
  if (!email || /[\\/]/.test(email) || email.includes('\0')) {
    throw new ApiError({
      status: 400,
      type: 'invalid_resource_owner',
      message: 'Access token email cannot be used as a resource directory.',
    });
  }

  const dir = resolve(rootDir, email);
  const prefix = rootDir.endsWith(sep) ? rootDir : `${rootDir}${sep}`;
  if (!dir.startsWith(prefix)) {
    throw new ApiError({
      status: 400,
      type: 'invalid_resource_owner',
      message: 'Access token email cannot be used as a resource directory.',
    });
  }

  return dir;
}

function assertResourceName(name: string) {
  if (!name || /[\\/]/.test(name) || name.includes('\0')) {
    throw invalidResourceName();
  }
}

function invalidResourceName() {
  return new ApiError({
    status: 400,
    type: 'invalid_resource_name',
    message: 'Resource name cannot be used as a file name.',
  });
}

function serializeResourceData(data: ResourceData) {
  const serialized = JSON.stringify(data, null, 2);
  if (serialized === undefined) {
    throw new ApiError({
      status: 400,
      type: 'validation_error',
      message: 'Request body must be valid JSON data.',
    });
  }

  return serialized;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return isRecord(error) && typeof error.code === 'string';
}

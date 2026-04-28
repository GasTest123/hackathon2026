import type { AppConfig } from '../../../config';
import type { LlmProvider } from '../types';
import { GarenaProvider } from './garena';
import { OpenAIProvider } from './openai';

export function createLlmProvider(config: AppConfig): LlmProvider {
  switch (config.provider) {
    case 'garena':
      return new GarenaProvider(config.garena);
    case 'openai':
      return new OpenAIProvider(config.openai);
  }
}

import { AppConfig } from './config';

/**
 * Default configuration values for the application
 */
export const defaultConfig: AppConfig = {
  api: {
    audnexus: {
      url: 'https://api.audnex.us',
      version: 'v1',
      key: undefined,
      rateLimitPerMinute: 100,
    },
  },
  logging: {
    level: 'info',
    file: 'logs/audiobook-tagger.log',
  },
  app: {
    outputDir: './output',
  },
};

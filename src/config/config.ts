import { defaultConfig } from './default';
import { logger, updateLoggerConfig } from '../utils/logger';

export interface AppConfig {
    api: {
        audnexus: {
            url: string;
            version: string;
            key?: string;
            rateLimitPerMinute: number;
        };
    };
    logging: {
        level: string;
        file: string;
    };
    app: {
        outputDir: string;
    };
}

/**
 * Get application configuration by merging defaults with environment variables
 * @returns The application configuration
 */
export function getConfig(): AppConfig {
    try {
        // Start with the default configuration
        const config: AppConfig = { ...defaultConfig };

        // Override with environment variables if they exist
        if (process.env.AUDNEXUS_API_URL) {
            config.api.audnexus.url = process.env.AUDNEXUS_API_URL;
        }

        if (process.env.AUDNEXUS_API_VERSION) {
            config.api.audnexus.version = process.env.AUDNEXUS_API_VERSION;
        }

        if (process.env.AUDNEXUS_API_KEY) {
            config.api.audnexus.key = process.env.AUDNEXUS_API_KEY;
        }

        if (process.env.LOG_LEVEL) {
            config.logging.level = process.env.LOG_LEVEL;
        }

        if (process.env.LOG_FILE) {
            config.logging.file = process.env.LOG_FILE;
        }

        if (process.env.DEFAULT_OUTPUT_DIR) {
            config.app.outputDir = process.env.DEFAULT_OUTPUT_DIR;
        }

        // Update logger configuration with values from config
        updateLoggerConfig(config.logging.level, config.logging.file);

        // Validate critical config options
        if (!config.api.audnexus.url) {
            logger.warn('AUDNEXUS_API_URL is not set. Using default URL.');
        }

        if (!config.api.audnexus.key) {
            logger.warn('AUDNEXUS_API_KEY is not set. API requests may be limited.');
        }

        return config;
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error loading configuration: ${error.message}`);
        } else {
            logger.error(`Unknown error loading configuration: ${error}`);
        }
        // Return default config in case of error
        return defaultConfig;
    }
}
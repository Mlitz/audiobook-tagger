import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Default log settings (can be overridden by config later)
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_LOG_FILE = 'logs/audiobook-tagger.log';

// Ensure log directory exists
const logDir = path.dirname(DEFAULT_LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Create custom format
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf((info) => {
        return `${info.timestamp} ${info.level.toUpperCase()}: ${info.message}`;
    })
);

// Create file transport
const fileTransport = new winston.transports.File({
    filename: DEFAULT_LOG_FILE,
    level: DEFAULT_LOG_LEVEL
});

// Create console transport with colors
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => {
            return `${info.level}: ${info.message}`;
        })
    )
});

// Create logger
export const logger = winston.createLogger({
    level: DEFAULT_LOG_LEVEL,
    format: customFormat,
    transports: [
        fileTransport,
        consoleTransport
    ],
    exceptionHandlers: [
        fileTransport,
        consoleTransport
    ],
    exitOnError: false,
});

// Update logger configuration with values from config (can be called later)
export function updateLoggerConfig(level?: string, file?: string): void {
    if (level) {
        logger.level = level;
        fileTransport.level = level;
    }

    if (file && file !== DEFAULT_LOG_FILE) {
        // Remove old file transport
        logger.remove(fileTransport);

        // Create new file transport with updated path
        const newDir = path.dirname(file);
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
        }

        const newFileTransport = new winston.transports.File({
            filename: file,
            level: level || DEFAULT_LOG_LEVEL
        });

        // Add new file transport
        logger.add(newFileTransport);
    }

    logger.debug('Logger configuration updated');
}

// Log startup message
logger.debug('Logger initialized with default settings');
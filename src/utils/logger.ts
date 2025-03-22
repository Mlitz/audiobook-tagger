import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { getConfig } from '../config/config';

// Get configuration
const config = getConfig();

// Ensure log directory exists
const logDir = path.dirname(config.logging.level);
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
  filename: config.logging.file,
  level: config.logging.level
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
  level: config.logging.level,
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

// Log startup message
logger.debug('Logger initialized');

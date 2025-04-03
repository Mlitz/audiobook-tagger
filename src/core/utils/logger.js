const { app } = require('electron');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Initialize logger
let logger;

/**
 * Initialize and configure the application logger
 * @param {string} moduleName - Name of the module for logging context
 * @param {Object} options - Logger configuration options
 * @returns {winston.Logger} - Configured logger instance
 */
function configureLogger(moduleName, options = {}) {
    // If logger is already initialized and no module name is provided, return existing logger
    if (logger && !moduleName) {
        return logger;
    }

    // Get user data path for log file storage
    const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
    const logPath = path.join(userDataPath, 'logs');

    // Create logs directory if it doesn't exist
    try {
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, { recursive: true });
        }
    } catch (error) {
        console.error('Failed to create logs directory:', error);
    }

    // Configure log file paths
    const logFile = path.join(logPath, 'audiobook-tagger.log');
    const errorLogFile = path.join(logPath, 'error.log');

    // Custom log format
    const logFormat = winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
    );

    // Output format for console
    const consoleFormat = winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
            format: 'HH:mm:ss'
        }),
        winston.format.printf(({ level, message, timestamp, module, ...meta }) => {
            const moduleInfo = module || moduleName || 'app';
            let metaStr = '';

            // Format metadata if present, excluding stack traces
            if (Object.keys(meta).length > 0) {
                // Handle error objects specially
                if (meta.error) {
                    if (typeof meta.error === 'object') {
                        metaStr = ` ${meta.error.message || meta.error}`;
                    } else {
                        metaStr = ` ${meta.error}`;
                    }
                } else {
                    // For other metadata, create a summarized version
                    const metaObj = { ...meta };
                    delete metaObj.stack; // Remove stack trace for console output

                    if (Object.keys(metaObj).length > 0) {
                        // Serialize to a short representation
                        try {
                            metaStr = ` ${JSON.stringify(metaObj)}`;
                            if (metaStr.length > 100) {
                                metaStr = `${metaStr.substring(0, 100)}...`;
                            }
                        } catch (e) {
                            metaStr = ' [Complex metadata]';
                        }
                    }
                }
            }

            return `${timestamp} ${level} [${moduleInfo}]: ${message}${metaStr}`;
        })
    );

    // Create logger instance
    const loggerInstance = winston.createLogger({
        level: options.level || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
        defaultMeta: { module: moduleName },
        transports: [
            // Console transport
            new winston.transports.Console({
                format: consoleFormat
            }),

            // File transport for all logs
            new winston.transports.File({
                filename: logFile,
                format: logFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                tailable: true
            }),

            // Separate file for error logs
            new winston.transports.File({
                filename: errorLogFile,
                level: 'error',
                format: logFormat,
                maxsize: 5 * 1024 * 1024, // 5MB
                maxFiles: 5,
                tailable: true
            })
        ]
    });

    // If this is the first configuration, set as the default logger
    if (!logger) {
        logger = loggerInstance;
    }

    // For module-specific configuration, return that instance
    if (moduleName) {
        return loggerInstance;
    }

    return logger;
}

/**
 * Creates a child logger with a specific module context
 * @param {string} moduleName - Name of the module
 * @returns {winston.Logger} - Logger configured for the module
 */
function getModuleLogger(moduleName) {
    // Ensure main logger is initialized
    if (!logger) {
        configureLogger('app');
    }

    return logger.child({ module: moduleName });
}

/**
 * Gets the default logger instance
 * @returns {winston.Logger} - The default logger
 */
function getLogger() {
    // Initialize logger if not already done
    if (!logger) {
        configureLogger('app');
    }

    return logger;
}

// Export both configuration function and default logger
module.exports = {
    configureLogger,
    getModuleLogger,
    get logger() {
        return getLogger();
    }
};
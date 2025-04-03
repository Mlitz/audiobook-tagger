const { app } = require('electron');
const { BaseError } = require('./baseError');
const { ApiError } = require('./apiErrors');
const { logger } = require('../core/utils/logger');

/**
 * Central error handling system for the application
 * Provides consistent error handling, logging, and recovery options
 */

/**
 * Set up global error handlers for the application
 */
function setupErrorHandling() {
    // Register global process error handlers
    process.on('uncaughtException', handleUncaughtException);
    process.on('unhandledRejection', handleUnhandledRejection);

    logger.info('Global error handlers registered');
}

/**
 * Handle uncaught exceptions in the main process
 * @param {Error} error - The uncaught exception
 */
function handleUncaughtException(error) {
    logger.error('Uncaught exception in main process', {
        error: formatError(error),
        stack: error.stack
    });

    // In production, we might want to show a dialog to the user
    // and gracefully exit the application
    if (process.env.NODE_ENV === 'production') {
        // TODO: Show error dialog to user
        // app.exit(1);
    }
}

/**
 * Handle unhandled promise rejections in the main process
 * @param {Error} reason - The rejection reason
 * @param {Promise} promise - The rejected promise
 */
function handleUnhandledRejection(reason, promise) {
    logger.error('Unhandled promise rejection', {
        reason: formatError(reason),
        stack: reason.stack
    });

    // In production, we might want to show a dialog to the user
    // depending on the severity of the rejection
}

/**
 * Handle errors from specific application domains
 * @param {Error} error - The error to handle
 * @param {Object} options - Handler options
 * @param {string} options.context - Context where the error occurred
 * @param {Function} [options.onError] - Optional callback for custom handling
 * @returns {Error} - The processed error
 */
function handleError(error, options = {}) {
    const { context = 'application', onError } = options;

    // Log the error with context
    logger.error(`Error in ${context}`, {
        error: formatError(error),
        stack: error.stack
    });

    // Call custom error handler if provided
    if (typeof onError === 'function') {
        onError(error);
    }

    return error;
}

/**
 * Format error for logging, ensuring consistent error representation
 * @param {Error} error - The error to format
 * @returns {Object} - Formatted error info for logging
 */
function formatError(error) {
    if (!error) {
        return { message: 'Unknown error' };
    }

    // If error is already an object but not an Error instance
    if (typeof error === 'object' && !(error instanceof Error)) {
        return {
            message: error.message || 'Unknown error',
            ...error
        };
    }

    // For Error instances
    const formatted = {
        message: error.message || 'Unknown error',
        name: error.name || 'Error'
    };

    // Include additional properties for our custom error types
    if (error instanceof BaseError) {
        formatted.code = error.code;
        formatted.details = error.details;
    }

    if (error instanceof ApiError) {
        formatted.statusCode = error.statusCode;
        formatted.endpoint = error.endpoint;
        formatted.responseData = error.responseData;
    }

    return formatted;
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Object} options - Error handling options
 * @param {string} options.context - Error context
 * @param {Function} [options.onError] - Custom error handler
 * @returns {Function} - Wrapped function with error handling
 */
function withErrorHandling(fn, options = {}) {
    return async function (...args) {
        try {
            return await fn(...args);
        } catch (error) {
            handleError(error, options);
            throw error; // Re-throw to allow caller to handle
        }
    };
}

/**
 * Create an error handler for a specific context
 * @param {string} context - Context for the handler
 * @returns {Object} - Error handler methods for the context
 */
function createContextErrorHandler(context) {
    return {
        /**
         * Handle an error in this context
         * @param {Error} error - Error to handle
         * @param {Object} [options] - Additional options
         * @returns {Error} - The processed error
         */
        handle: (error, options = {}) => handleError(error, { context, ...options }),

        /**
         * Wrap an async function with error handling for this context
         * @param {Function} fn - Async function to wrap
         * @param {Object} [options] - Additional options
         * @returns {Function} - Wrapped function
         */
        withHandling: (fn, options = {}) => withErrorHandling(fn, { context, ...options })
    };
}

module.exports = {
    setupErrorHandling,
    handleError,
    formatError,
    withErrorHandling,
    createContextErrorHandler
};
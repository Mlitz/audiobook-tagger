/**
 * Errors module
 * Exports error classes and error handling utilities
 */

const { BaseError } = require('./baseError');
const {
    ApiError,
    NetworkError,
    TimeoutError,
    AbortError,
    MetadataNotFoundError
} = require('./apiErrors');
const {
    setupErrorHandling,
    handleError,
    withErrorHandling,
    createContextErrorHandler
} = require('./handler');

module.exports = {
    // Error classes
    BaseError,
    ApiError,
    NetworkError,
    TimeoutError,
    AbortError,
    MetadataNotFoundError,

    // Error handling utilities
    setupErrorHandling,
    handleError,
    withErrorHandling,
    createContextErrorHandler
};
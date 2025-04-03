const { BaseError } = require('./baseError');

/**
 * Error class for API-related errors
 * Extends BaseError with API-specific properties
 */
class ApiError extends BaseError {
    /**
     * Create a new ApiError
     * @param {string} message - Error message
     * @param {number} [statusCode=0] - HTTP status code if applicable
     * @param {Object} [responseData={}] - Response data from the API
     * @param {string} [endpoint=''] - API endpoint that caused the error
     * @param {string} [code='API_ERROR'] - Error code
     */
    constructor(message, statusCode = 0, responseData = {}, endpoint = '', code = 'API_ERROR') {
        // Create details object with API-specific information
        const details = {
            statusCode,
            endpoint,
            responseData
        };

        // Call parent constructor
        super(message, code, details);

        // Add convenient properties
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.responseData = responseData;
    }

    /**
     * Get a user-friendly error message
     * @returns {string} - Human-readable error message
     */
    getUserMessage() {
        // For common HTTP errors, provide more user-friendly messages
        if (this.statusCode) {
            switch (this.statusCode) {
                case 400:
                    return `Bad request: ${this.message}`;
                case 401:
                    return 'Authentication required. Please check your API credentials.';
                case 403:
                    return 'You don\'t have permission to access this resource.';
                case 404:
                    return `The requested resource was not found: ${this.endpoint}`;
                case 429:
                    return 'Rate limit exceeded. Please try again later.';
                case 500:
                case 502:
                case 503:
                case 504:
                    return 'The server encountered an error. Please try again later.';
                default:
                    if (this.statusCode >= 400 && this.statusCode < 500) {
                        return `Client error (${this.statusCode}): ${this.message}`;
                    } else if (this.statusCode >= 500) {
                        return `Server error (${this.statusCode}): ${this.message}`;
                    }
            }
        }

        return this.message;
    }

    /**
     * Check if the error is a network connectivity issue
     * @returns {boolean} - Whether the error is a network issue
     */
    isNetworkError() {
        return this.code === 'NETWORK_ERROR' ||
            this.code === 'ECONNREFUSED' ||
            this.code === 'ECONNABORTED' ||
            this.code === 'ETIMEDOUT';
    }

    /**
     * Check if the error is a server error
     * @returns {boolean} - Whether the error is a server error
     */
    isServerError() {
        return this.statusCode >= 500;
    }

    /**
     * Check if the error is a client error
     * @returns {boolean} - Whether the error is a client error
     */
    isClientError() {
        return this.statusCode >= 400 && this.statusCode < 500;
    }

    /**
     * Check if the error is due to rate limiting
     * @returns {boolean} - Whether the error is due to rate limiting
     */
    isRateLimited() {
        return this.statusCode === 429;
    }

    /**
     * Check if the error is due to a not found resource
     * @returns {boolean} - Whether the error is a not found error
     */
    isNotFound() {
        return this.statusCode === 404;
    }

    /**
     * Check if the error is due to authentication issues
     * @returns {boolean} - Whether the error is an auth error
     */
    isAuthError() {
        return this.statusCode === 401 || this.statusCode === 403;
    }

    /**
     * Check if the error is retryable
     * @returns {boolean} - Whether the request should be retried
     */
    isRetryable() {
        // Server errors and some network errors are retryable
        return this.isServerError() ||
            this.isNetworkError() ||
            this.statusCode === 429; // Rate limiting is retryable after delay
    }
}

/**
 * Error for connection/network issues
 */
class NetworkError extends ApiError {
    /**
     * Create a new NetworkError
     * @param {string} message - Error message
     * @param {Object} [details={}] - Additional error details
     */
    constructor(message, details = {}) {
        super(message, 0, details, '', 'NETWORK_ERROR');
    }
}

/**
 * Error for timeouts in API requests
 */
class TimeoutError extends ApiError {
    /**
     * Create a new TimeoutError
     * @param {string} message - Error message
     * @param {string} [endpoint=''] - API endpoint that timed out
     */
    constructor(message, endpoint = '') {
        super(
            message || 'Request timed out',
            0,
            { timeout: true },
            endpoint,
            'TIMEOUT_ERROR'
        );
    }

    /**
     * Get a user-friendly error message
     * @returns {string} - Human-readable error message
     */
    getUserMessage() {
        return 'The request timed out. Please check your internet connection and try again.';
    }
}

/**
 * Error for when an API request is aborted
 */
class AbortError extends ApiError {
    /**
     * Create a new AbortError
     * @param {string} message - Error message
     * @param {string} [endpoint=''] - API endpoint that was aborted
     */
    constructor(message, endpoint = '') {
        super(
            message || 'Request aborted',
            0,
            { aborted: true },
            endpoint,
            'ABORT_ERROR'
        );
    }

    /**
     * Get a user-friendly error message
     * @returns {string} - Human-readable error message
     */
    getUserMessage() {
        return 'The request was cancelled.';
    }
}

/**
 * Error for when no metadata is found
 */
class MetadataNotFoundError extends ApiError {
    /**
     * Create a new MetadataNotFoundError
     * @param {string} query - The search query that failed
     * @param {string} [endpoint=''] - API endpoint
     */
    constructor(query, endpoint = '') {
        super(
            `No metadata found for: ${query}`,
            404,
            { query },
            endpoint,
            'METADATA_NOT_FOUND'
        );

        this.query = query;
    }

    /**
     * Get a user-friendly error message
     * @returns {string} - Human-readable error message
     */
    getUserMessage() {
        return `No metadata could be found for: ${this.query}`;
    }
}

module.exports = {
    ApiError,
    NetworkError,
    TimeoutError,
    AbortError,
    MetadataNotFoundError
};
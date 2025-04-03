const axios = require('axios');
const { ApiError } = require('../../errors/apiErrors');
const { logger } = require('../../core/utils/logger');

/**
 * Base API Client class that handles common API client functionality
 * This serves as the foundation for all API integrations
 */
class BaseApiClient {
    /**
     * Create a new BaseApiClient
     * @param {Object} config - Client configuration
     * @param {string} config.baseUrl - Base URL for API
     * @param {Object} config.headers - Default headers
     * @param {number} config.timeout - Request timeout in ms
     * @param {Object} config.options - Additional client options
     */
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || '';
        this.defaultHeaders = config.headers || {};
        this.timeout = config.timeout || 30000; // Default 30 second timeout
        this.retryCount = config.retryCount || 3;
        this.retryDelay = config.retryDelay || 1000;

        // Create axios instance with default configuration
        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: this.defaultHeaders
        });

        // Set up request/response interceptors
        this._setupInterceptors();

        logger.info('BaseApiClient initialized', {
            baseUrl: this.baseUrl,
            timeout: this.timeout
        });
    }

    /**
     * Set up axios interceptors for request/response handling
     * @private
     */
    _setupInterceptors() {
        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Log outgoing requests (sanitize sensitive info)
                const logData = {
                    url: config.url,
                    method: config.method,
                    params: this._sanitizeParams(config.params)
                };

                logger.debug('API request', logData);
                return config;
            },
            (error) => {
                logger.error('API request error', { error: error.message });
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => {
                // Log successful responses
                logger.debug('API response received', {
                    url: response.config.url,
                    status: response.status,
                    dataSize: response.data ? JSON.stringify(response.data).length : 0
                });

                return response;
            },
            (error) => {
                // Transform and log error responses
                return this._handleRequestError(error);
            }
        );
    }

    /**
     * Handle request errors, transforming them into standardized ApiError instances
     * @param {Error} error - The error that occurred
     * @returns {Promise<Error>} - Rejected promise with transformed error
     * @private
     */
    _handleRequestError(error) {
        let apiError;

        if (error.response) {
            // Server responded with non-2xx status
            const { status, data, statusText } = error.response;

            logger.error('API error response', {
                url: error.config.url,
                status,
                statusText,
                data: this._sanitizeErrorData(data)
            });

            apiError = new ApiError(
                data?.message || statusText || `API Error: ${status}`,
                status,
                data,
                error.config.url
            );
        } else if (error.request) {
            // Request made but no response received
            logger.error('API no response', {
                url: error.config.url,
                message: error.message
            });

            apiError = new ApiError(
                'No response received from server',
                0,
                { original: error.message },
                error.config.url
            );
        } else {
            // Error setting up request
            logger.error('API request setup error', {
                message: error.message
            });

            apiError = new ApiError(
                error.message,
                0,
                { original: error.message }
            );
        }

        return Promise.reject(apiError);
    }

    /**
     * Sanitize request parameters for logging (remove sensitive data)
     * @param {Object} params - Request parameters
     * @returns {Object} - Sanitized parameters
     * @private
     */
    _sanitizeParams(params) {
        if (!params) return params;

        // Create a copy to avoid modifying the original
        const sanitized = { ...params };

        // List of param names that might contain sensitive data
        const sensitiveParams = ['apiKey', 'token', 'password', 'secret', 'auth'];

        // Replace sensitive values with [REDACTED]
        sensitiveParams.forEach(param => {
            if (sanitized[param]) {
                sanitized[param] = '[REDACTED]';
            }
        });

        return sanitized;
    }

    /**
     * Sanitize error data for logging (truncate large responses)
     * @param {any} data - Error response data
     * @returns {any} - Sanitized data
     * @private
     */
    _sanitizeErrorData(data) {
        if (!data) return data;

        // If data is a string and too large, truncate it
        if (typeof data === 'string' && data.length > 500) {
            return `${data.substring(0, 500)}... [truncated]`;
        }

        // If data is an object, stringify it first (with limited size)
        if (typeof data === 'object') {
            try {
                const json = JSON.stringify(data);
                if (json.length > 1000) {
                    return JSON.parse(`${json.substring(0, 1000)}... [truncated]`);
                }
            } catch (e) {
                // If stringification fails, return a simplified object
                return { error: 'Error data could not be serialized' };
            }
        }

        return data;
    }

    /**
     * Make a GET request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} [params={}] - Query parameters
     * @param {Object} [config={}] - Additional axios config
     * @returns {Promise<any>} - Resolved with response data
     */
    async get(endpoint, params = {}, config = {}) {
        try {
            const response = await this.client.get(endpoint, {
                params,
                ...config
            });

            return response.data;
        } catch (error) {
            // If the error is already an ApiError, just rethrow it
            if (error instanceof ApiError) {
                throw error;
            }

            // Otherwise, wrap it in an ApiError
            throw new ApiError(
                error.message,
                error.status || 0,
                error.data || {},
                endpoint
            );
        }
    }

    /**
     * Make a POST request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} [data={}] - Request body
     * @param {Object} [config={}] - Additional axios config
     * @returns {Promise<any>} - Resolved with response data
     */
    async post(endpoint, data = {}, config = {}) {
        try {
            const response = await this.client.post(endpoint, data, config);
            return response.data;
        } catch (error) {
            // If the error is already an ApiError, just rethrow it
            if (error instanceof ApiError) {
                throw error;
            }

            // Otherwise, wrap it in an ApiError
            throw new ApiError(
                error.message,
                error.status || 0,
                error.data || {},
                endpoint
            );
        }
    }

    /**
     * Make a PUT request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} [data={}] - Request body
     * @param {Object} [config={}] - Additional axios config
     * @returns {Promise<any>} - Resolved with response data
     */
    async put(endpoint, data = {}, config = {}) {
        try {
            const response = await this.client.put(endpoint, data, config);
            return response.data;
        } catch (error) {
            // If the error is already an ApiError, just rethrow it
            if (error instanceof ApiError) {
                throw error;
            }

            // Otherwise, wrap it in an ApiError
            throw new ApiError(
                error.message,
                error.status || 0,
                error.data || {},
                endpoint
            );
        }
    }

    /**
     * Make a DELETE request to the API
     * @param {string} endpoint - API endpoint
     * @param {Object} [config={}] - Additional axios config
     * @returns {Promise<any>} - Resolved with response data
     */
    async delete(endpoint, config = {}) {
        try {
            const response = await this.client.delete(endpoint, config);
            return response.data;
        } catch (error) {
            // If the error is already an ApiError, just rethrow it
            if (error instanceof ApiError) {
                throw error;
            }

            // Otherwise, wrap it in an ApiError
            throw new ApiError(
                error.message,
                error.status || 0,
                error.data || {},
                endpoint
            );
        }
    }

    /**
     * Close the API client and clean up resources
     */
    close() {
        // Cancel any pending requests
        // Note: axios doesn't have a built-in close method, but we might
        // want to cancel pending requests or clean up other resources
        logger.info('API client closed');
    }
}

module.exports = { BaseApiClient };
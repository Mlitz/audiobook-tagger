/**
 * Base utilities for handling API endpoints
 */

/**
 * Creates an endpoint builder for a specific API
 * @param {string} basePathOrFn - Base path string or function that returns base path
 * @returns {Function} - Endpoint builder function
 */
function createEndpointBuilder(basePathOrFn) {
    const getBasePath = typeof basePathOrFn === 'function'
        ? basePathOrFn
        : () => basePathOrFn;

    /**
     * Builds a complete endpoint URL
     * @param {string} path - Endpoint path (will be appended to base path)
     * @param {Object} [params={}] - Path parameters to replace
     * @returns {string} - Complete endpoint URL
     */
    return function buildEndpoint(path, params = {}) {
        let processedPath = path;

        // Replace path parameters (e.g., :id, :name)
        Object.entries(params).forEach(([key, value]) => {
            processedPath = processedPath.replace(
                new RegExp(`:${key}`, 'g'),
                encodeURIComponent(value)
            );
        });

        // Combine base path and processed path
        return `${getBasePath()}${processedPath}`;
    };
}

/**
 * Creates a set of endpoint builders for a specific API
 * @param {Object} endpointConfig - Configuration object with endpoint definitions
 * @param {string|Function} basePath - Base path or function that returns base path
 * @returns {Object} - Object with endpoint builder functions
 */
function createEndpoints(endpointConfig, basePath) {
    const buildEndpoint = createEndpointBuilder(basePath);
    const endpoints = {};

    // Create endpoint builders for each defined endpoint
    Object.entries(endpointConfig).forEach(([name, path]) => {
        endpoints[name] = (params) => buildEndpoint(path, params);
    });

    return endpoints;
}

/**
 * Validates a URL to ensure it's properly formatted
 * @param {string} url - URL to validate
 * @returns {boolean} - Whether URL is valid
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Joins URL path segments properly, handling trailing/leading slashes
 * @param {...string} segments - URL path segments to join
 * @returns {string} - Joined URL path
 */
function joinUrlPaths(...segments) {
    return segments
        .map(segment => segment.trim())
        .map(segment => segment.replace(/^\/+|\/+$/g, '')) // Remove leading/trailing slashes
        .filter(segment => segment.length > 0) // Remove empty segments
        .join('/');
}

module.exports = {
    createEndpointBuilder,
    createEndpoints,
    isValidUrl,
    joinUrlPaths
};
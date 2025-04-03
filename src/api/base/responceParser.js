const { logger } = require('../../core/utils/logger');

/**
 * Utilities for parsing and transforming API responses
 */

/**
 * Parses raw API response data and transforms it to the application's internal format
 * @param {Object} responseData - Raw API response data
 * @param {Function} transformFn - Transformation function specific to the data type
 * @returns {Object} - Transformed data in internal format
 */
function parseResponse(responseData, transformFn) {
    if (!responseData) {
        logger.warn('Empty response data received');
        return null;
    }

    try {
        // Apply transformation to normalize data structure
        return transformFn(responseData);
    } catch (error) {
        logger.error('Error parsing response data', { error });
        throw new Error(`Failed to parse response: ${error.message}`);
    }
}

/**
 * Parses a paginated response and extracts items and pagination metadata
 * @param {Object} responseData - Raw API response data
 * @param {Object} options - Parser options
 * @param {string} options.itemsPath - Path to items array in response (e.g., 'data.items')
 * @param {string} options.totalPath - Path to total count in response (e.g., 'data.total')
 * @param {string} options.pagePath - Path to current page in response
 * @param {string} options.limitPath - Path to page size/limit in response
 * @param {Function} options.transformItem - Function to transform each item
 * @returns {Object} - Object with items array and pagination metadata
 */
function parsePaginatedResponse(responseData, options) {
    const {
        itemsPath = 'data',
        totalPath = 'total',
        pagePath = 'page',
        limitPath = 'limit',
        transformItem = (item) => item
    } = options || {};

    if (!responseData) {
        logger.warn('Empty paginated response data received');
        return { items: [], pagination: { total: 0, page: 1, limit: 0 } };
    }

    try {
        // Extract items array from response using path
        const items = itemsPath.split('.').reduce((obj, path) => obj && obj[path], responseData) || [];

        // Extract pagination metadata
        const total = totalPath.split('.').reduce((obj, path) => obj && obj[path], responseData) || 0;
        const page = pagePath.split('.').reduce((obj, path) => obj && obj[path], responseData) || 1;
        const limit = limitPath.split('.').reduce((obj, path) => obj && obj[path], responseData) || items.length;

        // Transform items if needed
        const transformedItems = Array.isArray(items)
            ? items.map(transformItem)
            : [];

        return {
            items: transformedItems,
            pagination: { total, page, limit }
        };
    } catch (error) {
        logger.error('Error parsing paginated response', { error });
        throw new Error(`Failed to parse paginated response: ${error.message}`);
    }
}

/**
 * Gets a nested property from an object using a path string
 * @param {Object} obj - Object to get property from
 * @param {string} path - Path to property (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if property not found
 * @returns {any} - Property value or default value
 */
function getNestedProperty(obj, path, defaultValue = null) {
    if (!obj || !path) return defaultValue;

    try {
        return path.split('.').reduce((o, p) => o && o[p], obj) || defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

/**
 * Maps properties from a source object to a target object using a mapping definition
 * @param {Object} source - Source object with original data
 * @param {Object} mapping - Mapping definition (target property name -> source path or transform function)
 * @returns {Object} - New object with mapped properties
 */
function mapProperties(source, mapping) {
    if (!source || !mapping) return {};

    const result = {};

    Object.entries(mapping).forEach(([targetProp, sourcePathOrFn]) => {
        if (typeof sourcePathOrFn === 'function') {
            // Use transform function if provided
            result[targetProp] = sourcePathOrFn(source);
        } else if (typeof sourcePathOrFn === 'string') {
            // Get property by path
            result[targetProp] = getNestedProperty(source, sourcePathOrFn);
        } else {
            // Use direct value
            result[targetProp] = sourcePathOrFn;
        }
    });

    return result;
}

module.exports = {
    parseResponse,
    parsePaginatedResponse,
    getNestedProperty,
    mapProperties
};
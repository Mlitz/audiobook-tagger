/**
 * Utilities for data validation across the application
 */

/**
 * Validates that a value is not null or undefined
 * @param {any} value - Value to check
 * @param {string} [name='Value'] - Name of the value for error message
 * @throws {Error} If value is null or undefined
 */
function validateNotNull(value, name = 'Value') {
    if (value === null || value === undefined) {
        throw new Error(`${name} must not be null or undefined`);
    }
}

/**
 * Validates that a string is not empty
 * @param {string} value - String to check
 * @param {string} [name='String'] - Name of the value for error message
 * @throws {Error} If string is empty
 */
function validateNotEmpty(value, name = 'String') {
    validateNotNull(value, name);

    if (typeof value !== 'string') {
        throw new Error(`${name} must be a string`);
    }

    if (value.trim() === '') {
        throw new Error(`${name} must not be empty`);
    }
}

/**
 * Validates that a value is a string
 * @param {any} value - Value to check
 * @param {string} [name='Value'] - Name of the value for error message
 * @throws {Error} If value is not a string
 */
function validateString(value, name = 'Value') {
    if (typeof value !== 'string') {
        throw new Error(`${name} must be a string`);
    }
}

/**
 * Validates that a value is a number
 * @param {any} value - Value to check
 * @param {string} [name='Value'] - Name of the value for error message
 * @throws {Error} If value is not a number
 */
function validateNumber(value, name = 'Value') {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new Error(`${name} must be a number`);
    }
}

/**
 * Validates that a value is a boolean
 * @param {any} value - Value to check
 * @param {string} [name='Value'] - Name of the value for error message
 * @throws {Error} If value is not a boolean
 */
function validateBoolean(value, name = 'Value') {
    if (typeof value !== 'boolean') {
        throw new Error(`${name} must be a boolean`);
    }
}

/**
 * Validates that a value is an object
 * @param {any} value - Value to check
 * @param {string} [name='Object'] - Name of the value for error message
 * @throws {Error} If value is not an object
 */
function validateObject(value, name = 'Object') {
    validateNotNull(value, name);

    if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${name} must be an object`);
    }
}

/**
 * Validates that a value is an array
 * @param {any} value - Value to check
 * @param {string} [name='Array'] - Name of the value for error message
 * @throws {Error} If value is not an array
 */
function validateArray(value, name = 'Array') {
    validateNotNull(value, name);

    if (!Array.isArray(value)) {
        throw new Error(`${name} must be an array`);
    }
}

/**
 * Validates that a value is a function
 * @param {any} value - Value to check
 * @param {string} [name='Function'] - Name of the value for error message
 * @throws {Error} If value is not a function
 */
function validateFunction(value, name = 'Function') {
    if (typeof value !== 'function') {
        throw new Error(`${name} must be a function`);
    }
}

/**
 * Validates that a value is a valid ASIN
 * @param {string} value - ASIN to validate
 * @param {string} [name='ASIN'] - Name of the value for error message
 * @throws {Error} If ASIN format is invalid
 */
function validateAsin(value, name = 'ASIN') {
    validateNotEmpty(value, name);

    // ASIN format: B followed by 9 alphanumeric characters
    if (!/^B[0-9A-Z]{9}$/i.test(value)) {
        throw new Error(`${name} must be a valid ASIN (format: B + 9 alphanumeric characters)`);
    }
}

/**
 * Validates that a value matches a regular expression
 * @param {string} value - Value to check
 * @param {RegExp} pattern - Regular expression to match against
 * @param {string} [name='Value'] - Name of the value for error message
 * @throws {Error} If value doesn't match the pattern
 */
function validatePattern(value, pattern, name = 'Value') {
    validateString(value, name);

    if (!pattern.test(value)) {
        throw new Error(`${name} must match pattern: ${pattern}`);
    }
}

/**
 * Validates that a number is within a specified range
 * @param {number} value - Number to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {string} [name='Number'] - Name of the value for error message
 * @throws {Error} If number is outside the range
 */
function validateRange(value, min, max, name = 'Number') {
    validateNumber(value, name);

    if (value < min || value > max) {
        throw new Error(`${name} must be between ${min} and ${max}`);
    }
}

/**
 * Validates a URL
 * @param {string} value - URL to validate
 * @param {string} [name='URL'] - Name of the value for error message
 * @throws {Error} If URL is invalid
 */
function validateUrl(value, name = 'URL') {
    validateNotEmpty(value, name);

    try {
        new URL(value);
    } catch (error) {
        throw new Error(`${name} must be a valid URL`);
    }
}

/**
 * Validates a file path
 * @param {string} value - File path to validate
 * @param {string} [name='File path'] - Name of the value for error message
 * @throws {Error} If file path format is invalid
 */
function validateFilePath(value, name = 'File path') {
    validateNotEmpty(value, name);

    // Basic path validation - could be expanded based on platform
    if (value.includes('\0') || value.match(/[<>:"|?*]/)) {
        throw new Error(`${name} contains invalid characters`);
    }
}

/**
 * Validates an email address
 * @param {string} value - Email to validate
 * @param {string} [name='Email'] - Name of the value for error message
 * @throws {Error} If email format is invalid
 */
function validateEmail(value, name = 'Email') {
    validateNotEmpty(value, name);

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
        throw new Error(`${name} must be a valid email address`);
    }
}

/**
 * Validates an object has required properties
 * @param {Object} obj - Object to validate
 * @param {string[]} requiredProps - Array of required property names
 * @param {string} [name='Object'] - Name of the object for error message
 * @throws {Error} If any required property is missing
 */
function validateRequiredProperties(obj, requiredProps, name = 'Object') {
    validateObject(obj, name);
    validateArray(requiredProps, 'Required properties');

    const missingProps = requiredProps.filter(prop => !(prop in obj));

    if (missingProps.length > 0) {
        throw new Error(`${name} is missing required properties: ${missingProps.join(', ')}`);
    }
}

/**
 * Safely validates a value and returns a boolean instead of throwing
 * @param {Function} validationFn - Validation function to use
 * @param {any[]} args - Arguments to pass to the validation function
 * @returns {boolean} - Whether validation passed
 */
function isValid(validationFn, ...args) {
    try {
        validationFn(...args);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    validateNotNull,
    validateNotEmpty,
    validateString,
    validateNumber,
    validateBoolean,
    validateObject,
    validateArray,
    validateFunction,
    validateAsin,
    validatePattern,
    validateRange,
    validateUrl,
    validateFilePath,
    validateEmail,
    validateRequiredProperties,
    isValid
};
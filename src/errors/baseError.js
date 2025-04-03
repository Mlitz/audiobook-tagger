/**
 * Base error class for the application
 * Extends the standard Error with additional properties and functionality
 */
class BaseError extends Error {
  /**
   * Create a new BaseError
   * @param {string} message - Error message
   * @param {string} [code=UNKNOWN_ERROR] - Error code for programmatic handling
   * @param {Object} [details={}] - Additional error details
   */
  constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
    // Call parent constructor
    super(message);
    
    // Set name to the class name
    this.name = this.constructor.name;
    
    // Custom properties
    this.code = code;
    this.details = details;
    this.timestamp = new Date();
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Convert error to JSON representation
   * @returns {Object} - JSON representation of the error
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
  
  /**
   * Get a user-friendly error message
   * @returns {string} - Human-readable error message
   */
  getUserMessage() {
    return this.message;
  }
  
  /**
   * Check if this error matches a specific error code
   * @param {string} code - Error code to check
   * @returns {boolean} - Whether the error matches the code
   */
  hasCode(code) {
    return this.code === code;
  }
  
  /**
   * Create a new error with additional context
   * @param {string} additionalMessage - Message to add to original error
   * @param {Object} [additionalDetails={}] - Details to merge with original details
   * @returns {BaseError} - New error instance with combined information
   */
  withContext(additionalMessage, additionalDetails = {}) {
    const newMessage = `${additionalMessage}: ${this.message}`;
    const newDetails = { ...this.details, ...additionalDetails };
    
    const newError = new this.constructor(newMessage, this.code, newDetails);
    newError.cause = this;
    
    return newError;
  }
  
  /**
   * Create a new error with a different error code
   * @param {string} newCode - New error code
   * @returns {BaseError} - New error instance with updated code
   */
  withCode(newCode) {
    return new this.constructor(this.message, newCode, this.details);
  }
}

module.exports = { BaseError };
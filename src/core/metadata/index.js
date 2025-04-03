/**
 * Metadata processing module
 * Exports metadata processing functionality
 */

const { MetadataProcessor } = require('./processor');

/**
 * Initialize the metadata processor
 * @param {Object} options - Initialization options
 * @param {Object} options.apiClients - API clients (audnexus, etc.)
 * @param {Object} options.eventSystem - Event system for broadcasting updates
 * @param {Object} options.config - Metadata configuration
 * @returns {MetadataProcessor} - Initialized metadata processor
 */
function initializeMetadataProcessor(options) {
  return new MetadataProcessor(options);
}

module.exports = {
  initializeMetadataProcessor
};
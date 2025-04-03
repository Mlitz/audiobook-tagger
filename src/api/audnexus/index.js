/**
 * Audnexus API module
 * Exports the Audnexus API client and related utilities
 */

const { AudnexusClient, initializeAudnexusClient } = require('./client');

// Re-export client class and init function
module.exports = {
  AudnexusClient,
  initializeAudnexusClient
};
/**
 * Event system module
 * Exports event system for component communication
 */

const { EventDispatcher } = require('./dispatcher');

/**
 * Initialize the application event system
 * @returns {EventDispatcher} - Configured event dispatcher
 */
function initializeEventSystem() {
  return new EventDispatcher();
}

module.exports = {
  initializeEventSystem
};
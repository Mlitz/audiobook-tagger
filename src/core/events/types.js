/**
 * Event type definitions
 * 
 * This file defines the standard event names and data structures
 * that are used throughout the application. These are primarily for
 * documentation purposes and to maintain consistency.
 */

/**
 * @typedef {Object} MetadataLookupEvent
 * @property {string} asin - The ASIN that was looked up
 * @property {Object} metadata - The metadata that was found
 * @property {string} source - The source of the metadata
 */

/**
 * @typedef {Object} MetadataSearchEvent
 * @property {string} query - The search query
 * @property {Array<Object>} results - The search results
 * @property {string} source - The source of the results
 */

/**
 * @typedef {Object} FileProcessingEvent
 * @property {string} filePath - Path to the file being processed
 * @property {string} status - Current status (started, processing, complete, error)
 * @property {Object} [metadata] - Metadata being applied
 * @property {Error} [error] - Error if status is 'error'
 */

/**
 * @typedef {Object} BatchProcessingEvent
 * @property {Array<string>} filePaths - Paths to all files in the batch
 * @property {string} status - Current status (started, processing, complete, error)
 * @property {number} totalFiles - Total number of files in batch
 * @property {number} processedFiles - Number of files processed so far
 * @property {number} successCount - Number of successfully processed files
 * @property {number} errorCount - Number of files with errors
 */

/**
 * @typedef {Object} ConfigChangedEvent
 * @property {string} key - The configuration key that changed
 * @property {any} newValue - The new value
 * @property {any} oldValue - The previous value
 */

/**
 * @typedef {Object} ApplicationEvent
 * @property {string} status - Application status
 * @property {Object} [details] - Additional details about the status
 */

// Application lifecycle events
const AppEvents = {
    /** Application initialization completed */
    INITIALIZED: 'app:initialized',

    /** Application is shutting down */
    SHUTDOWN: 'app:shutdown',

    /** Application error occurred */
    ERROR: 'app:error'
};

// Configuration events
const ConfigEvents = {
    /** Configuration loaded */
    LOADED: 'config:loaded',

    /** Configuration changed */
    CHANGED: 'config:changed',

    /** Configuration reset to defaults */
    RESET: 'config:reset'
};

// Metadata events
const MetadataEvents = {
    /** Metadata lookup initiated */
    LOOKUP_STARTED: 'metadata:lookup:started',

    /** Metadata lookup completed */
    LOOKUP_COMPLETED: 'metadata:lookup:completed',

    /** Metadata lookup failed */
    LOOKUP_FAILED: 'metadata:lookup:failed',

    /** Metadata search initiated */
    SEARCH_STARTED: 'metadata:search:started',

    /** Metadata search completed */
    SEARCH_COMPLETED: 'metadata:search:completed',

    /** Metadata search failed */
    SEARCH_FAILED: 'metadata:search:failed'
};

// File processing events
const FileEvents = {
    /** File processing started */
    PROCESSING_STARTED: 'file:processing:started',

    /** File processing progress update */
    PROCESSING_PROGRESS: 'file:processing:progress',

    /** File processing completed */
    PROCESSING_COMPLETED: 'file:processing:completed',

    /** File processing failed */
    PROCESSING_FAILED: 'file:processing:failed',

    /** Batch processing started */
    BATCH_STARTED: 'file:batch:started',

    /** Batch processing progress update */
    BATCH_PROGRESS: 'file:batch:progress',

    /** Batch processing completed */
    BATCH_COMPLETED: 'file:batch:completed',

    /** File scanning started */
    SCAN_STARTED: 'file:scan:started',

    /** File scanning progress */
    SCAN_PROGRESS: 'file:scan:progress',

    /** File scanning completed */
    SCAN_COMPLETED: 'file:scan:completed'
};

// UI events
const UIEvents = {
    /** View mode changed (grid, list, details) */
    VIEW_CHANGED: 'ui:view:changed',

    /** Theme changed (light, dark) */
    THEME_CHANGED: 'ui:theme:changed',

    /** User requested file selection */
    SELECT_FILES: 'ui:select:files',

    /** User requested folder selection */
    SELECT_FOLDER: 'ui:select:folder'
};

module.exports = {
    AppEvents,
    ConfigEvents,
    MetadataEvents,
    FileEvents,
    UIEvents
};
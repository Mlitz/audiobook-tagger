/**
 * Filesystem module
 * Exports filesystem services for scanning, organizing, and managing audiobook files
 */

const { FileSystemService, initializeFileSystemService, isSupportedAudioFormat, SUPPORTED_EXTENSIONS } = require('./service');
const { FileScanner, initializeFileScanner } = require('./scanner');
const { FileOrganizer, initializeFileOrganizer } = require('./organizer');

/**
 * Initialize the filesystem module
 * @param {Object} options - Initialization options
 * @param {Object} options.config - Configuration for filesystem services
 * @param {Object} options.eventSystem - Event system for broadcasting updates
 * @returns {Object} - Initialized filesystem services
 */
function initializeFilesystem(options = {}) {
    const { config = {}, eventSystem } = options;

    // Initialize the filesystem service
    const fileSystemService = initializeFileSystemService({
        config: config.filesystem || {},
        eventSystem
    });

    // Initialize the file scanner
    const fileScanner = initializeFileScanner({
        fileSystemService,
        eventSystem,
        config: config.scanner || {}
    });

    // Initialize the file organizer
    const fileOrganizer = initializeFileOrganizer({
        fileSystemService,
        eventSystem,
        config: config.organizer || {}
    });

    return {
        fileSystemService,
        fileScanner,
        fileOrganizer
    };
}

module.exports = {
    // Main initialization function
    initializeFilesystem,

    // Service classes
    FileSystemService,
    FileScanner,
    FileOrganizer,

    // Utility functions
    isSupportedAudioFormat,

    // Constants
    SUPPORTED_EXTENSIONS
};
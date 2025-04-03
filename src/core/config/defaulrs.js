/**
 * Default configuration values for the application
 * These values are used when no configuration file exists
 * or when properties are missing from the config file.
 */

const defaultConfig = {
    // API configuration
    api: {
        // Audnexus API settings
        audnexus: {
            baseUrl: 'https://api.audnex.us',
            region: 'us',
            timeout: 10000,   // 10 seconds
            retryCount: 3
        },

        // Hardcover API settings (optional integration)
        hardcover: {
            enabled: false,
            baseUrl: 'https://hardcover.app/api',
            apiKey: ''
        }
    },

    // Metadata processing configuration
    metadata: {
        // Order determines priority (first is highest)
        sources: ['audnexus', 'local'],

        // Match confidence thresholds
        matchingThreshold: 0.7,     // Min score to be considered a match
        autoConfirmThreshold: 0.9,  // Min score for automatic confirmation

        // Apply metadata automatically if ASIN is found
        autoApplyAsin: true,

        // Tagging preferences
        tagging: {
            preferredTagFormat: 'id3v2.4',
            embedCoverArt: true,
            preserveExistingTags: true,
            coverArtSize: 1000  // Width/height of embedded cover art in pixels
        }
    },

    // User interface configuration
    ui: {
        theme: 'dark',
        defaultView: 'grid',
        confirmChanges: true,
        showAdvancedFields: false,
        thumbnailSize: 'medium',
        recentFolders: []
    },

    // System and performance configuration
    system: {
        concurrentTasks: 2,        // Number of concurrent processing tasks
        logLevel: 'info',          // Logging verbosity
        cacheSize: 100,            // Size of metadata cache (MB)
        cacheTTL: 30,              // Cache time-to-live (days)
        autoCheckUpdates: true     // Automatically check for updates
    }
};

module.exports = {
    defaultConfig
};
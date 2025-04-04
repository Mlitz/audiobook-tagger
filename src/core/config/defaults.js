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

    // Filesystem configuration
    filesystem: {
        // General filesystem settings
        concurrentOperations: 2,    // Number of concurrent filesystem operations
        followSymlinks: true,       // Whether to follow symbolic links
        includeHidden: false,       // Whether to include hidden files and folders

        // Scanner settings
        scanner: {
            maxDepth: 10,           // Maximum recursion depth for directory scanning
            minFileSize: 1024 * 1024, // Minimum file size (1MB)
            maxFileSize: 5 * 1024 * 1024 * 1024, // Maximum file size (5GB)
            excludePatterns: [      // Patterns to exclude from scanning
                /^\\./,                // Hidden files/folders
                /node_modules/,        // Node modules
                /^\$RECYCLE.BIN$/      // Recycle bin
            ]
        },

        // Organizer settings
        organizer: {
            templates: {
                // Default template: Author/Series/SeriesPosition. Book Title
                standard: '%author%/%series%/%series_position%. %title%',
                // No series: Author/Book Title
                noSeries: '%author%/%title%',
                // Single file: Author/Book Title.extension
                singleFile: '%author%/%title%',
                // Multi-file: Author/Book Title/Part XX
                multiFile: '%author%/%title%/Part %part_number%'
            },
            moveFiles: false,       // Whether to move files (true) or copy them (false)
            overwriteExisting: false // Whether to overwrite existing files
        }
    },

    // File processing settings
    processing: {
        concurrentProcessing: 2,    // Number of concurrent processing tasks
        autoOrganize: false,        // Whether to automatically organize processed files
        destinationPath: '',        // Destination path for organized files (if autoOrganize is true)
        pauseBetweenFiles: 500,     // Milliseconds to pause between processing files
        retainSourceFiles: true     // Whether to keep source files after processing
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
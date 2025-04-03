const Ajv = require('ajv');
const { logger } = require('../utils/logger');

// Create Ajv instance with proper configuration
const ajv = new Ajv({
    allErrors: true,         // Report all errors, not just the first
    removeAdditional: true,  // Remove additional properties not in schema
    useDefaults: true,       // Apply default values from schema
    coerceTypes: true        // Type coercion for simple values
});

// Define the configuration schema
const configSchema = {
    type: 'object',
    required: ['api', 'metadata', 'ui', 'system'],
    properties: {
        // API configuration
        api: {
            type: 'object',
            required: ['audnexus'],
            properties: {
                audnexus: {
                    type: 'object',
                    properties: {
                        baseUrl: {
                            type: 'string',
                            format: 'uri',
                            default: 'https://api.audnex.us'
                        },
                        region: {
                            type: 'string',
                            enum: ['us', 'uk', 'de', 'fr', 'jp', 'it', 'es', 'in', 'ca', 'au'],
                            default: 'us'
                        },
                        timeout: {
                            type: 'integer',
                            minimum: 1000,
                            maximum: 60000,
                            default: 10000
                        },
                        retryCount: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 10,
                            default: 3
                        }
                    },
                    additionalProperties: false
                },
                hardcover: {
                    type: 'object',
                    properties: {
                        enabled: {
                            type: 'boolean',
                            default: false
                        },
                        baseUrl: {
                            type: 'string',
                            format: 'uri',
                            default: 'https://hardcover.app/api'
                        },
                        apiKey: {
                            type: 'string'
                        }
                    },
                    additionalProperties: false
                }
            },
            additionalProperties: false
        },

        // Metadata configuration
        metadata: {
            type: 'object',
            properties: {
                sources: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: ['audnexus', 'hardcover', 'local']
                    },
                    default: ['audnexus', 'local']
                },
                matchingThreshold: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 0.7
                },
                autoConfirmThreshold: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 0.9
                },
                autoApplyAsin: {
                    type: 'boolean',
                    default: true
                },
                tagging: {
                    type: 'object',
                    properties: {
                        preferredTagFormat: {
                            type: 'string',
                            enum: ['id3v2.4', 'id3v2.3', 'm4b'],
                            default: 'id3v2.4'
                        },
                        embedCoverArt: {
                            type: 'boolean',
                            default: true
                        },
                        preserveExistingTags: {
                            type: 'boolean',
                            default: true
                        },
                        coverArtSize: {
                            type: 'integer',
                            minimum: 100,
                            maximum: 2000,
                            default: 1000
                        }
                    },
                    additionalProperties: false
                }
            },
            additionalProperties: false
        },

        // UI configuration
        ui: {
            type: 'object',
            properties: {
                theme: {
                    type: 'string',
                    enum: ['dark', 'light', 'system'],
                    default: 'dark'
                },
                defaultView: {
                    type: 'string',
                    enum: ['grid', 'list', 'details'],
                    default: 'grid'
                },
                confirmChanges: {
                    type: 'boolean',
                    default: true
                },
                showAdvancedFields: {
                    type: 'boolean',
                    default: false
                },
                thumbnailSize: {
                    type: 'string',
                    enum: ['small', 'medium', 'large'],
                    default: 'medium'
                },
                recentFolders: {
                    type: 'array',
                    items: {
                        type: 'string'
                    },
                    maxItems: 10,
                    default: []
                }
            },
            additionalProperties: false
        },

        // System configuration
        system: {
            type: 'object',
            properties: {
                concurrentTasks: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 16,
                    default: 2
                },
                logLevel: {
                    type: 'string',
                    enum: ['error', 'warn', 'info', 'debug'],
                    default: 'info'
                },
                cacheSize: {
                    type: 'integer',
                    minimum: 10,
                    maximum: 1000,
                    default: 100
                },
                cacheTTL: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 90,
                    default: 30
                },
                tempDirectory: {
                    type: 'string'
                },
                autoCheckUpdates: {
                    type: 'boolean',
                    default: true
                }
            },
            additionalProperties: false
        }
    },
    additionalProperties: false
};

// Compile the schema
const validateSchema = ajv.compile(configSchema);

/**
 * Validate a configuration object against the schema
 * @param {Object} config - Configuration object to validate
 * @returns {Object} - Validation result
 */
function validate(config) {
    const valid = validateSchema(config);

    if (!valid) {
        // Format validation errors
        const errors = validateSchema.errors.map(error => {
            return `${error.instancePath} ${error.message}`;
        });

        logger.debug('Configuration validation failed', { errors });

        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

module.exports = {
    validate,
    configSchema
};
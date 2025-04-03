const { logger } = require('../utils/logger');
const { retry } = require('../utils/async');
const { validateNotNull, validateObject } = require('../utils/validation');
const { MetadataEvents } = require('../events/types');
const { MetadataNotFoundError } = require('../../errors/apiErrors');
const { createContextErrorHandler } = require('../../errors/handler');
const {
    extractAsinFromFilename,
    cleanSearchTerm
} = require('../../api/metadata/parser');

// Create error handler for metadata context
const errorHandler = createContextErrorHandler('metadata-processor');

/**
 * Metadata processor class
 * Handles metadata retrieval, matching, and application
 */
class MetadataProcessor {
    /**
     * Create a new MetadataProcessor
     * @param {Object} options - Processor options
     * @param {Object} options.apiClients - API clients for metadata sources
     * @param {Object} options.eventSystem - Event system for broadcasting updates
     * @param {Object} options.config - Metadata configuration
     */
    constructor(options = {}) {
        const { apiClients, eventSystem, config } = options;

        validateObject(apiClients, 'API clients');
        validateNotNull(eventSystem, 'Event system');
        validateObject(config, 'Metadata config');

        this.apiClients = apiClients;
        this.events = eventSystem;
        this.config = config;

        // Initialize cache
        this.cache = new Map();

        logger.info('MetadataProcessor initialized');
    }

    /**
     * Lookup metadata by ASIN
     * @param {string} asin - Book ASIN (Audible ID)
     * @param {Object} [options={}] - Lookup options
     * @param {string} [options.region] - Region override
     * @param {boolean} [options.includeChapters=false] - Whether to include chapter information
     * @returns {Promise<Object>} - Book metadata
     */
    async lookupByAsin(asin, options = {}) {
        const { region, includeChapters = false } = options;

        if (!asin) {
            throw new Error('ASIN is required');
        }

        // Check cache first
        const cacheKey = `asin:${asin}${region ? `:${region}` : ''}`;
        if (this.cache.has(cacheKey)) {
            logger.debug(`Metadata cache hit for ASIN: ${asin}`);
            return this.cache.get(cacheKey);
        }

        try {
            // Emit event for lookup started
            this.events.emit(MetadataEvents.LOOKUP_STARTED, { asin, source: 'audnexus' });

            logger.info(`Looking up metadata for ASIN: ${asin}`, { region });

            // Get the Audnexus client
            const audnexus = this.apiClients.audnexus;
            if (!audnexus) {
                throw new Error('Audnexus API client is not available');
            }

            // Lookup book metadata with retry logic
            const bookData = await errorHandler.withHandling(
                () => retry(
                    async () => audnexus.getBookByAsin(asin, region),
                    { maxRetries: 2 }
                )
            )();

            // If chapters are requested, get them too
            let chapterData = null;
            if (includeChapters && bookData) {
                try {
                    chapterData = await errorHandler.withHandling(
                        () => retry(
                            async () => audnexus.getBookChapters(asin, region),
                            { maxRetries: 2 }
                        )
                    )();
                } catch (error) {
                    logger.warn(`Failed to retrieve chapters for ASIN: ${asin}`, { error });
                    // We'll continue without chapters
                }
            }

            // Combine book and chapter data
            const metadata = {
                ...bookData,
                chapters: chapterData?.chapters || []
            };

            // Cache the result
            this.cache.set(cacheKey, metadata);

            // Emit event for lookup completed
            this.events.emit(MetadataEvents.LOOKUP_COMPLETED, {
                asin,
                metadata,
                source: 'audnexus'
            });

            return metadata;
        } catch (error) {
            // Emit event for lookup failed
            this.events.emit(MetadataEvents.LOOKUP_FAILED, {
                asin,
                error,
                source: 'audnexus'
            });

            // If not found, throw specific error
            if (error.statusCode === 404) {
                throw new MetadataNotFoundError(asin);
            }

            // Otherwise re-throw the original error
            throw error;
        }
    }

    /**
     * Search for metadata using title and author
     * @param {Object} params - Search parameters
     * @param {string} params.title - Book title
     * @param {string} [params.author] - Author name
     * @param {string} [params.narrator] - Narrator name
     * @param {string} [params.region] - Region override
     * @returns {Promise<Array<Object>>} - Search results
     */
    async search(params) {
        if (!params || (!params.title && !params.author && !params.narrator)) {
            throw new Error('At least one search parameter is required');
        }

        try {
            // Clean up search terms
            const cleanedParams = {
                title: params.title ? cleanSearchTerm(params.title) : undefined,
                author: params.author ? cleanSearchTerm(params.author) : undefined,
                narrator: params.narrator ? cleanSearchTerm(params.narrator) : undefined,
                region: params.region
            };

            // Remove undefined values
            Object.keys(cleanedParams).forEach(key => {
                if (cleanedParams[key] === undefined) {
                    delete cleanedParams[key];
                }
            });

            // Emit event for search started
            this.events.emit(MetadataEvents.SEARCH_STARTED, {
                query: cleanedParams,
                source: 'audnexus'
            });

            logger.info('Searching for metadata', { params: cleanedParams });

            // Get the Audnexus client
            const audnexus = this.apiClients.audnexus;
            if (!audnexus) {
                throw new Error('Audnexus API client is not available');
            }

            // Search for books with retry logic
            const results = await errorHandler.withHandling(
                () => retry(
                    async () => audnexus.searchBooks(cleanedParams),
                    { maxRetries: 2 }
                )
            )();

            // Emit event for search completed
            this.events.emit(MetadataEvents.SEARCH_COMPLETED, {
                query: cleanedParams,
                results,
                source: 'audnexus'
            });

            return results;
        } catch (error) {
            // Emit event for search failed
            this.events.emit(MetadataEvents.SEARCH_FAILED, {
                query: params,
                error,
                source: 'audnexus'
            });

            throw error;
        }
    }

    /**
     * Extract metadata from file name or existing tags
     * @param {string} filePath - Path to the file
     * @param {Object} [existingTags={}] - Existing metadata tags from the file
     * @returns {Promise<Object>} - Extracted metadata or null if not found
     */
    async extractMetadataFromFile(filePath, existingTags = {}) {
        try {
            logger.debug('Extracting metadata from file', { filePath });

            // First, try to find ASIN in existing metadata
            let asin = existingTags.asin;

            // If no ASIN in tags, try to extract from filename
            if (!asin) {
                asin = extractAsinFromFilename(filePath);
            }

            // If we found an ASIN, look it up
            if (asin) {
                logger.info(`Found ASIN in file: ${asin}`, { filePath });

                try {
                    return await this.lookupByAsin(asin);
                } catch (error) {
                    // If lookup fails, continue with other methods
                    logger.warn(`ASIN lookup failed for ${asin}`, { error });
                }
            }

            // If we get here, we couldn't get metadata from ASIN
            // In Phase 1, we'll just return null
            // In later phases, we'd implement more sophisticated matching

            return null;
        } catch (error) {
            logger.error('Error extracting metadata from file', {
                filePath,
                error
            });
            return null;
        }
    }

    /**
     * Clear the metadata cache
     */
    clearCache() {
        const cacheSize = this.cache.size;
        this.cache.clear();
        logger.info(`Metadata cache cleared (${cacheSize} items)`);
    }

    /**
     * Shutdown the metadata processor
     */
    shutdown() {
        this.clearCache();
        logger.info('MetadataProcessor shut down');
    }
}

module.exports = { MetadataProcessor };
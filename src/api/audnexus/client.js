const { BaseApiClient } = require('../base/apiClient');
const { createEndpoints } = require('../base/endpoints');
const { parseResponse, mapProperties } = require('../base/responseParser');
const { logger } = require('../../core/utils/logger');
const ENDPOINTS = require('./endpoints');

/**
 * Client for the Audnexus API
 * Handles communication with the Audnexus API endpoints
 */
class AudnexusClient extends BaseApiClient {
  /**
   * Create a new AudnexusClient
   * @param {Object} config - Client configuration
   * @param {string} config.baseUrl - Base URL for the Audnexus API
   * @param {string} config.region - Default region (us, uk, etc.)
   * @param {Object} config.options - Additional client options
   */
  constructor(config = {}) {
    // Default configuration
    const defaultConfig = {
      baseUrl: 'https://api.audnex.us',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AudiobookTagger/0.1.0'
      },
      timeout: 10000 // 10 seconds
    };

    // Merge default config with provided config
    const mergedConfig = {
      ...defaultConfig,
      ...config,
      headers: {
        ...defaultConfig.headers,
        ...(config.headers || {})
      }
    };

    // Initialize base client
    super(mergedConfig);

    // Set default region
    this.defaultRegion = config.region || 'us';

    // Create endpoint builders
    this.endpoints = createEndpoints(ENDPOINTS, mergedConfig.baseUrl);

    logger.info('AudnexusClient initialized', {
      baseUrl: mergedConfig.baseUrl,
      defaultRegion: this.defaultRegion
    });
  }

  /**
   * Get book metadata by ASIN
   * @param {string} asin - Book ASIN (Audible ID)
   * @param {string} [region] - Region override
   * @returns {Promise<Object>} - Book metadata
   */
  async getBookByAsin(asin, region = this.defaultRegion) {
    if (!asin) {
      throw new Error('ASIN is required');
    }

    try {
      logger.debug('Getting book by ASIN', { asin, region });

      const endpoint = this.endpoints.getBook({ asin, region });
      const response = await this.get(endpoint);

      return parseResponse(response, this._transformBookData);
    } catch (error) {
      logger.error('Error getting book by ASIN', { asin, region, error });
      throw error;
    }
  }

  /**
   * Get chapters for a book by ASIN
   * @param {string} asin - Book ASIN (Audible ID)
   * @param {string} [region] - Region override
   * @returns {Promise<Object>} - Chapter metadata
   */
  async getBookChapters(asin, region = this.defaultRegion) {
    if (!asin) {
      throw new Error('ASIN is required');
    }

    try {
      logger.debug('Getting book chapters', { asin, region });

      const endpoint = this.endpoints.getBookChapters({ asin, region });
      const response = await this.get(endpoint);

      return parseResponse(response, this._transformChapterData);
    } catch (error) {
      logger.error('Error getting book chapters', { asin, region, error });
      throw error;
    }
  }

  /**
   * Get author details by ASIN
   * @param {string} asin - Author ASIN 
   * @param {string} [region] - Region override
   * @returns {Promise<Object>} - Author metadata
   */
  async getAuthorByAsin(asin, region = this.defaultRegion) {
    if (!asin) {
      throw new Error('Author ASIN is required');
    }

    try {
      logger.debug('Getting author by ASIN', { asin, region });

      const endpoint = this.endpoints.getAuthor({ asin, region });
      const response = await this.get(endpoint);

      return parseResponse(response, this._transformAuthorData);
    } catch (error) {
      logger.error('Error getting author by ASIN', { asin, region, error });
      throw error;
    }
  }

  /**
   * Search for books
   * @param {Object} params - Search parameters
   * @param {string} params.title - Book title
   * @param {string} [params.author] - Author name
   * @param {string} [params.narrator] - Narrator name
   * @param {string} [params.region] - Region override
   * @returns {Promise<Object[]>} - Search results
   */
  async searchBooks(params) {
    if (!params || (!params.title && !params.author && !params.narrator)) {
      throw new Error('At least one search parameter is required');
    }

    const { region = this.defaultRegion, ...searchParams } = params;

    try {
      logger.debug('Searching books', { params, region });

      const endpoint = this.endpoints.searchBooks({ region });
      const response = await this.get(endpoint, searchParams);

      return parseResponse(response, (data) => {
        if (!Array.isArray(data)) {
          return [];
        }
        return data.map(this._transformBookData);
      });
    } catch (error) {
      logger.error('Error searching books', { params, region, error });
      throw error;
    }
  }

  /**
   * Transform raw book data to internal format
   * @param {Object} data - Raw book data from API
   * @returns {Object} - Transformed book data
   * @private
   */
  _transformBookData(data) {
    if (!data) return null;

    // Map API data to internal format
    return mapProperties(data, {
      // Basic info
      asin: 'asin',
      title: 'title',
      subtitle: 'subtitle',
      publisherName: 'publisherName',
      releaseDate: 'releaseDate',
      summary: 'summary',
      
      // Authors and narrators as arrays of objects
      authors: (data) => {
        if (!data.authors) return [];
        return data.authors.map(author => ({
          name: author.name,
          asin: author.asin
        }));
      },
      narrators: (data) => {
        if (!data.narrators) return [];
        return data.narrators.map(narrator => ({
          name: narrator.name,
          asin: narrator.asin
        }));
      },
      
      // Series info if available
      series: (data) => {
        if (!data.seriesName) return null;
        return {
          name: data.seriesName,
          position: data.seriesPosition || null
        };
      },
      
      // Audio info
      duration: 'runtimeLengthMin',
      language: 'language',
      
      // Cover art info
      coverUrl: (data) => {
        if (data.image) return data.image;
        return null;
      },
      
      // Additional metadata
      genres: (data) => {
        if (!data.genres) return [];
        return data.genres.map(genre => genre.name);
      },
      copyright: 'copyright',
      isAbridged: (data) => Boolean(data.isAbridged),
      
      // Original data for reference
      _original: (data) => data
    });
  }

  /**
   * Transform raw chapter data to internal format
   * @param {Object} data - Raw chapter data from API
   * @returns {Object} - Transformed chapter data
   * @private
   */
  _transformChapterData(data) {
    if (!data || !data.chapters) return { chapters: [] };

    return {
      asin: data.asin,
      brandIntroDurationMs: data.brandIntroDurationMs || 0,
      brandOutroDurationMs: data.brandOutroDurationMs || 0,
      isAccurate: Boolean(data.isAccurate),
      runtimeLengthMs: data.runtimeLengthMs || 0,
      chapters: data.chapters.map((chapter, index) => ({
        title: chapter.title || `Chapter ${index + 1}`,
        startMs: chapter.startOffsetMs || 0,
        lengthMs: chapter.lengthMs || 0,
        startTimestamp: formatTimestamp(chapter.startOffsetMs || 0),
        endTimestamp: formatTimestamp((chapter.startOffsetMs || 0) + (chapter.lengthMs || 0))
      }))
    };
  }

  /**
   * Transform raw author data to internal format
   * @param {Object} data - Raw author data from API
   * @returns {Object} - Transformed author data
   * @private
   */
  _transformAuthorData(data) {
    if (!data) return null;

    return mapProperties(data, {
      asin: 'asin',
      name: 'name',
      bio: 'bio',
      imageUrl: 'image',
      books: (data) => {
        if (!data.books || !Array.isArray(data.books)) return [];
        return data.books.map(book => ({
          asin: book.asin,
          title: book.title
        }));
      },
      // Original data for reference
      _original: (data) => data
    });
  }
}

/**
 * Format milliseconds as HH:MM:SS timestamp
 * @param {number} ms - Time in milliseconds
 * @returns {string} - Formatted timestamp
 */
function formatTimestamp(ms) {
  if (!ms || isNaN(ms)) return '00:00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
}

/**
 * Initialize the Audnexus API client
 * @param {Object} config - Client configuration
 * @returns {AudnexusClient} - Configured client instance
 */
function initializeAudnexusClient(config = {}) {
  return new AudnexusClient(config);
}

module.exports = {
  AudnexusClient,
  initializeAudnexusClient
};
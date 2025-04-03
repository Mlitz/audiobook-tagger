/**
 * Type definitions for Audnexus API
 * 
 * These are JSDoc type definitions that provide documentation and code completion
 * for our internal data models based on the Audnexus API responses.
 */

/**
 * @typedef {Object} Book
 * @property {string} asin - Audible Standard Identification Number
 * @property {string} title - Book title
 * @property {string} [subtitle] - Book subtitle
 * @property {string} [publisherName] - Publisher name
 * @property {string} [releaseDate] - Release date in ISO format
 * @property {string} [summary] - Book description/summary
 * @property {Author[]} authors - List of authors
 * @property {Narrator[]} narrators - List of narrators
 * @property {Series} [series] - Series information if book is part of a series
 * @property {number} [duration] - Runtime length in minutes
 * @property {string} [language] - Language code (e.g., 'en')
 * @property {string} [coverUrl] - URL to cover image
 * @property {string[]} [genres] - Genre names
 * @property {string} [copyright] - Copyright information
 * @property {boolean} [isAbridged] - Whether the audiobook is abridged
 * @property {Object} [_original] - Original API response data
 */

/**
 * @typedef {Object} Author
 * @property {string} name - Author name
 * @property {string} [asin] - Author ASIN
 * @property {string} [bio] - Author biography
 * @property {string} [imageUrl] - URL to author image
 * @property {BookReference[]} [books] - Books by this author
 * @property {Object} [_original] - Original API response data
 */

/**
 * @typedef {Object} Narrator
 * @property {string} name - Narrator name
 * @property {string} [asin] - Narrator ASIN 
 */

/**
 * @typedef {Object} Series
 * @property {string} name - Series name
 * @property {number|string|null} position - Book's position in the series
 */

/**
 * @typedef {Object} BookReference
 * @property {string} asin - Book ASIN
 * @property {string} title - Book title
 */

/**
 * @typedef {Object} ChapterInfo
 * @property {string} asin - Book ASIN
 * @property {number} [brandIntroDurationMs] - Duration of brand intro in milliseconds
 * @property {number} [brandOutroDurationMs] - Duration of brand outro in milliseconds
 * @property {boolean} [isAccurate] - Whether chapter info is accurate
 * @property {number} [runtimeLengthMs] - Total runtime in milliseconds
 * @property {Chapter[]} chapters - List of chapters
 */

/**
 * @typedef {Object} Chapter
 * @property {string} title - Chapter title
 * @property {number} startMs - Start time in milliseconds
 * @property {number} lengthMs - Length in milliseconds
 * @property {string} startTimestamp - Formatted start time (HH:MM:SS)
 * @property {string} endTimestamp - Formatted end time (HH:MM:SS)
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} [title] - Book title to search for
 * @property {string} [author] - Author name to search for
 * @property {string} [narrator] - Narrator name to search for
 * @property {string} [region] - Region to search in
 */

/**
 * @typedef {Object} SearchResponse
 * @property {Book[]} items - Search results
 * @property {Object} pagination - Pagination information
 * @property {number} pagination.total - Total number of results
 * @property {number} pagination.page - Current page number
 * @property {number} pagination.limit - Results per page
 */

// Export empty object as this file is just for JSDoc types
module.exports = {};
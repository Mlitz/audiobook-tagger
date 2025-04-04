/**
 * File Metadata Extractor
 * Extracts metadata from audio files using various libraries
 */

const path = require('path');
const { promisify } = require('util');
const NodeID3 = require('node-id3');
const musicMetadata = require('music-metadata');
const { logger } = require('../utils/logger');
const { createContextErrorHandler } = require('../../errors/handler');

// Promisify NodeID3 functions
const readID3Tags = promisify(NodeID3.read);

// Create error handler for metadata context
const errorHandler = createContextErrorHandler('metadata-extractor');

/**
 * Extract metadata from an audio file
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} - Extracted metadata
 */
async function extractMetadata(filePath) {
    try {
        logger.debug(`Extracting metadata from file: ${filePath}`);

        const extension = path.extname(filePath).toLowerCase();

        // Choose extraction method based on file type
        let metadata;

        if (['.mp3'].includes(extension)) {
            // Use NodeID3 for MP3 files
            metadata = await extractID3Metadata(filePath);
        } else {
            // Use music-metadata for other audio formats
            metadata = await extractMusicMetadata(filePath);
        }

        // Add file path and extension to metadata
        metadata = {
            ...metadata,
            filePath,
            fileExtension: extension
        };

        logger.debug(`Metadata extracted successfully from: ${filePath}`);
        return metadata;
    } catch (error) {
        logger.error(`Error extracting metadata from: ${filePath}`, { error });
        return errorHandler.handle(error);
    }
}

/**
 * Extract metadata from MP3 files using NodeID3
 * @param {string} filePath - Path to the MP3 file
 * @returns {Promise<Object>} - Extracted metadata
 */
async function extractID3Metadata(filePath) {
    try {
        // Read ID3 tags
        const tags = await readID3Tags(filePath);

        // Transform ID3 tags to a standardized format
        return transformID3Tags(tags);
    } catch (error) {
        logger.error(`Error extracting ID3 metadata: ${filePath}`, { error });
        throw error;
    }
}

/**
 * Extract metadata using music-metadata library
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<Object>} - Extracted metadata
 */
async function extractMusicMetadata(filePath) {
    try {
        // Parse file with music-metadata
        const { common, format } = await musicMetadata.parseFile(filePath);

        // Transform to standardized format
        return transformMusicMetadata(common, format);
    } catch (error) {
        logger.error(`Error extracting music metadata: ${filePath}`, { error });
        throw error;
    }
}

/**
 * Transform ID3 tags to standardized metadata format
 * @param {Object} tags - ID3 tags from NodeID3
 * @returns {Object} - Standardized metadata
 */
function transformID3Tags(tags) {
    if (!tags) {
        return {};
    }

    // Initialize standardized metadata object
    const metadata = {
        title: tags.title || null,
        authors: [],
        narrators: [],
        series: null,
        asin: null,
        description: null
    };

    // Extract author/artist
    if (tags.artist) {
        const authors = tags.artist.split(/[,;]/);
        metadata.authors = authors.map(name => ({ name: name.trim() }));
    }

    // Extract narrator (often stored in album artist or custom tags)
    if (tags.performerInfo) {
        const narrators = tags.performerInfo.split(/[,;]/);
        metadata.narrators = narrators.map(name => ({ name: name.trim() }));
    } else if (tags.albumArtist) {
        const narrators = tags.albumArtist.split(/[,;]/);
        metadata.narrators = narrators.map(name => ({ name: name.trim() }));
    }

    // Extract description from comments
    if (tags.comment) {
        if (typeof tags.comment === 'object' && tags.comment.text) {
            metadata.description = tags.comment.text;
        } else {
            metadata.description = tags.comment;
        }
    }

    // Extract album as potential series
    if (tags.album) {
        // Check for series pattern: "Series Name, Book X"
        const seriesMatch = tags.album.match(/^(.+?),\s*Book\s*(\d+|[IVX]+)$/i);
        if (seriesMatch) {
            metadata.series = {
                name: seriesMatch[1].trim(),
                position: seriesMatch[2].trim()
            };
        } else {
            metadata.album = tags.album;
        }
    }

    // Extract year
    if (tags.year) {
        metadata.year = tags.year;
    }

    // Handle custom ID3 TXXX frames
    if (tags.userDefinedText && Array.isArray(tags.userDefinedText)) {
        tags.userDefinedText.forEach(frame => {
            if (!frame.description || !frame.value) return;

            const description = frame.description.toUpperCase();

            switch (description) {
                case 'ASIN':
                    metadata.asin = frame.value;
                    break;

                case 'SERIES':
                    if (!metadata.series) metadata.series = { name: frame.value };
                    else metadata.series.name = frame.value;
                    break;

                case 'SERIES_POSITION':
                case 'SERIESPOSITION':
                case 'SERIES_PART':
                    if (!metadata.series) metadata.series = { position: frame.value };
                    else metadata.series.position = frame.value;
                    break;

                case 'NARRATOR':
                case 'NARRATORS':
                    if (!metadata.narrators || metadata.narrators.length === 0) {
                        const narrators = frame.value.split(/[,;]/);
                        metadata.narrators = narrators.map(name => ({ name: name.trim() }));
                    }
                    break;
            }
        });
    }

    // Special case for ASIN
    if (tags.TXXX && tags.TXXX.ASIN) {
        metadata.asin = tags.TXXX.ASIN;
    }

    // Include raw tags for debugging
    metadata._rawTags = tags;

    return metadata;
}

/**
 * Transform music-metadata format to standardized metadata
 * @param {Object} common - Common metadata from music-metadata
 * @param {Object} format - Format metadata from music-metadata
 * @returns {Object} - Standardized metadata
 */
function transformMusicMetadata(common, format) {
    // Initialize standardized metadata object
    const metadata = {
        title: common.title || null,
        authors: [],
        narrators: [],
        series: null,
        asin: null,
        description: null
    };

    // Extract author/artist
    if (common.artist) {
        metadata.authors = [{ name: common.artist }];
    } else if (common.artists && common.artists.length > 0) {
        metadata.authors = common.artists.map(name => ({ name }));
    }

    // Extract album artist as narrator
    if (common.albumartist) {
        metadata.narrators = [{ name: common.albumartist }];
    }

    // Extract album as potential series
    if (common.album) {
        // Check for series pattern: "Series Name, Book X"
        const seriesMatch = common.album.match(/^(.+?),\s*Book\s*(\d+|[IVX]+)$/i);
        if (seriesMatch) {
            metadata.series = {
                name: seriesMatch[1].trim(),
                position: seriesMatch[2].trim()
            };
        } else {
            metadata.album = common.album;
        }
    }

    // Extract year
    if (common.year) {
        metadata.year = common.year;
    }

    // Extract description from comment
    if (common.comment) {
        metadata.description = common.comment;
    }

    // Duration
    if (format.duration) {
        metadata.duration = Math.round(format.duration / 60); // Convert to minutes
    }

    // Include raw metadata for debugging
    metadata._rawCommon = common;
    metadata._rawFormat = format;

    return metadata;
}

module.exports = {
    extractMetadata,
    extractID3Metadata,
    extractMusicMetadata
};
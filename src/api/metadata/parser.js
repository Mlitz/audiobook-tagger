const { logger } = require('../../core/utils/logger');

/**
 * Utilities for parsing metadata from various sources
 */

/**
 * Extracts ASIN from filename or path
 * @param {string} filename - File name or path to check
 * @returns {string|null} - Extracted ASIN or null if not found
 */
function extractAsinFromFilename(filename) {
    if (!filename) return null;

    // ASIN pattern: B followed by 9 alphanumeric characters
    // Common patterns: directly in filename, inside brackets or parentheses
    const patterns = [
        /\b(B[0-9A-Z]{9})\b/i,                 // Standard ASIN
        /[\[\(]\s*(B[0-9A-Z]{9})\s*[\]\)]/i,   // ASIN in brackets/parentheses
        /ASIN[:\-]?\s*(B[0-9A-Z]{9})/i         // ASIN labeled
    ];

    for (const pattern of patterns) {
        const match = filename.match(pattern);
        if (match && match[1]) {
            logger.debug('Extracted ASIN from filename', {
                filename,
                asin: match[1]
            });
            return match[1];
        }
    }

    logger.debug('No ASIN found in filename', { filename });
    return null;
}

/**
 * Extracts likely title and author from filename
 * @param {string} filename - File name or path to parse
 * @returns {Object} - Object with title and author properties
 */
function extractTitleAuthorFromFilename(filename) {
    if (!filename) {
        return { title: null, author: null };
    }

    // Get just the filename without path or extension
    const basename = filename.split(/[\\/]/).pop() // Remove path
        .replace(/\.[^.]+$/, '')                     // Remove extension
        .trim();

    // Common patterns for filename organization

    // Pattern: "Author - Title"
    let match = basename.match(/^(.+?)\s*[\-–—]\s*(.+)$/);
    if (match) {
        return {
            author: match[1].trim(),
            title: match[2].trim()
        };
    }

    // Pattern: "Title by Author"
    match = basename.match(/^(.+?)\s+by\s+(.+)$/i);
    if (match) {
        return {
            title: match[1].trim(),
            author: match[2].trim()
        };
    }

    // Pattern: "Title (Author)"
    match = basename.match(/^(.+?)\s*[\(\[](.+?)[\)\]]$/);
    if (match) {
        return {
            title: match[1].trim(),
            author: match[2].trim()
        };
    }

    // Common format for audiobooks from some sources: "Title - Author - Narrator"
    match = basename.match(/^(.+?)\s*[\-–—]\s*(.+?)\s*[\-–—]/);
    if (match) {
        return {
            title: match[1].trim(),
            author: match[2].trim()
        };
    }

    // If no pattern matches, assume the entire string is the title
    return {
        title: basename,
        author: null
    };
}

/**
 * Cleans and normalizes search terms
 * @param {string} searchTerm - Raw search term to clean
 * @returns {string} - Cleaned search term
 */
function cleanSearchTerm(searchTerm) {
    if (!searchTerm) return '';

    return searchTerm
        // Remove common file extensions
        .replace(/\.(mp3|m4b|m4a|aax|aa|ogg|flac)$/i, '')
        // Remove common unwanted prefix/suffix
        .replace(/^(audiobook|audio|book)[\s\-_:]+/i, '')
        .replace(/[\s\-_:]+(audiobook|audio|book|unabridged|abridged)$/i, '')
        // Remove track numbers
        .replace(/^(\d+[\s\.\-_:]+)/i, '')
        // Normalize spaces
        .replace(/[\s\-_:]+/g, ' ')
        // Trim whitespace
        .trim();
}

/**
 * Parses series information from a title
 * @param {string} title - Book title
 * @returns {Object} - Object with cleanTitle and series properties
 */
function parseSeriesInfo(title) {
    if (!title) {
        return { cleanTitle: null, series: null };
    }

    // Common series patterns:
    // "Series Name, Book N"
    // "Series Name: Book N"
    // "Series Name (Book N)"
    // "Series Name - Book N"
    // "Title (Series Name, Book N)"

    // Pattern: Title (Series Name, Book N)
    let match = title.match(/^(.+?)\s*[\(\[](.+?),?\s*Book\s*(\d+|[IVX]+)[\)\]]$/i);
    if (match) {
        return {
            cleanTitle: match[1].trim(),
            series: {
                name: match[2].trim(),
                position: match[3].trim()
            }
        };
    }

    // Pattern: Series Name, Book N: Title
    match = title.match(/^(.+?),?\s*Book\s*(\d+|[IVX]+)[\s:\-]+(.+)$/i);
    if (match) {
        return {
            cleanTitle: match[3].trim(),
            series: {
                name: match[1].trim(),
                position: match[2].trim()
            }
        };
    }

    // Pattern: Title - Series Name Book N
    match = title.match(/^(.+?)[\s\-–—]+(.+?)\s+Book\s*(\d+|[IVX]+)$/i);
    if (match) {
        return {
            cleanTitle: match[1].trim(),
            series: {
                name: match[2].trim(),
                position: match[3].trim()
            }
        };
    }

    // Pattern: Series Name Book N - Title
    match = title.match(/^(.+?)\s+Book\s*(\d+|[IVX]+)[\s\-–—]+(.+)$/i);
    if (match) {
        return {
            cleanTitle: match[3].trim(),
            series: {
                name: match[1].trim(),
                position: match[2].trim()
            }
        };
    }

    // No series information found
    return {
        cleanTitle: title,
        series: null
    };
}

/**
 * Parses ID3 tags from MP3 metadata
 * @param {Object} id3Tags - ID3 tag object
 * @returns {Object} - Normalized metadata object
 */
function parseID3Tags(id3Tags) {
    if (!id3Tags) {
        return {};
    }

    const metadata = {};

    // Map common ID3 tags to our metadata format
    const tagMap = {
        TIT2: 'title',
        TPE1: 'artist', // Usually maps to author for audiobooks
        TPE2: 'albumArtist', // Sometimes used for narrator
        TALB: 'album', // Sometimes used for series or book title
        TYER: 'year',
        TPUB: 'publisher',
        TCOM: 'composer', // Sometimes used for author
        TCON: 'genre',
        COMM: 'comments', // Often contains description
        TCOP: 'copyright',
        APIC: 'coverArt'
    };

    // Extract standard tags
    Object.entries(tagMap).forEach(([id3Key, metadataKey]) => {
        if (id3Tags[id3Key] !== undefined && id3Tags[id3Key] !== null) {
            // Handle special case for cover art
            if (id3Key === 'APIC') {
                if (id3Tags[id3Key].data) {
                    metadata.coverArt = {
                        data: id3Tags[id3Key].data,
                        mimeType: id3Tags[id3Key].format || 'image/jpeg'
                    };
                }
            } else {
                metadata[metadataKey] = id3Tags[id3Key].text || id3Tags[id3Key];
            }
        }
    });

    // Handle special case for audiobook-specific tags
    // These might be in custom TXXX frames
    if (id3Tags.TXXX) {
        const customTags = Array.isArray(id3Tags.TXXX) ? id3Tags.TXXX : [id3Tags.TXXX];

        customTags.forEach(tag => {
            if (!tag.description || !tag.text) return;

            const desc = tag.description.toLowerCase();

            // Map common audiobook custom tags
            if (desc.includes('narrator')) {
                metadata.narrator = tag.text;
            } else if (desc.includes('series')) {
                metadata.series = tag.text;
            } else if (desc.includes('part') || desc.includes('position')) {
                metadata.seriesPosition = tag.text;
            } else if (desc.includes('asin')) {
                metadata.asin = tag.text;
            } else if (desc.includes('subtitle')) {
                metadata.subtitle = tag.text;
            } else if (desc.includes('summary') || desc.includes('description')) {
                metadata.description = tag.text;
            }
        });
    }

    // Try to detect if artist is actually author
    if (metadata.artist && !metadata.author) {
        metadata.author = metadata.artist;
    }

    return metadata;
}

module.exports = {
    extractAsinFromFilename,
    extractTitleAuthorFromFilename,
    cleanSearchTerm,
    parseSeriesInfo,
    parseID3Tags
};
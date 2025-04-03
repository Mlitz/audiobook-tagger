const { logger } = require('../../core/utils/logger');

/**
 * Utilities for mapping metadata between different formats
 */

/**
 * Maps Audnexus API book data to ID3v2.4 tag format
 * @param {Object} bookData - Book metadata from Audnexus API
 * @returns {Object} - Mapped ID3 tags object
 */
function mapBookToID3Tags(bookData) {
    if (!bookData) {
        logger.warn('No book data provided for ID3 mapping');
        return {};
    }

    logger.debug('Mapping book data to ID3 tags', { asin: bookData.asin });

    // Create ID3 tags object
    const id3Tags = {};

    // Basic fields
    if (bookData.title) {
        id3Tags.TIT2 = bookData.title;
    }

    // Authors mapped to artists (TPE1)
    if (bookData.authors && bookData.authors.length > 0) {
        id3Tags.TPE1 = bookData.authors.map(author => author.name).join('; ');

        // Store first author as composer too for compatibility
        id3Tags.TCOM = bookData.authors[0].name;
    }

    // Narrators mapped to album artist (TPE2)
    if (bookData.narrators && bookData.narrators.length > 0) {
        id3Tags.TPE2 = bookData.narrators.map(narrator => narrator.name).join('; ');

        // Store narrator info in custom frame
        id3Tags.TXXX = id3Tags.TXXX || [];
        id3Tags.TXXX.push({
            description: 'NARRATOR',
            text: bookData.narrators.map(narrator => narrator.name).join('; ')
        });
    }

    // Series info in album field
    if (bookData.series) {
        // If series and position, format as "Series Name, Book X"
        if (bookData.series.position) {
            id3Tags.TALB = `${bookData.series.name}, Book ${bookData.series.position}`;
        } else {
            id3Tags.TALB = bookData.series.name;
        }

        // Store series info in custom frames
        id3Tags.TXXX = id3Tags.TXXX || [];
        id3Tags.TXXX.push({
            description: 'SERIES',
            text: bookData.series.name
        });

        if (bookData.series.position) {
            id3Tags.TXXX.push({
                description: 'SERIES_POSITION',
                text: bookData.series.position.toString()
            });
        }
    } else if (bookData.title) {
        // If no series, use title as album
        id3Tags.TALB = bookData.title;
    }

    // Store ASIN in custom frame
    if (bookData.asin) {
        id3Tags.TXXX = id3Tags.TXXX || [];
        id3Tags.TXXX.push({
            description: 'ASIN',
            text: bookData.asin
        });
    }

    // Release date to year
    if (bookData.releaseDate) {
        // Extract year from ISO date
        const year = bookData.releaseDate.substring(0, 4);
        id3Tags.TYER = year;
    }

    // Publisher
    if (bookData.publisherName) {
        id3Tags.TPUB = bookData.publisherName;
    }

    // Genres (using standard ID3 genre field)
    if (bookData.genres && bookData.genres.length > 0) {
        id3Tags.TCON = bookData.genres.join('; ');
    }

    // Description/summary in comments
    if (bookData.summary) {
        id3Tags.COMM = {
            language: 'eng',
            description: '',
            text: bookData.summary
        };
    }

    // Copyright
    if (bookData.copyright) {
        id3Tags.TCOP = bookData.copyright;
    }

    // Additional audiobook-specific metadata in custom frames
    id3Tags.TXXX = id3Tags.TXXX || [];

    // Subtitle if available
    if (bookData.subtitle) {
        id3Tags.TXXX.push({
            description: 'SUBTITLE',
            text: bookData.subtitle
        });
    }

    // Duration
    if (bookData.duration) {
        id3Tags.TXXX.push({
            description: 'RUNTIME',
            text: `${bookData.duration} minutes`
        });
    }

    // Language
    if (bookData.language) {
        id3Tags.TXXX.push({
            description: 'LANGUAGE',
            text: bookData.language
        });
    }

    // isAbridged flag
    if (bookData.isAbridged !== undefined) {
        id3Tags.TXXX.push({
            description: 'ABRIDGED',
            text: bookData.isAbridged ? 'Yes' : 'No'
        });
    }

    logger.debug('Mapped ID3 tags', {
        tagCount: Object.keys(id3Tags).length,
        customFields: id3Tags.TXXX ? id3Tags.TXXX.length : 0
    });

    return id3Tags;
}

/**
 * Maps Audnexus API book data to M4B/iTunes metadata format
 * @param {Object} bookData - Book metadata from Audnexus API
 * @returns {Object} - Mapped M4B/iTunes metadata object
 */
function mapBookToM4BTags(bookData) {
    if (!bookData) {
        logger.warn('No book data provided for M4B mapping');
        return {};
    }

    logger.debug('Mapping book data to M4B tags', { asin: bookData.asin });

    // Create M4B/iTunes metadata object
    const m4bTags = {};

    // Basic fields
    if (bookData.title) {
        m4bTags.title = bookData.title;
    }

    // Subtitle as part of title if available
    if (bookData.subtitle) {
        m4bTags.title = `${m4bTags.title}: ${bookData.subtitle}`;
        m4bTags.subtitle = bookData.subtitle;
    }

    // Author
    if (bookData.authors && bookData.authors.length > 0) {
        m4bTags.artist = bookData.authors.map(author => author.name).join(', ');
        m4bTags.author = m4bTags.artist; // Author tag is an iTunes extension
    }

    // Narrator (iTunes-specific)
    if (bookData.narrators && bookData.narrators.length > 0) {
        m4bTags.narrator = bookData.narrators.map(narrator => narrator.name).join(', ');
    }

    // Publisher (iTunes-specific)
    if (bookData.publisherName) {
        m4bTags.publisher = bookData.publisherName;
    }

    // Album is set to same as title, unless part of series
    if (bookData.series) {
        if (bookData.series.position) {
            m4bTags.album = `${bookData.series.name}, Book ${bookData.series.position}`;

            // Track number in series if position is numeric
            const position = parseInt(bookData.series.position, 10);
            if (!isNaN(position)) {
                m4bTags.track = position;
            }
        } else {
            m4bTags.album = bookData.series.name;
        }

        // Store series info explicitly
        m4bTags.series = bookData.series.name;
        if (bookData.series.position) {
            m4bTags.seriesPosition = bookData.series.position.toString();
        }
    } else {
        m4bTags.album = bookData.title;
    }

    // Genres (comma-separated)
    if (bookData.genres && bookData.genres.length > 0) {
        m4bTags.genre = bookData.genres.join(', ');
    } else {
        // Default genre for audiobooks
        m4bTags.genre = 'Audiobook';
    }

    // Year from release date
    if (bookData.releaseDate) {
        const year = parseInt(bookData.releaseDate.substring(0, 4), 10);
        if (!isNaN(year)) {
            m4bTags.year = year;
        }
    }

    // Description/summary
    if (bookData.summary) {
        m4bTags.description = bookData.summary;
        m4bTags.longDescription = bookData.summary;
    }

    // Copyright
    if (bookData.copyright) {
        m4bTags.copyright = bookData.copyright;
    }

    // Media type (iTunes-specific)
    m4bTags.mediaType = 2; // Audiobook type

    // ASIN as comment
    if (bookData.asin) {
        m4bTags.comment = `ASIN: ${bookData.asin}`;
        m4bTags.asin = bookData.asin;
    }

    // Additional fields
    if (bookData.language) {
        m4bTags.language = bookData.language;
    }

    if (bookData.isAbridged !== undefined) {
        m4bTags.isAbridged = bookData.isAbridged;
    }

    logger.debug('Mapped M4B tags', {
        tagCount: Object.keys(m4bTags).length
    });

    return m4bTags;
}

/**
 * Maps ID3 tags to an internal metadata format
 * @param {Object} id3Tags - ID3 tag data
 * @returns {Object} - Internal metadata format
 */
function mapID3TagsToMetadata(id3Tags) {
    if (!id3Tags) {
        return {};
    }

    const metadata = {};

    // Extract basic fields
    if (id3Tags.TIT2) {
        metadata.title = typeof id3Tags.TIT2 === 'object' ? id3Tags.TIT2.text : id3Tags.TIT2;
    }

    // Author information (from Artist/TPE1)
    if (id3Tags.TPE1) {
        const authorText = typeof id3Tags.TPE1 === 'object' ? id3Tags.TPE1.text : id3Tags.TPE1;
        metadata.authors = authorText.split(/;\s*/).map(name => ({ name }));
    }

    // Narrator information (from Album Artist/TPE2)
    if (id3Tags.TPE2) {
        const narratorText = typeof id3Tags.TPE2 === 'object' ? id3Tags.TPE2.text : id3Tags.TPE2;
        metadata.narrators = narratorText.split(/;\s*/).map(name => ({ name }));
    }

    // Album might contain series information
    if (id3Tags.TALB) {
        const albumText = typeof id3Tags.TALB === 'object' ? id3Tags.TALB.text : id3Tags.TALB;
        metadata.album = albumText;

        // Try to extract series info from album
        const seriesMatch = albumText.match(/^(.+?),\s*Book\s*(\d+|[IVX]+)$/i);
        if (seriesMatch) {
            metadata.series = {
                name: seriesMatch[1].trim(),
                position: seriesMatch[2].trim()
            };
        }
    }

    // Year
    if (id3Tags.TYER) {
        metadata.year = typeof id3Tags.TYER === 'object' ? id3Tags.TYER.text : id3Tags.TYER;
    }

    // Publisher
    if (id3Tags.TPUB) {
        metadata.publisher = typeof id3Tags.TPUB === 'object' ? id3Tags.TPUB.text : id3Tags.TPUB;
    }

    // Genre
    if (id3Tags.TCON) {
        const genreText = typeof id3Tags.TCON === 'object' ? id3Tags.TCON.text : id3Tags.TCON;
        metadata.genres = genreText.split(/;\s*/);
    }

    // Description from comments
    if (id3Tags.COMM) {
        if (typeof id3Tags.COMM === 'object') {
            metadata.description = id3Tags.COMM.text;
        } else {
            metadata.description = id3Tags.COMM;
        }
    }

    // Copyright
    if (id3Tags.TCOP) {
        metadata.copyright = typeof id3Tags.TCOP === 'object' ? id3Tags.TCOP.text : id3Tags.TCOP;
    }

    // Process custom tags in TXXX frames
    if (id3Tags.TXXX) {
        const customTags = Array.isArray(id3Tags.TXXX) ? id3Tags.TXXX : [id3Tags.TXXX];

        customTags.forEach(tag => {
            if (!tag.description || !tag.text) return;

            const description = tag.description.toUpperCase();

            switch (description) {
                case 'ASIN':
                    metadata.asin = tag.text;
                    break;

                case 'NARRATOR':
                case 'NARRATORS':
                    if (!metadata.narrators) {
                        metadata.narrators = tag.text.split(/;\s*/).map(name => ({ name }));
                    }
                    break;

                case 'SERIES':
                    if (!metadata.series) {
                        metadata.series = { name: tag.text };
                    } else {
                        metadata.series.name = tag.text;
                    }
                    break;

                case 'SERIES_POSITION':
                case 'SERIESPOSITION':
                case 'SERIES_PART':
                    if (!metadata.series) {
                        metadata.series = { position: tag.text };
                    } else {
                        metadata.series.position = tag.text;
                    }
                    break;

                case 'SUBTITLE':
                    metadata.subtitle = tag.text;
                    break;

                case 'DESCRIPTION':
                case 'SUMMARY':
                    metadata.description = tag.text;
                    break;

                case 'RUNTIME':
                case 'DURATION':
                    // Extract numeric duration if possible
                    const durationMatch = tag.text.match(/(\d+)/);
                    if (durationMatch) {
                        metadata.duration = parseInt(durationMatch[1], 10);
                    } else {
                        metadata.durationText = tag.text;
                    }
                    break;

                case 'LANGUAGE':
                    metadata.language = tag.text;
                    break;

                case 'ABRIDGED':
                    metadata.isAbridged = tag.text.toLowerCase() === 'yes';
                    break;
            }
        });
    }

    return metadata;
}

module.exports = {
    mapBookToID3Tags,
    mapBookToM4BTags,
    mapID3TagsToMetadata
};
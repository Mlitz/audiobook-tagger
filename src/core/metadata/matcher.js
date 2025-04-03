const { logger } = require('../utils/logger');
const {
    extractTitleAuthorFromFilename,
    parseSeriesInfo,
    cleanSearchTerm
} = require('../../api/metadata/parser');

/**
 * Basic metadata matching utilities
 * Provides functionality for matching files with metadata
 */

/**
 * Generate search terms from a file path
 * @param {string} filePath - File path to extract search terms from
 * @returns {Object} - Search terms including title, author, etc.
 */
function generateSearchTerms(filePath) {
    logger.debug('Generating search terms from file path', { filePath });

    // Extract basic title and author from filename
    const { title, author } = extractTitleAuthorFromFilename(filePath);

    // If we don't have a title, we can't search
    if (!title) {
        logger.debug('No title extracted from filename', { filePath });
        return { title: null, author: null, series: null };
    }

    // Clean up the title and check for series info
    const cleanTitle = cleanSearchTerm(title);
    const seriesInfo = parseSeriesInfo(cleanTitle);

    // Clean up the author if available
    const cleanAuthor = author ? cleanSearchTerm(author) : null;

    const searchTerms = {
        title: seriesInfo.cleanTitle || cleanTitle,
        author: cleanAuthor,
        series: seriesInfo.series
    };

    logger.debug('Generated search terms', {
        filePath,
        searchTerms
    });

    return searchTerms;
}

/**
 * Calculate a match score between file info and metadata
 * @param {Object} fileInfo - Information extracted from the file
 * @param {Object} metadata - Metadata to match against
 * @returns {number} - Match score between 0-1 (1 being perfect match)
 */
function calculateMatchScore(fileInfo, metadata) {
    if (!fileInfo || !metadata) {
        return 0;
    }

    let score = 0;
    let maxScore = 0;

    // Title matching (highest weight)
    if (fileInfo.title && metadata.title) {
        maxScore += 60;
        const titleScore = calculateStringMatchScore(fileInfo.title, metadata.title);
        score += titleScore * 60;
    }

    // Author matching
    if (fileInfo.author && metadata.authors && metadata.authors.length > 0) {
        maxScore += 30;

        // Get best author match
        const authorMatches = metadata.authors.map(author =>
            calculateStringMatchScore(fileInfo.author, author.name)
        );
        const bestAuthorMatch = Math.max(...authorMatches, 0);
        score += bestAuthorMatch * 30;
    }

    // Series matching
    if (fileInfo.series && metadata.series) {
        maxScore += 10;

        // Match series name
        const seriesNameScore = calculateStringMatchScore(
            fileInfo.series.name,
            metadata.series.name
        );

        // Match series position if available
        let seriesPositionScore = 0;
        if (fileInfo.series.position && metadata.series.position) {
            // Direct match of position
            if (fileInfo.series.position.toString() === metadata.series.position.toString()) {
                seriesPositionScore = 1;
            } else {
                // Try numeric comparison if both are numbers
                const filePosition = parseInt(fileInfo.series.position, 10);
                const metaPosition = parseInt(metadata.series.position, 10);

                if (!isNaN(filePosition) && !isNaN(metaPosition) && filePosition === metaPosition) {
                    seriesPositionScore = 1;
                }
            }
        }

        // Combine series match scores (name is more important than position)
        const combinedSeriesScore = seriesNameScore * 0.7 + seriesPositionScore * 0.3;
        score += combinedSeriesScore * 10;
    }

    // If no criteria were matched, return 0
    if (maxScore === 0) {
        return 0;
    }

    // Normalize score to 0-1 range
    return score / maxScore;
}

/**
 * Calculate match score between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Match score between 0-1
 * @private
 */
function calculateStringMatchScore(str1, str2) {
    if (!str1 || !str2) {
        return 0;
    }

    // Normalize strings for comparison
    const norm1 = normalizeString(str1);
    const norm2 = normalizeString(str2);

    // Check for exact match
    if (norm1 === norm2) {
        return 1;
    }

    // Check if one is contained within the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        const lengthRatio = Math.min(norm1.length, norm2.length) /
            Math.max(norm1.length, norm2.length);
        return 0.8 * lengthRatio;
    }

    // Calculate word-based similarity
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);

    let matchingWords = 0;
    for (const word1 of words1) {
        // Skip very short words
        if (word1.length < 3) continue;

        for (const word2 of words2) {
            // Skip very short words
            if (word2.length < 3) continue;

            if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                matchingWords++;
                break;
            }
        }
    }

    const wordSimilarity = matchingWords / Math.max(words1.length, words2.length);

    // Calculate character-level similarity using a simple approach
    const longerLength = Math.max(norm1.length, norm2.length);
    const shorterLength = Math.min(norm1.length, norm2.length);

    // Calculate edit distance (simple version for Phase 1)
    let sameCharCount = 0;
    for (let i = 0; i < shorterLength; i++) {
        if (norm1[i] === norm2[i]) {
            sameCharCount++;
        }
    }

    const charSimilarity = sameCharCount / longerLength;

    // Combine scores, giving more weight to word matches
    return wordSimilarity * 0.7 + charSimilarity * 0.3;
}

/**
 * Normalize string for comparison
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 * @private
 */
function normalizeString(str) {
    return str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')  // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();
}

/**
 * Rank metadata results by match score
 * @param {Object} fileInfo - Information extracted from the file
 * @param {Array<Object>} results - Metadata results to rank
 * @returns {Array<Object>} - Results with match scores, sorted by score
 */
function rankMetadataResults(fileInfo, results) {
    if (!fileInfo || !results || !Array.isArray(results)) {
        return [];
    }

    // Calculate scores for each result
    const scoredResults = results.map(result => {
        const score = calculateMatchScore(fileInfo, result);
        return { ...result, _matchScore: score };
    });

    // Sort by match score (descending)
    return scoredResults.sort((a, b) => b._matchScore - a._matchScore);
}

module.exports = {
    generateSearchTerms,
    calculateMatchScore,
    rankMetadataResults
};
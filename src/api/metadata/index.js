/**
 * Metadata processing module
 * Exports utilities for metadata parsing, mapping, and transformation
 */

const parser = require('./parser');
const mapper = require('./mapper');

// Re-export all functions from parser and mapper
module.exports = {
    // Parser utilities
    extractAsinFromFilename: parser.extractAsinFromFilename,
    extractTitleAuthorFromFilename: parser.extractTitleAuthorFromFilename,
    cleanSearchTerm: parser.cleanSearchTerm,
    parseSeriesInfo: parser.parseSeriesInfo,
    parseID3Tags: parser.parseID3Tags,

    // Mapper utilities
    mapBookToID3Tags: mapper.mapBookToID3Tags,
    mapBookToM4BTags: mapper.mapBookToM4BTags,
    mapID3TagsToMetadata: mapper.mapID3TagsToMetadata
};
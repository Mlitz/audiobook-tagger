/**
 * File Scanner module
 * Provides utilities for scanning directories and filtering audio files
 */

const path = require('path');
const fs = require('fs').promises;
const { FileEvents } = require('../events/types');
const { logger } = require('../utils/logger');
const { SUPPORTED_EXTENSIONS, isSupportedAudioFormat } = require('./service');

/**
 * Scanner class for finding audiobook files
 */
class FileScanner {
    /**
     * Create a new FileScanner
     * @param {Object} options - Scanner options
     * @param {Object} options.fileSystemService - FileSystem service
     * @param {Object} options.eventSystem - Event system for broadcasting events
     * @param {Object} options.config - Scanner configuration
     */
    constructor(options = {}) {
        const { fileSystemService, eventSystem, config = {} } = options;

        if (!fileSystemService) {
            throw new Error('FileSystem service is required');
        }

        this.fs = fileSystemService;
        this.events = eventSystem;
        this.config = config;

        // Default filter options
        this.defaultFilterOptions = {
            minSize: config.minFileSize || 1024 * 1024, // 1MB default minimum
            maxSize: config.maxFileSize || 5 * 1024 * 1024 * 1024, // 5GB default maximum
            extensions: [...SUPPORTED_EXTENSIONS],
            excludePatterns: config.excludePatterns || [/^\\./], // Default exclude hidden files
        };

        logger.info('FileScanner initialized');
    }

    /**
     * Scan a single directory for audiobook files
     * @param {string} dirPath - Directory path to scan
     * @param {Object} options - Scan options
     * @returns {Promise<Array<Object>>} - Array of found audiobook files with metadata
     */
    async scanDirectory(dirPath, options = {}) {
        try {
            // Emit event for scan started
            if (this.events) {
                this.events.emit(FileEvents.SCAN_STARTED, {
                    dirPath,
                    options,
                });
            }

            logger.info(`Starting scan for audiobooks in: ${dirPath}`);

            // Use the file system service to scan the directory
            const allFiles = await this.fs.scanDirectory(dirPath, options);

            // Filter for audiobook files
            const audiobooks = await this.filterAudiobooks(allFiles, options);

            logger.info(`Scan completed: ${audiobooks.length} audiobooks found`, {
                total: allFiles.length,
                dirPath,
            });

            // Emit event for scan completed
            if (this.events) {
                this.events.emit(FileEvents.SCAN_COMPLETED, {
                    dirPath,
                    fileCount: audiobooks.length,
                    totalFiles: allFiles.length,
                });
            }

            return audiobooks;
        } catch (error) {
            logger.error(`Error scanning directory: ${dirPath}`, { error });

            // Emit event for scan error
            if (this.events) {
                this.events.emit(FileEvents.SCAN_FAILED, {
                    dirPath,
                    error,
                });
            }

            throw error;
        }
    }

    /**
     * Filter a list of files to only include valid audiobooks
     * @param {Array<Object>} files - List of file objects
     * @param {Object} options - Filter options
     * @returns {Promise<Array<Object>>} - Filtered list of audiobook files
     */
    async filterAudiobooks(files, options = {}) {
        // Merge with default filter options
        const filterOptions = {
            ...this.defaultFilterOptions,
            ...(options.filter || {}),
        };

        // Initialize progress counter
        let processedCount = 0;
        const totalCount = files.length;

        // Filter files based on criteria
        const audiobooks = files.filter((file) => {
            // Update progress periodically
            processedCount++;
            if (processedCount % 100 === 0 || processedCount === totalCount) {
                if (this.events) {
                    this.events.emit(FileEvents.SCAN_PROGRESS, {
                        processed: processedCount,
                        total: totalCount,
                        percentage: Math.floor((processedCount / totalCount) * 100),
                    });
                }
            }

            // Check file extension
            if (!isSupportedAudioFormat(file.path)) {
                return false;
            }

            // Check file size
            if (
                file.size < filterOptions.minSize ||
                file.size > filterOptions.maxSize
            ) {
                return false;
            }

            // Check exclude patterns
            for (const pattern of filterOptions.excludePatterns) {
                if (pattern instanceof RegExp) {
                    if (pattern.test(file.path)) {
                        return false;
                    }
                } else if (typeof pattern === 'string') {
                    if (file.path.includes(pattern)) {
                        return false;
                    }
                }
            }

            // All checks passed
            return true;
        });

        return audiobooks;
    }

    /**
     * Group files by potential books (handle multi-file audiobooks)
     * @param {Array<Object>} files - List of audiobook files
     * @returns {Array<Object>} - Grouped books, each containing one or more files
     */
    groupFilesByBooks(files) {
        // Clone the array to avoid modifying the original
        const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name));
        const books = [];
        const bookMap = new Map();

        for (const file of sortedFiles) {
            const bookKey = this._identifyBookKey(file);

            if (!bookMap.has(bookKey)) {
                // Create a new book entry
                const book = {
                    key: bookKey,
                    name: this._extractBookName(file.name),
                    directory: file.directory,
                    files: [file],
                    totalSize: file.size,
                };
                books.push(book);
                bookMap.set(bookKey, book);
            } else {
                // Add file to existing book
                const book = bookMap.get(bookKey);
                book.files.push(file);
                book.totalSize += file.size;
            }
        }

        // Sort files within each book by chapter/track order
        for (const book of books) {
            book.files.sort((a, b) => {
                // Try to extract track/chapter numbers for sorting
                const numA = this._extractTrackNumber(a.name) || 0;
                const numB = this._extractTrackNumber(b.name) || 0;
                return numA - numB;
            });
        }

        return books;
    }

    /**
     * Extract a track or chapter number from filename
     * @param {string} filename - File name to analyze
     * @returns {number|null} - Track number or null if not found
     * @private
     */
    _extractTrackNumber(filename) {
        // Common patterns for track numbers in filenames:
        // - track01, track_01, track-01
        // - 01 - Title
        // - Chapter 01
        const patterns = [
            /track[_-\s]*(\d+)/i,
            /chapter[_-\s]*(\d+)/i,
            /^(\d+)[_-\s]+/,
            /\s(\d+)\s*\.[^.]+$/,
        ];

        for (const pattern of patterns) {
            const match = filename.match(pattern);
            if (match && match[1]) {
                return parseInt(match[1], 10);
            }
        }

        return null;
    }

    /**
     * Generate a unique key for identifying a book from its file
     * @param {Object} file - File object
     * @returns {string} - Unique book identifier
     * @private
     */
    _identifyBookKey(file) {
        // Get the base name without extension
        const baseName = path.basename(file.name, file.extension);

        // Remove common track/chapter number patterns
        let bookName = baseName
            .replace(/^(\d+)[_-\s]+/, '') // Remove leading numbers like "01 - "
            .replace(/track[_-\s]*\d+[_-\s]*/i, '') // Remove "track01" patterns
            .replace(/chapter[_-\s]*\d+[_-\s]*/i, '') // Remove "chapter01" patterns
            .replace(/\s+part\s*\d+$/i, '') // Remove trailing "part X"
            .replace(/\s+disc\s*\d+$/i, '') // Remove trailing "disc X"
            .trim();

        // If we've stripped too much, just use directory name + base filename
        if (bookName.length < 3 && baseName.length > 0) {
            bookName = baseName;
        }

        // Create a key from directory + cleaned book name
        const dirBaseName = path.basename(file.directory);
        return `${dirBaseName}_${bookName}`.toLowerCase();
    }

    /**
     * Extract a human-readable book name from a filename
     * @param {string} filename - File name
     * @returns {string} - Human-readable book name
     * @private
     */
    _extractBookName(filename) {
        // Remove extension
        const baseName = path.basename(filename, path.extname(filename));

        // Clean up common patterns
        return baseName
            .replace(/^(\d+)[_-\s]+/, '') // Remove leading numbers
            .replace(/track[_-\s]*\d+[_-\s]*/i, '') // Remove "track01" patterns
            .replace(/chapter[_-\s]*\d+[_-\s]*/i, '') // Remove "chapter01" patterns
            .replace(/\s+part\s*\d+$/i, '') // Remove trailing "part X"
            .replace(/\s+disc\s*\d+$/i, '') // Remove trailing "disc X"
            .replace(/[_-]+/g, ' ') // Replace underscores and hyphens with spaces
            .trim();
    }
}

/**
 * Initialize the file scanner
 * @param {Object} options - Initialization options
 * @returns {FileScanner} - Initialized scanner
 */
function initializeFileScanner(options = {}) {
    return new FileScanner(options);
}

module.exports = {
    FileScanner,
    initializeFileScanner,
};
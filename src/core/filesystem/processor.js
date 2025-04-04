/**
 * File Processor
 * Integrates filesystem scanning with metadata extraction and processing
 */

const path = require('path');
const { FileEvents } = require('../events/types');
const { logger } = require('../utils/logger');
const { createQueue } = require('../utils/async');
const { extractMetadata } = require('./metadata-extractor');

/**
 * File Processor class for processing audiobook files
 */
class FileProcessor {
    /**
     * Create a new FileProcessor
     * @param {Object} options - Processor options
     * @param {Object} options.fileSystemService - FileSystem service
     * @param {Object} options.fileScanner - File scanner
     * @param {Object} options.fileOrganizer - File organizer
     * @param {Object} options.metadataProcessor - Metadata processor
     * @param {Object} options.eventSystem - Event system for broadcasting events
     * @param {Object} options.config - Processor configuration
     */
    constructor(options = {}) {
        const {
            fileSystemService,
            fileScanner,
            fileOrganizer,
            metadataProcessor,
            eventSystem,
            config = {}
        } = options;

        // Validate required dependencies
        if (!fileSystemService) {
            throw new Error('FileSystem service is required');
        }
        if (!fileScanner) {
            throw new Error('FileScanner is required');
        }
        if (!metadataProcessor) {
            throw new Error('MetadataProcessor is required');
        }

        this.fs = fileSystemService;
        this.scanner = fileScanner;
        this.organizer = fileOrganizer;
        this.metadata = metadataProcessor;
        this.events = eventSystem;
        this.config = config;

        // Create processing queue
        this.processingQueue = createQueue(config.concurrentProcessing || 2);

        logger.info('FileProcessor initialized');
    }

    /**
     * Process a directory of audiobook files
     * @param {string} dirPath - Directory path to process
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processing results
     */
    async processDirectory(dirPath, options = {}) {
        try {
            logger.info(`Starting to process directory: ${dirPath}`);

            // Emit event for processing started
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_STARTED, {
                    dirPath,
                    options
                });
            }

            // Scan the directory for audiobook files
            const files = await this.scanner.scanDirectory(dirPath, options);
            logger.info(`Found ${files.length} audiobook files to process`);

            // Group files by potential books (for multi-file audiobooks)
            const books = this.scanner.groupFilesByBooks(files);
            logger.info(`Grouped into ${books.length} potential books`);

            // Process each book
            const results = {
                processed: 0,
                failed: 0,
                skipped: 0,
                books: []
            };

            let processedCount = 0;
            const totalCount = books.length;

            // Process each book (could be single or multiple files)
            for (const book of books) {
                try {
                    // Process the book
                    const bookResult = await this.processBook(book, options);
                    results.books.push(bookResult);

                    // Update counters based on result
                    if (bookResult.status === 'processed') {
                        results.processed++;
                    } else if (bookResult.status === 'failed') {
                        results.failed++;
                    } else if (bookResult.status === 'skipped') {
                        results.skipped++;
                    }

                    // Update progress
                    processedCount++;
                    if (this.events) {
                        this.events.emit(FileEvents.BATCH_PROGRESS, {
                            processed: processedCount,
                            total: totalCount,
                            percentage: Math.floor((processedCount / totalCount) * 100),
                            success: results.processed,
                            failed: results.failed,
                            skipped: results.skipped
                        });
                    }
                } catch (error) {
                    logger.error(`Error processing book: ${book.name}`, { error });
                    results.failed++;
                    results.books.push({
                        name: book.name,
                        status: 'failed',
                        error: error.message
                    });
                }
            }

            // Emit event for processing completed
            if (this.events) {
                this.events.emit(FileEvents.BATCH_COMPLETED, {
                    dirPath,
                    processed: results.processed,
                    failed: results.failed,
                    skipped: results.skipped,
                    total: books.length
                });
            }

            logger.info(`Directory processing completed: ${dirPath}`, {
                processed: results.processed,
                failed: results.failed,
                skipped: results.skipped,
                total: books.length
            });

            return results;
        } catch (error) {
            logger.error(`Error processing directory: ${dirPath}`, { error });

            // Emit event for processing failed
            if (this.events) {
                this.events.emit(FileEvents.BATCH_FAILED, {
                    dirPath,
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Process a single book (may be multiple files)
     * @param {Object} book - Book object with files
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processing result for the book
     */
    async processBook(book, options = {}) {
        const primaryFile = book.files[0];
        const filePath = primaryFile.path;

        try {
            logger.info(`Processing book: ${book.name}`, {
                fileCount: book.files.length,
                path: filePath
            });

            // Emit event for file processing started
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_STARTED, {
                    filePath,
                    bookName: book.name,
                    files: book.files.length
                });
            }

            // Extract existing metadata from the file
            const existingMetadata = await extractMetadata(filePath);

            // Try to find metadata from API
            let apiMetadata = null;
            try {
                // Try to extract metadata from file first
                apiMetadata = await this.metadata.extractMetadataFromFile(filePath, existingMetadata);
            } catch (error) {
                logger.warn(`Could not retrieve API metadata for: ${book.name}`, { error });
            }

            // If no API metadata found, use existing metadata
            const finalMetadata = apiMetadata || existingMetadata || {};

            // In Phase 1, we're just detecting and extracting metadata, not modifying files
            // In future phases, we would apply metadata back to the files

            // Create result object
            const result = {
                name: book.name,
                files: book.files.length,
                status: apiMetadata ? 'processed' : 'metadata_only',
                metadata: {
                    title: finalMetadata.title || book.name,
                    authors: finalMetadata.authors || [],
                    narrators: finalMetadata.narrators || [],
                    series: finalMetadata.series || null,
                    asin: finalMetadata.asin || null
                }
            };

            // Emit event for file processing completed
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_COMPLETED, {
                    filePath,
                    bookName: book.name,
                    status: result.status,
                    metadata: result.metadata
                });
            }

            logger.info(`Book processing completed: ${book.name}`, {
                status: result.status,
                files: book.files.length
            });

            return result;
        } catch (error) {
            logger.error(`Error processing book: ${book.name}`, { error });

            // Emit event for file processing failed
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_FAILED, {
                    filePath,
                    bookName: book.name,
                    error: error.message
                });
            }

            return {
                name: book.name,
                files: book.files.length,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Process a single file
     * @param {string} filePath - Path to the file
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processing result
     */
    async processFile(filePath, options = {}) {
        try {
            logger.info(`Processing file: ${filePath}`);

            // Emit event for file processing started
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_STARTED, {
                    filePath
                });
            }

            // Check if file exists and is a supported format
            const fileInfo = await this.fs.getFileInfo(filePath);
            if (!fileInfo) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Extract existing metadata from the file
            const existingMetadata = await extractMetadata(filePath);

            // Try to find metadata from API
            let apiMetadata = null;
            try {
                apiMetadata = await this.metadata.extractMetadataFromFile(filePath, existingMetadata);
            } catch (error) {
                logger.warn(`Could not retrieve API metadata for: ${filePath}`, { error });
            }

            // Use API metadata if available, fallback to existing
            const finalMetadata = apiMetadata || existingMetadata || {};

            // Create result object
            const result = {
                name: path.basename(filePath),
                path: filePath,
                status: apiMetadata ? 'processed' : 'metadata_only',
                metadata: {
                    title: finalMetadata.title || path.basename(filePath, path.extname(filePath)),
                    authors: finalMetadata.authors || [],
                    narrators: finalMetadata.narrators || [],
                    series: finalMetadata.series || null,
                    asin: finalMetadata.asin || null
                }
            };

            // Emit event for file processing completed
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_COMPLETED, {
                    filePath,
                    status: result.status,
                    metadata: result.metadata
                });
            }

            logger.info(`File processing completed: ${filePath}`, {
                status: result.status
            });

            return result;
        } catch (error) {
            logger.error(`Error processing file: ${filePath}`, { error });

            // Emit event for file processing failed
            if (this.events) {
                this.events.emit(FileEvents.PROCESSING_FAILED, {
                    filePath,
                    error: error.message
                });
            }

            return {
                name: path.basename(filePath),
                path: filePath,
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Queue a file for processing
     * @param {string} filePath - Path to the file
     * @param {Object} options - Processing options
     * @returns {Promise<Object>} - Processing result
     */
    queueFile(filePath, options = {}) {
        return this.processingQueue.add(() => this.processFile(filePath, options));
    }

    /**
     * Queue multiple files for processing
     * @param {Array<string>} filePaths - Array of file paths
     * @param {Object} options - Processing options
     * @returns {Promise<Array<Object>>} - Array of processing results
     */
    async queueFiles(filePaths, options = {}) {
        if (!Array.isArray(filePaths) || filePaths.length === 0) {
            throw new Error('File paths array is required and cannot be empty');
        }

        const promises = filePaths.map(filePath => this.queueFile(filePath, options));

        try {
            // Emit event for batch processing started
            if (this.events) {
                this.events.emit(FileEvents.BATCH_STARTED, {
                    count: filePaths.length
                });
            }

            // Wait for all files to be processed
            const results = await Promise.all(promises);

            // Calculate summary stats
            const summary = {
                total: results.length,
                processed: results.filter(r => r.status === 'processed').length,
                metadataOnly: results.filter(r => r.status === 'metadata_only').length,
                failed: results.filter(r => r.status === 'failed').length
            };

            // Emit event for batch processing completed
            if (this.events) {
                this.events.emit(FileEvents.BATCH_COMPLETED, {
                    ...summary,
                    files: filePaths.length
                });
            }

            logger.info(`Batch processing completed`, summary);

            return results;
        } catch (error) {
            logger.error(`Error in batch file processing`, { error });

            // Emit event for batch processing failed
            if (this.events) {
                this.events.emit(FileEvents.BATCH_FAILED, {
                    count: filePaths.length,
                    error: error.message
                });
            }

            throw error;
        }
    }

    /**
     * Get the processing queue status
     * @returns {Object} - Current queue status
     */
    getQueueStatus() {
        return this.processingQueue.status();
    }

    /**
     * Clear the processing queue
     * @param {string} reason - Reason for clearing the queue
     * @returns {number} - Number of items cleared from the queue
     */
    clearQueue(reason = 'User requested') {
        return this.processingQueue.clear(reason);
    }

    /**
     * Shutdown the file processor
     */
    async shutdown() {
        logger.info('FileProcessor shutting down');

        // Wait for any in-progress tasks to complete
        await this.processingQueue.waitForAll();
    }
}

/**
 * Initialize the file processor
 * @param {Object} options - Initialization options
 * @returns {FileProcessor} - Initialized processor
 */
function initializeFileProcessor(options = {}) {
    return new FileProcessor(options);
}

module.exports = {
    FileProcessor,
    initializeFileProcessor
};
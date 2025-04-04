/**
 * FileSystem Service
 * Provides utilities for scanning directories and working with audiobook files
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');
const { createContextErrorHandler } = require('../../errors/handler');
const { createQueue, retry } = require('../utils/async');
const { validateNotEmpty, validateFilePath } = require('../utils/validation');

// Create error handler for filesystem context
const errorHandler = createContextErrorHandler('filesystem');

// Supported audio file extensions for audiobooks
const SUPPORTED_EXTENSIONS = [
    '.mp3',
    '.m4a',
    '.m4b',
    '.aac',
    '.ogg',
    '.flac',
    '.opus',
];

// Determine if a file is a supported audiobook format based on extension
function isSupportedAudioFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * FileSystem service for handling file operations
 */
class FileSystemService {
    /**
     * Create a new FileSystemService
     * @param {Object} options - Service options
     * @param {Object} options.config - Filesystem configuration options
     * @param {Object} options.eventSystem - Event system for broadcasting events
     */
    constructor(options = {}) {
        const { config = {}, eventSystem } = options;

        this.config = config;
        this.events = eventSystem;
        this.processingQueue = createQueue(config.concurrentOperations || 2);

        // Default scan options
        this.defaultScanOptions = {
            recursive: true,
            maxDepth: config.maxScanDepth || 5,
            followSymlinks: config.followSymlinks !== false,
            includeHidden: config.includeHidden === true,
            abortSignal: null,
        };

        logger.info('FileSystemService initialized');
    }

    /**
     * Scan a directory for audiobook files
     * @param {string} dirPath - Directory path to scan
     * @param {Object} [options] - Scan options
     * @param {boolean} [options.recursive=true] - Whether to scan recursively
     * @param {number} [options.maxDepth=5] - Maximum recursion depth
     * @param {boolean} [options.followSymlinks=true] - Whether to follow symlinks
     * @param {boolean} [options.includeHidden=false] - Whether to include hidden files
     * @param {AbortSignal} [options.abortSignal=null] - Signal to abort the scan
     * @returns {Promise<Array<Object>>} - Array of found audiobook files with metadata
     */
    async scanDirectory(dirPath, options = {}) {
        try {
            validateFilePath(dirPath, 'Directory path');

            // Merge with default options
            const scanOptions = {
                ...this.defaultScanOptions,
                ...options,
            };

            logger.info(`Starting directory scan: ${dirPath}`, {
                recursive: scanOptions.recursive,
                maxDepth: scanOptions.maxDepth,
            });

            // Check if directory exists
            try {
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    throw new Error(`Path is not a directory: ${dirPath}`);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    throw new Error(`Directory does not exist: ${dirPath}`);
                }
                throw error;
            }

            // Start recursive scan
            const results = await this._scanDirectoryRecursive(
                dirPath,
                scanOptions,
                1
            );

            logger.info(`Scan completed for: ${dirPath}`, {
                fileCount: results.length,
            });

            return results;
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Internal recursive directory scanning implementation
     * @param {string} dirPath - Directory path to scan
     * @param {Object} options - Scan options
     * @param {number} currentDepth - Current recursion depth
     * @returns {Promise<Array<Object>>} - Array of found audiobook files
     * @private
     */
    async _scanDirectoryRecursive(dirPath, options, currentDepth) {
        // Check abort signal
        if (options.abortSignal && options.abortSignal.aborted) {
            logger.info('Scan aborted by abort signal');
            return [];
        }

        // Check depth limit
        if (options.maxDepth > 0 && currentDepth > options.maxDepth) {
            logger.debug(`Max depth reached at: ${dirPath}`);
            return [];
        }

        try {
            // Read directory contents
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            let results = [];

            // Process all entries
            for (const entry of entries) {
                // Skip hidden files/folders if not including hidden
                if (!options.includeHidden && entry.name.startsWith('.')) {
                    continue;
                }

                const fullPath = path.join(dirPath, entry.name);

                if (entry.isDirectory()) {
                    // Process subdirectory if recursive option is enabled
                    if (options.recursive) {
                        const subResults = await this._scanDirectoryRecursive(
                            fullPath,
                            options,
                            currentDepth + 1
                        );
                        results = results.concat(subResults);
                    }
                } else if (entry.isFile()) {
                    // Check if file is a supported audiobook format
                    if (isSupportedAudioFormat(fullPath)) {
                        // Get basic file info
                        const fileInfo = await this.getFileInfo(fullPath);
                        results.push(fileInfo);
                    }
                } else if (entry.isSymbolicLink() && options.followSymlinks) {
                    try {
                        // Resolve symlink
                        const targetPath = await fs.readlink(fullPath);
                        const resolvedPath = path.resolve(dirPath, targetPath);

                        // Check if target is a directory
                        const targetStats = await fs.stat(resolvedPath);

                        if (targetStats.isDirectory() && options.recursive) {
                            // Process target directory
                            const subResults = await this._scanDirectoryRecursive(
                                resolvedPath,
                                options,
                                currentDepth + 1
                            );
                            results = results.concat(subResults);
                        } else if (targetStats.isFile() && isSupportedAudioFormat(resolvedPath)) {
                            // Process target file if it's an audiobook
                            const fileInfo = await this.getFileInfo(resolvedPath);
                            results.push(fileInfo);
                        }
                    } catch (error) {
                        logger.warn(`Error following symlink: ${fullPath}`, { error });
                    }
                }
            }

            return results;
        } catch (error) {
            logger.error(`Error scanning directory: ${dirPath}`, { error });
            return [];
        }
    }

    /**
     * Get file information including basic metadata
     * @param {string} filePath - Path to the file
     * @returns {Promise<Object>} - File information object
     */
    async getFileInfo(filePath) {
        try {
            validateFilePath(filePath, 'File path');

            // Get file stats
            const stats = await fs.stat(filePath);

            // Extract basic information
            const info = {
                path: filePath,
                name: path.basename(filePath),
                directory: path.dirname(filePath),
                extension: path.extname(filePath).toLowerCase(),
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
            };

            return info;
        } catch (error) {
            logger.error(`Error getting file info: ${filePath}`, { error });
            throw error;
        }
    }

    /**
     * Create directories recursively
     * @param {string} dirPath - Directory path to create
     * @returns {Promise<void>}
     */
    async createDirectory(dirPath) {
        try {
            validateFilePath(dirPath, 'Directory path');
            await fs.mkdir(dirPath, { recursive: true });
            logger.debug(`Created directory: ${dirPath}`);
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Check if a file exists
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} - Whether the file exists
     */
    async fileExists(filePath) {
        try {
            validateFilePath(filePath, 'File path');
            await fs.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Copy a file to a new location
     * @param {string} sourcePath - Source file path
     * @param {string} destPath - Destination file path
     * @param {boolean} [overwrite=false] - Whether to overwrite existing files
     * @returns {Promise<string>} - Destination path
     */
    async copyFile(sourcePath, destPath, overwrite = false) {
        try {
            validateFilePath(sourcePath, 'Source path');
            validateFilePath(destPath, 'Destination path');

            // Check if source file exists
            if (!(await this.fileExists(sourcePath))) {
                throw new Error(`Source file does not exist: ${sourcePath}`);
            }

            // Check if destination exists and handle overwrite
            const destExists = await this.fileExists(destPath);
            if (destExists && !overwrite) {
                throw new Error(`Destination file already exists: ${destPath}`);
            }

            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            await this.createDirectory(destDir);

            // Copy the file
            await fs.copyFile(
                sourcePath,
                destPath,
                overwrite ? 0 : fs.constants.COPYFILE_EXCL
            );

            logger.debug(`Copied file: ${sourcePath} -> ${destPath}`);
            return destPath;
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Move a file to a new location
     * @param {string} sourcePath - Source file path
     * @param {string} destPath - Destination file path
     * @param {boolean} [overwrite=false] - Whether to overwrite existing files
     * @returns {Promise<string>} - Destination path
     */
    async moveFile(sourcePath, destPath, overwrite = false) {
        try {
            validateFilePath(sourcePath, 'Source path');
            validateFilePath(destPath, 'Destination path');

            // Check if source file exists
            if (!(await this.fileExists(sourcePath))) {
                throw new Error(`Source file does not exist: ${sourcePath}`);
            }

            // Check if destination exists and handle overwrite
            const destExists = await this.fileExists(destPath);
            if (destExists) {
                if (!overwrite) {
                    throw new Error(`Destination file already exists: ${destPath}`);
                }
                // If overwrite is true, we'll need to remove the existing file
                await fs.unlink(destPath);
            }

            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            await this.createDirectory(destDir);

            // Move the file (rename in Node.js)
            await fs.rename(sourcePath, destPath);

            logger.debug(`Moved file: ${sourcePath} -> ${destPath}`);
            return destPath;
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Delete a file
     * @param {string} filePath - Path to the file
     * @returns {Promise<boolean>} - Whether the operation was successful
     */
    async deleteFile(filePath) {
        try {
            validateFilePath(filePath, 'File path');

            // Check if file exists
            if (!(await this.fileExists(filePath))) {
                logger.warn(`File does not exist, can't delete: ${filePath}`);
                return false;
            }

            // Delete the file
            await fs.unlink(filePath);
            logger.debug(`Deleted file: ${filePath}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting file: ${filePath}`, { error });
            return false;
        }
    }

    /**
     * Read file contents
     * @param {string} filePath - Path to the file
     * @param {Object} options - Read options
     * @returns {Promise<Buffer|string>} - File contents
     */
    async readFile(filePath, options = {}) {
        try {
            validateFilePath(filePath, 'File path');
            return await fs.readFile(filePath, options);
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Write data to a file
     * @param {string} filePath - Path to the file
     * @param {string|Buffer} data - Data to write
     * @param {Object} options - Write options
     * @returns {Promise<void>}
     */
    async writeFile(filePath, data, options = {}) {
        try {
            validateFilePath(filePath, 'File path');

            // Ensure directory exists
            const dirPath = path.dirname(filePath);
            await this.createDirectory(dirPath);

            // Write the file
            await fs.writeFile(filePath, data, options);
            logger.debug(`Wrote file: ${filePath}`);
        } catch (error) {
            return errorHandler.handle(error);
        }
    }

    /**
     * Shutdown the filesystem service
     */
    shutdown() {
        logger.info('FileSystemService shutting down');
        // Nothing specific to clean up at this time
    }
}

/**
 * Initialize the filesystem service
 * @param {Object} options - Initialization options
 * @returns {FileSystemService} - Initialized service
 */
function initializeFileSystemService(options = {}) {
    return new FileSystemService(options);
}

module.exports = {
    FileSystemService,
    initializeFileSystemService,
    isSupportedAudioFormat,
    SUPPORTED_EXTENSIONS
};
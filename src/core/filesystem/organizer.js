/**
 * File Organizer module
 * Handles organizing audiobook files according to Plex conventions
 */

const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../utils/logger');
const { validateNotEmpty, validateFilePath } = require('../utils/validation');

/**
 * FileOrganizer class for organizing audiobook files
 */
class FileOrganizer {
    /**
     * Create a new FileOrganizer
     * @param {Object} options - Organizer options
     * @param {Object} options.fileSystemService - FileSystem service
     * @param {Object} options.eventSystem - Event system for broadcasting events
     * @param {Object} options.config - Organizer configuration
     */
    constructor(options = {}) {
        const { fileSystemService, eventSystem, config = {} } = options;

        if (!fileSystemService) {
            throw new Error('FileSystem service is required');
        }

        this.fs = fileSystemService;
        this.events = eventSystem;
        this.config = config;

        // Default organization templates
        this.templates = {
            // Default template: Author/Series/SeriesPosition. Book Title
            standard: '%author%/%series%/%series_position%. %title%',
            // No series: Author/Book Title
            noSeries: '%author%/%title%',
            // Single file: Author/Book Title.extension
            singleFile: '%author%/%title%',
            // Multi-file: Author/Book Title/Part XX
            multiFile: '%author%/%title%/Part %part_number%',
        };

        // Override with user templates if provided
        if (config.templates) {
            this.templates = {
                ...this.templates,
                ...config.templates,
            };
        }

        logger.info('FileOrganizer initialized');
    }

    /**
     * Generate target path for a file based on its metadata
     * @param {Object} metadata - Audiobook metadata
     * @param {string} sourceFilePath - Source file path
     * @param {string} baseDestDir - Base destination directory
     * @param {Object} options - Additional options
     * @returns {string} - Target path for the file
     */
    generateTargetPath(metadata, sourceFilePath, baseDestDir, options = {}) {
        try {
            validateNotEmpty(baseDestDir, 'Base destination directory');
            validateFilePath(sourceFilePath, 'Source file path');

            if (!metadata) {
                throw new Error('Metadata is required to generate target path');
            }

            // Determine which template to use based on metadata and options
            let template;
            if (options.template) {
                // Use specified template if provided
                template = options.template;
            } else if (options.isMultiFile) {
                // Multi-file audiobook
                template = this.templates.multiFile;
            } else if (metadata.series && metadata.series.name) {
                // Book is part of a series
                template = this.templates.standard;
            } else {
                // Book is not part of a series
                template = this.templates.noSeries;
            }

            // Get file extension from source
            const extension = path.extname(sourceFilePath);

            // Apply template variables
            let targetPath = template;

            // Replace template variables with metadata values
            targetPath = this._replaceTemplateVars(targetPath, metadata, options);

            // Add extension if not already in the template
            if (!targetPath.endsWith(extension)) {
                targetPath += extension;
            }

            // Join with base destination directory
            const fullPath = path.join(baseDestDir, targetPath);

            // Ensure path is safe and valid
            const sanitizedPath = this._sanitizeFilePath(fullPath);

            return sanitizedPath;
        } catch (error) {
            logger.error('Error generating target path', { error });
            throw error;
        }
    }

    /**
     * Replace template variables with actual metadata values
     * @param {string} template - Template string with placeholders
     * @param {Object} metadata - Audiobook metadata
     * @param {Object} options - Additional options
     * @returns {string} - Processed template with values inserted
     * @private
     */
    _replaceTemplateVars(template, metadata, options = {}) {
        // Define replacements
        const replacements = {
            // Basic metadata
            '%title%': metadata.title || 'Unknown Title',
            '%subtitle%': metadata.subtitle || '',
            '%author%': this._formatAuthor(metadata),
            '%narrator%': this._formatNarrator(metadata),
            '%year%': metadata.releaseDate ? metadata.releaseDate.substring(0, 4) : '',
            '%genre%': Array.isArray(metadata.genres) && metadata.genres.length > 0 ? metadata.genres[0] : 'Audiobook',
            '%publisher%': metadata.publisherName || 'Unknown Publisher',
            '%asin%': metadata.asin || '',

            // Series information
            '%series%': metadata.series ? metadata.series.name : 'No Series',
            '%series_position%': metadata.series && metadata.series.position
                ? this._formatSeriesPosition(metadata.series.position)
                : '',

            // Part number (for multi-file audiobooks)
            '%part_number%': options.partNumber ? this._formatPartNumber(options.partNumber) : '',
        };

        // Replace each placeholder with its value
        let result = template;
        for (const [placeholder, value] of Object.entries(replacements)) {
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }

        // Handle empty segments (e.g., no series position)
        result = result.replace(/\/\//g, '/'); // Replace double slashes
        result = result.replace(/\s+\./g, '.'); // Remove spaces before dots
        result = result.replace(/\s+$/g, ''); // Trim trailing spaces

        return result;
    }

    /**
     * Format author names from metadata
     * @param {Object} metadata - Audiobook metadata
     * @returns {string} - Formatted author name
     * @private
     */
    _formatAuthor(metadata) {
        if (!metadata.authors || !Array.isArray(metadata.authors) || metadata.authors.length === 0) {
            return 'Unknown Author';
        }

        // Use primary author (first in the list)
        const author = metadata.authors[0];
        return author.name || 'Unknown Author';
    }

    /**
     * Format narrator names from metadata
     * @param {Object} metadata - Audiobook metadata
     * @returns {string} - Formatted narrator name
     * @private
     */
    _formatNarrator(metadata) {
        if (!metadata.narrators || !Array.isArray(metadata.narrators) || metadata.narrators.length === 0) {
            return 'Unknown Narrator';
        }

        // Use primary narrator (first in the list)
        const narrator = metadata.narrators[0];
        return narrator.name || 'Unknown Narrator';
    }

    /**
     * Format series position to ensure proper sorting
     * @param {string|number} position - Series position
     * @returns {string} - Formatted position (e.g., 01, 02)
     * @private
     */
    _formatSeriesPosition(position) {
        if (!position) return '';

        // Try to parse as number for padding
        const posNum = parseInt(position, 10);
        if (!isNaN(posNum)) {
            // Pad with leading zero for single digits
            return posNum < 10 ? `0${posNum}` : String(posNum);
        }

        // Return original for non-numeric positions (e.g. "Book One")
        return position.toString();
    }

    /**
     * Format part number for multi-file audiobooks
     * @param {string|number} partNumber - Part number
     * @returns {string} - Formatted part number (e.g., 01, 02)
     * @private
     */
    _formatPartNumber(partNumber) {
        if (!partNumber) return '01';

        const num = parseInt(partNumber, 10);
        if (!isNaN(num)) {
            // Pad with leading zero for single and double digits
            if (num < 10) return `0${num}`;
            if (num < 100) return `${num}`;
            return String(num);
        }

        return String(partNumber);
    }

    /**
     * Sanitize file path to ensure it's valid for the target file system
     * @param {string} filePath - File path to sanitize
     * @returns {string} - Sanitized file path
     * @private
     */
    _sanitizeFilePath(filePath) {
        let sanitized = filePath;

        // Replace invalid characters with alternatives
        const invalidChars = /[<>:"|?*\\]/g;
        sanitized = sanitized.replace(invalidChars, '_');

        // Replace consecutive spaces
        sanitized = sanitized.replace(/\s+/g, ' ');

        // Handle maximum path length (OS dependent)
        const MAX_PATH_LENGTH = 240; // Safe limit for most file systems
        if (sanitized.length > MAX_PATH_LENGTH) {
            const ext = path.extname(sanitized);
            const dirName = path.dirname(sanitized);
            const baseName = path.basename(sanitized, ext);

            // Truncate the basename to fit within the max path length
            const maxBaseNameLength = MAX_PATH_LENGTH - dirName.length - ext.length - 1;
            const truncatedBaseName = baseName.substring(0, maxBaseNameLength);

            sanitized = path.join(dirName, truncatedBaseName + ext);
        }

        return sanitized;
    }

    /**
     * Organize a file according to its metadata
     * @param {string} sourceFilePath - Source file path
     * @param {Object} metadata - Audiobook metadata
     * @param {string} baseDestDir - Base destination directory
     * @param {Object} options - Organization options
     * @param {boolean} [options.move=false] - Whether to move or copy the file
     * @param {boolean} [options.overwrite=false] - Whether to overwrite existing files
     * @param {string} [options.template] - Custom template to use
     * @returns {Promise<string>} - Path to the organized file
     */
    async organizeFile(sourceFilePath, metadata, baseDestDir, options = {}) {
        try {
            validateFilePath(sourceFilePath, 'Source file path');
            validateNotEmpty(baseDestDir, 'Base destination directory');

            const { move = false, overwrite = false } = options;

            // Generate target path based on metadata
            const targetPath = this.generateTargetPath(metadata, sourceFilePath, baseDestDir, options);

            // Create target directory if it doesn't exist
            const targetDir = path.dirname(targetPath);
            await this.fs.createDirectory(targetDir);

            // Move or copy the file
            if (move) {
                await this.fs.moveFile(sourceFilePath, targetPath, overwrite);
            } else {
                await this.fs.copyFile(sourceFilePath, targetPath, overwrite);
            }

            logger.info(`File ${move ? 'moved' : 'copied'} to: ${targetPath}`);
            return targetPath;
        } catch (error) {
            logger.error(`Error organizing file: ${sourceFilePath}`, { error });
            throw error;
        }
    }

    /**
     * Organize multiple files as part of a single audiobook
     * @param {Array<string>} sourceFilePaths - Source file paths
     * @param {Object} metadata - Audiobook metadata
     * @param {string} baseDestDir - Base destination directory
     * @param {Object} options - Organization options
     * @returns {Promise<Array<string>>} - Paths to the organized files
     */
    async organizeMultipleFiles(sourceFilePaths, metadata, baseDestDir, options = {}) {
        try {
            if (!Array.isArray(sourceFilePaths) || sourceFilePaths.length === 0) {
                throw new Error('Source file paths array is required and cannot be empty');
            }

            const organizedPaths = [];
            let partNumber = 1;

            // Process each file with incrementing part numbers
            for (const filePath of sourceFilePaths) {
                const fileOptions = {
                    ...options,
                    isMultiFile: true,
                    partNumber: partNumber++
                };

                const targetPath = await this.organizeFile(filePath, metadata, baseDestDir, fileOptions);
                organizedPaths.push(targetPath);
            }

            return organizedPaths;
        } catch (error) {
            logger.error('Error organizing multiple files', { error });
            throw error;
        }
    }
}

/**
 * Initialize the file organizer
 * @param {Object} options - Initialization options
 * @returns {FileOrganizer} - Initialized organizer
 */
function initializeFileOrganizer(options = {}) {
    return new FileOrganizer(options);
}

module.exports = {
    FileOrganizer,
    initializeFileOrganizer,
};
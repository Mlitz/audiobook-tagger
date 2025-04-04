const { ipcMain, dialog } = require('electron');
const { getAppState } = require('./app');
const { logger } = require('../core/utils/logger');
const { getConfig, updateConfig } = require('../core/config');
const path = require('path');

/**
 * Enhanced error response formatting
 * @param {Error} error - Error object
 * @returns {Object} - Formatted error response
 */
function formatErrorResponse(error) {
    return {
        message: error.message || 'An unknown error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
}

/**
 * Set up comprehensive IPC handlers for renderer-main process communication
 */
function setupIpcHandlers() {
    // Filesystem Scanning with Enhanced Progress Tracking
    ipcMain.handle('filesystem:scan-directory', async (event, data) => {
        try {
            const { filesystem } = getAppState().services;

            if (!filesystem || !filesystem.fileScanner) {
                throw new Error('Filesystem services not available');
            }

            // Setup progress tracking
            const progressHandler = (progressData) => {
                event.sender.send('filesystem:scan:progress', progressData);
            };

            // Attach event listener for progress
            if (filesystem.fileScanner.events) {
                filesystem.fileScanner.events.on('SCAN_PROGRESS', progressHandler);
            }

            const results = await filesystem.fileScanner.scanDirectory(
                data.dirPath,
                {
                    ...data.options,
                    progressCallback: progressHandler
                }
            );

            // Remove progress listener
            if (filesystem.fileScanner.events) {
                filesystem.fileScanner.events.removeListener('SCAN_PROGRESS', progressHandler);
            }

            return {
                success: true,
                dirPath: data.dirPath,
                files: results,
                count: results.length
            };
        } catch (error) {
            logger.error('Error scanning directory', { error, data });
            return {
                success: false,
                error: formatErrorResponse(error)
            };
        }
    });

    // File Processing with Comprehensive Progress and Error Handling
    ipcMain.handle('filesystem:process-directory', async (event, data) => {
        try {
            const { filesystem } = getAppState().services;

            if (!filesystem || !filesystem.fileProcessor) {
                throw new Error('File processor service not available');
            }

            // Setup progress tracking
            const progressHandler = (progressData) => {
                event.sender.send('filesystem:process:progress', {
                    processed: progressData.processed,
                    total: progressData.total,
                    percentage: progressData.percentage,
                    status: {
                        success: progressData.success,
                        failed: progressData.failed,
                        skipped: progressData.skipped
                    }
                });
            };

            // Attach event listener for progress
            if (filesystem.fileProcessor.events) {
                filesystem.fileProcessor.events.on('BATCH_PROGRESS', progressHandler);
            }

            const results = await filesystem.fileProcessor.processDirectory(
                data.dirPath,
                {
                    ...data.options,
                    progressCallback: progressHandler
                }
            );

            // Remove progress listener
            if (filesystem.fileProcessor.events) {
                filesystem.fileProcessor.events.removeListener('BATCH_PROGRESS', progressHandler);
            }

            return {
                success: true,
                results
            };
        } catch (error) {
            logger.error('Error processing directory', { error, data });
            return {
                success: false,
                error: formatErrorResponse(error)
            };
        }
    });

    // Metadata Search with Enhanced Error Handling
    ipcMain.handle('metadata:search', async (event, data) => {
        try {
            const { metadata } = getAppState().services;

            if (!metadata) {
                throw new Error('Metadata service not available');
            }

            // Setup progress tracking for search
            const progressHandler = (progressData) => {
                event.sender.send('metadata:search:progress', progressData);
            };

            const results = await metadata.search(
                data.query,
                {
                    progressCallback: progressHandler
                }
            );

            return {
                success: true,
                results
            };
        } catch (error) {
            logger.error('Error searching metadata', { error, data });
            return {
                success: false,
                error: formatErrorResponse(error)
            };
        }
    });

    // Queue Status Monitoring
    ipcMain.handle('filesystem:queue-status', async () => {
        try {
            const { filesystem } = getAppState().services;

            if (!filesystem || !filesystem.fileProcessor) {
                throw new Error('File processor service not available');
            }

            const status = filesystem.fileProcessor.getQueueStatus();

            return {
                success: true,
                status
            };
        } catch (error) {
            logger.error('Error getting queue status', { error });
            return {
                success: false,
                error: formatErrorResponse(error)
            };
        }
    });

    // Queue Cancellation
    ipcMain.handle('filesystem:clear-queue', async (event, data) => {
        try {
            const { filesystem } = getAppState().services;

            if (!filesystem || !filesystem.fileProcessor) {
                throw new Error('File processor service not available');
            }

            const reason = data?.reason || 'User requested';
            const count = filesystem.fileProcessor.clearQueue(reason);

            return {
                success: true,
                cleared: count
            };
        } catch (error) {
            logger.error('Error clearing queue', { error });
            return {
                success: false,
                error: formatErrorResponse(error)
            };
        }
    });
}

module.exports = {
    setupIpcHandlers
};
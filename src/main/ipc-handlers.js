const { ipcMain, dialog } = require('electron');
const { getAppState } = require('./app');
const { logger } = require('../core/utils/logger');
const { getConfig, updateConfig } = require('../core/config');
const path = require('path');

// Set up IPC handlers for renderer process communication
function setupIpcHandlers() {
    // Handle metadata lookup requests
    ipcMain.on('metadata:lookup', async (event, data) => {
        try {
            logger.info('Received metadata lookup request', { data });
            const { metadata } = getAppState().services;

            // Process the lookup asynchronously
            metadata.lookupByAsin(data.asin)
                .then(result => {
                    event.sender.send('metadata:result', {
                        requestId: data.requestId,
                        result
                    });
                })
                .catch(error => {
                    logger.error('Error during metadata lookup', { error, data });
                    event.sender.send('metadata:error', {
                        requestId: data.requestId,
                        error: {
                            message: error.message,
                            code: error.code || 'UNKNOWN_ERROR'
                        }
                    });
                });
        } catch (error) {
            logger.error('Error handling metadata lookup request', { error });
            event.sender.send('metadata:error', {
                requestId: data.requestId,
                error: {
                    message: 'Internal error processing request',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    });

    // Synchronous version using invoke pattern (returns Promise)
    ipcMain.handle('metadata:lookup-async', async (event, data) => {
        try {
            logger.info('Received metadata lookup async request', { data });
            const { metadata } = getAppState().services;

            const result = await metadata.lookupByAsin(data.asin);
            return { success: true, result };
        } catch (error) {
            logger.error('Error during metadata lookup async', { error, data });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: error.code || 'UNKNOWN_ERROR'
                }
            };
        }
    });

    // Handle metadata search requests
    ipcMain.on('metadata:search', async (event, data) => {
        try {
            logger.info('Received metadata search request', { data });
            const { metadata } = getAppState().services;

            metadata.search(data.query)
                .then(results => {
                    event.sender.send('metadata:result', {
                        requestId: data.requestId,
                        results
                    });
                })
                .catch(error => {
                    logger.error('Error during metadata search', { error, data });
                    event.sender.send('metadata:error', {
                        requestId: data.requestId,
                        error: {
                            message: error.message,
                            code: error.code || 'UNKNOWN_ERROR'
                        }
                    });
                });
        } catch (error) {
            logger.error('Error handling metadata search request', { error });
            event.sender.send('metadata:error', {
                requestId: data.requestId,
                error: {
                    message: 'Internal error processing request',
                    code: 'INTERNAL_ERROR'
                }
            });
        }
    });

    // Handle configuration requests
    ipcMain.handle('config:get-async', async (event, key) => {
        try {
            const config = key ? getConfig(key) : getConfig();
            return { success: true, config };
        } catch (error) {
            logger.error('Error retrieving configuration', { error, key });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: error.code || 'CONFIG_ERROR'
                }
            };
        }
    });

    ipcMain.on('config:set', async (event, data) => {
        try {
            await updateConfig(data.key, data.value);
            event.sender.send('config:updated', { key: data.key });
            return true;
        } catch (error) {
            logger.error('Error updating configuration', { error, data });
            event.sender.send('app:error', {
                source: 'config',
                error: {
                    message: error.message,
                    code: error.code || 'CONFIG_ERROR'
                }
            });
            return false;
        }
    });

    // Filesystem related handlers

    // Handle directory selection
    ipcMain.handle('filesystem:select-directory', async () => {
        try {
            const result = await dialog.showOpenDialog({
                properties: ['openDirectory']
            });

            if (result.canceled) {
                return { success: false, canceled: true };
            }

            return {
                success: true,
                dirPath: result.filePaths[0]
            };
        } catch (error) {
            logger.error('Error selecting directory', { error });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'DIRECTORY_SELECTION_ERROR'
                }
            };
        }
    });

    // Handle directory scanning
    ipcMain.handle('filesystem:scan-directory', async (event, data) => {
        try {
            logger.info('Received scan directory request', { dirPath: data.dirPath });

            const { filesystem } = getAppState().services;

            if (!filesystem || !filesystem.fileScanner) {
                throw new Error('Filesystem services not available');
            }

            const options = data.options || {};
            const results = await filesystem.fileScanner.scanDirectory(data.dirPath, options);

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
                error: {
                    message: error.message,
                    code: 'SCAN_ERROR'
                }
            };
        }
    });

    // Handle file processing
    ipcMain.handle('filesystem:process-file', async (event, data) => {
        try {
            logger.info('Received process file request', { filePath: data.filePath });

            const { fileProcessor } = getAppState().services;

            if (!fileProcessor) {
                throw new Error('File processor service not available');
            }

            const options = data.options || {};
            const result = await fileProcessor.processFile(data.filePath, options);

            return {
                success: true,
                result
            };
        } catch (error) {
            logger.error('Error processing file', { error, data });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'PROCESSING_ERROR'
                }
            };
        }
    });

    // Handle batch file processing
    ipcMain.handle('filesystem:process-directory', async (event, data) => {
        try {
            logger.info('Received process directory request', { dirPath: data.dirPath });

            const { fileProcessor } = getAppState().services;

            if (!fileProcessor) {
                throw new Error('File processor service not available');
            }

            const options = data.options || {};
            const results = await fileProcessor.processDirectory(data.dirPath, options);

            return {
                success: true,
                results
            };
        } catch (error) {
            logger.error('Error processing directory', { error, data });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'DIRECTORY_PROCESSING_ERROR'
                }
            };
        }
    });

    // Handle file metadata extraction
    ipcMain.handle('filesystem:extract-metadata', async (event, data) => {
        try {
            logger.info('Received extract metadata request', { filePath: data.filePath });

            const { extractMetadata } = require('../core/filesystem/metadata-extractor');

            const metadata = await extractMetadata(data.filePath);

            return {
                success: true,
                metadata
            };
        } catch (error) {
            logger.error('Error extracting metadata', { error, data });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'METADATA_EXTRACTION_ERROR'
                }
            };
        }
    });

    // Handle get processing queue status
    ipcMain.handle('filesystem:queue-status', async () => {
        try {
            const { fileProcessor } = getAppState().services;

            if (!fileProcessor) {
                throw new Error('File processor service not available');
            }

            const status = fileProcessor.getQueueStatus();

            return {
                success: true,
                status
            };
        } catch (error) {
            logger.error('Error getting queue status', { error });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'QUEUE_STATUS_ERROR'
                }
            };
        }
    });

    // Handle clear processing queue
    ipcMain.handle('filesystem:clear-queue', async (event, data) => {
        try {
            const { fileProcessor } = getAppState().services;

            if (!fileProcessor) {
                throw new Error('File processor service not available');
            }

            const reason = data?.reason || 'User requested';
            const count = fileProcessor.clearQueue(reason);

            return {
                success: true,
                cleared: count
            };
        } catch (error) {
            logger.error('Error clearing queue', { error });
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'QUEUE_CLEAR_ERROR'
                }
            };
        }
    });
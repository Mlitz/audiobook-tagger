const { ipcMain } = require('electron');
const { getAppState } = require('./app');
const { logger } = require('../core/utils/logger');
const { getConfig, updateConfig } = require('../core/config');

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

    // Application status
    ipcMain.handle('app:status-async', async () => {
        const state = getAppState();
        return {
            initialized: state.initialized,
            version: process.env.APP_VERSION || '0.1.0'
        };
    });

    // Handle log messages from renderer
    ipcMain.on('log:message', (event, data) => {
        const { level, message, meta } = data;
        if (logger[level]) {
            logger[level](message, meta || {});
        } else {
            logger.info(message, meta || {});
        }
    });

    // Listen for preload ready event
    ipcMain.on('preload:ready', () => {
        logger.info('Preload script loaded successfully');
    });
}

// Call setup immediately
setupIpcHandlers();

module.exports = { setupIpcHandlers };
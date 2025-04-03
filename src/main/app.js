const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { loadConfig } = require('../core/config');
const { initializeAudnexusClient } = require('../api/audnexus');
const { initializeEventSystem } = require('../core/events');
const { initializeMetadataProcessor } = require('../core/metadata');
const { logger } = require('../core/utils/logger');

// Application state
let appState = {
    initialized: false,
    apiClients: {},
    services: {}
};

/**
 * Initialize the application core services
 */
async function initializeApp() {
    if (appState.initialized) {
        logger.warn('Application already initialized, skipping initialization');
        return appState;
    }

    logger.info('Starting application initialization');

    try {
        // Ensure application directories exist
        await ensureAppDirectories();

        // Load configuration
        const config = await loadConfig();
        appState.config = config;
        logger.info('Configuration loaded successfully');

        // Initialize event system
        const eventSystem = initializeEventSystem();
        appState.services.events = eventSystem;
        logger.info('Event system initialized');

        // Initialize API clients
        const audnexusClient = initializeAudnexusClient(config.api.audnexus);
        appState.apiClients.audnexus = audnexusClient;
        logger.info('Audnexus API client initialized');

        // Initialize metadata processor
        const metadataProcessor = initializeMetadataProcessor({
            apiClients: appState.apiClients,
            eventSystem,
            config: config.metadata
        });
        appState.services.metadata = metadataProcessor;
        logger.info('Metadata processor initialized');

        // Mark as initialized
        appState.initialized = true;
        logger.info('Application initialization completed successfully');

        return appState;
    } catch (error) {
        logger.error('Failed to initialize application', { error });
        throw error;
    }
}

/**
 * Ensure all required application directories exist
 */
async function ensureAppDirectories() {
    const userDataPath = app.getPath('userData');

    // Define directories to ensure they exist
    const directories = [
        path.join(userDataPath, 'config'),
        path.join(userDataPath, 'cache'),
        path.join(userDataPath, 'logs'),
        path.join(userDataPath, 'temp')
    ];

    // Create directories if they don't exist
    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            logger.error(`Failed to create directory: ${dir}`, { error });
            throw error;
        }
    }

    logger.info('Application directories verified');
}

/**
 * Get the current application state
 */
function getAppState() {
    return appState;
}

/**
 * Performs cleanup before application shutdown
 */
async function shutdownApp() {
    if (!appState.initialized) {
        logger.info('Application not initialized, no shutdown needed');
        return;
    }

    logger.info('Starting application shutdown');

    try {
        // Close API clients
        for (const [name, client] of Object.entries(appState.apiClients)) {
            if (client && typeof client.close === 'function') {
                await client.close();
                logger.info(`Closed API client: ${name}`);
            }
        }

        // Shutdown services
        for (const [name, service] of Object.entries(appState.services)) {
            if (service && typeof service.shutdown === 'function') {
                await service.shutdown();
                logger.info(`Shut down service: ${name}`);
            }
        }

        // Reset state
        appState.initialized = false;
        logger.info('Application shutdown completed');
    } catch (error) {
        logger.error('Error during application shutdown', { error });
        throw error;
    }
}

// Register shutdown handler
app.on('will-quit', async (event) => {
    if (appState.initialized) {
        event.preventDefault();
        await shutdownApp();
        app.quit();
    }
});

module.exports = {
    initializeApp,
    getAppState,
    shutdownApp
};
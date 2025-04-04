/**
 * Renderer process entry point
 * This file is loaded by the renderer process and initializes the renderer-side functionality
 */

// Initialize logging for renderer process
function initLogging() {
    // Create log functions that send messages to the main process
    const logLevels = ['error', 'warn', 'info', 'debug'];

    // Create a logger object with methods for each log level
    const logger = {};

    logLevels.forEach((level) => {
        logger[level] = (message, meta = {}) => {
            // Send log message to main process
            window.api.send('log:message', {
                level,
                message,
                meta,
                source: 'renderer'
            });

            // Also log to console for development
            if (level === 'error' || level === 'warn') {
                console[level](`[${level}] ${message}`, meta);
            }
        };
    });

    // Make logger available globally in renderer
    window.logger = logger;

    // Log initialization
    logger.info('Renderer process initialized');
}

// Initialize IPC event handling
function initEvents() {
    // Listen for app error events
    window.api.receive('app:error', (data) => {
        const { source, error } = data;
        window.logger.error(`Error from ${source}: ${error.message}`);

        // Here you would show error UI if needed
        // For Phase 1, we'll just log to console
        console.error(`Application error from ${source}:`, error);
    });

    // Listen for app initialization completion
    window.api.receive('app:initialized', () => {
        window.logger.info('Application initialization completed');

        // Here you would update the UI to show the app is ready
        document.body.classList.add('app-ready');
    });
}

// Function to initialize the app status
function initAppStatus() {
    // Get application status
    window.api.invoke('app:status-async')
        .then(status => {
            window.logger.info('Application status', { status });

            // Update version in UI if needed
            if (status.version && document.getElementById('app-version')) {
                document.getElementById('app-version').textContent = status.version;
            }
        })
        .catch(error => {
            window.logger.error('Failed to get application status', { error });
        });
}

// Initialize everything when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize renderer components
    initLogging();
    initEvents();
    initAppStatus();

    // Let main process know the renderer is ready
    window.api.send('renderer:ready');

    // Log that everything is set up
    window.logger.info('Renderer setup complete');
});
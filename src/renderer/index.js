/**
 * Renderer Process Entry Point
 * Manages UI interactions and communication with main process
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
    // Listen for app-wide events from main process
    window.api.receive('app:error', handleAppError);
    window.api.receive('app:initialized', handleAppInitialized);

    // Filesystem events
    window.api.receive('filesystem:scan:progress', handleFilesystemScanProgress);
    window.api.receive('filesystem:process:progress', handleFileProcessProgress);

    // Metadata events
    window.api.receive('metadata:search:progress', handleMetadataSearchProgress);
}

// Error handling for application-wide errors
function handleAppError(data) {
    const { source, error } = data;

    // Log the error
    window.logger.error(`Application error from ${source}`, { error });

    // Display user-friendly error notification
    displayErrorNotification(
        `An error occurred in ${source}`,
        error.message || 'An unexpected error happened'
    );
}

// Handle application initialization
function handleAppInitialized() {
    window.logger.info('Application initialization completed');

    // Update UI to show app is ready
    document.body.classList.add('app-ready');

    // Enable interactive components
    enableInteractiveComponents();
}

// Filesystem scan progress handler
function handleFilesystemScanProgress(progressData) {
    const progressBar = document.getElementById('filesystem-progress-bar');
    const statusMessage = document.getElementById('filesystem-status');

    if (progressData.percentage !== undefined) {
        progressBar.style.width = `${progressData.percentage}%`;
    }

    statusMessage.textContent = `Scanning: ${progressData.processed} of ${progressData.total} files`;
}

// File processing progress handler
function handleFileProcessProgress(progressData) {
    const progressBar = document.getElementById('processing-progress-bar');
    const statusMessage = document.getElementById('processing-status');

    if (progressData.percentage !== undefined) {
        progressBar.style.width = `${progressData.percentage}%`;
    }

    statusMessage.textContent = `Processing: ${progressData.processed} of ${progressData.total} files`;

    // Update results summary
    updateProcessingSummary(progressData);
}

// Metadata search progress handler
function handleMetadataSearchProgress(progressData) {
    const statusMessage = document.getElementById('metadata-search-status');

    statusMessage.textContent = `Searching: ${progressData.currentProgress || 'In progress'}`;
}

// User-friendly error notification
function displayErrorNotification(title, message) {
    // Create error notification element
    const notification = document.createElement('div');
    notification.classList.add('error-notification');
    notification.innerHTML = `
        <h3>${title}</h3>
        <p>${message}</p>
        <button class="close-notification">Dismiss</button>
    `;

    // Add close functionality
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });

    // Add to document body
    document.body.appendChild(notification);
}

// Enable interactive UI components
function enableInteractiveComponents() {
    const scanButton = document.getElementById('scan-btn');
    const processButton = document.getElementById('process-btn');
    const searchButton = document.getElementById('metadata-search-btn');

    // Enable buttons that were disabled during initialization
    if (scanButton) scanButton.disabled = false;
    if (processButton) processButton.disabled = false;
    if (searchButton) searchButton.disabled = false;
}

// Update processing summary
function updateProcessingSummary(progressData) {
    const summaryContainer = document.getElementById('processing-summary');

    if (summaryContainer) {
        summaryContainer.innerHTML = `
            <p>Total Files: ${progressData.total}</p>
            <p>Processed: ${progressData.processed}</p>
            <p>Successful: ${progressData.status?.success || 0}</p>
            <p>Failed: ${progressData.status?.failed || 0}</p>
            <p>Skipped: ${progressData.status?.skipped || 0}</p>
        `;
    }
}

// Main initialization function
function initializeRenderer() {
    // Initialize core renderer functionality
    initLogging();
    initEvents();

    // Additional initialization can be added here

    // Log that renderer is fully set up
    window.logger.info('Renderer setup complete');
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeRenderer);

// Export functions for potential external use or testing
window.rendererUtils = {
    displayErrorNotification,
    handleAppError,
    handleFilesystemScanProgress,
    handleFileProcessProgress
};
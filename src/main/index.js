const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { configureLogger } = require('../core/utils/logger');
const { setupErrorHandling } = require('../errors/handler');
const { initializeApp } = require('./app');

// Configure logger as early as possible
const logger = configureLogger('main');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Create the browser window
function createWindow() {
    logger.info('Creating main application window');

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Audiobook Tagger',
        webPreferences: {
            nodeIntegration: false, // Security: Disable Node.js integration in renderer
            contextIsolation: true, // Security: Enable context isolation
            preload: path.join(__dirname, 'preload.js') // Use preload script
        }
    });

    // Load the app
    if (process.env.NODE_ENV === 'development') {
        // In development, load from dev server
        mainWindow.loadURL('http://localhost:3000');
        // Open DevTools
        mainWindow.webContents.openDevTools();
    } else {
        // In production, load from file
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // Set up error handling for renderer process
    mainWindow.webContents.on('render-process-gone', (event, details) => {
        logger.error('Renderer process crashed', { details });
        // Handle renderer crash (could show dialog, attempt restart, etc.)
    });

    // Window closed event
    mainWindow.on('closed', () => {
        logger.info('Main window closed');
        mainWindow = null;
    });
}

// Initialize the application
async function init() {
    try {
        logger.info('Initializing application');
        await initializeApp();
        createWindow();
    } catch (error) {
        logger.error('Failed to initialize application', { error });
        app.exit(1);
    }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
    setupErrorHandling();
    init();

    // On macOS, recreate window when dock icon is clicked and no windows are open
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        logger.info('All windows closed, quitting application');
        app.quit();
    }
});

// Handle any uncaught exceptions in the main process
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception in main process', { error });
    // Attempt graceful shutdown
    app.exit(1);
});

// Set up IPC handlers
require('./ipc-handlers');
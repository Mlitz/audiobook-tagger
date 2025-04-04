/**
 * Mock implementation of the Electron API for testing
 */

// Mock app module
const app = {
    getPath: jest.fn((name) => {
        // Return test paths based on requested path name
        switch (name) {
            case 'userData':
                return '/mock/user/data';
            case 'appData':
                return '/mock/app/data';
            case 'temp':
                return '/mock/temp';
            case 'logs':
                return '/mock/logs';
            case 'home':
                return '/mock/home';
            default:
                return `/mock/${name}`;
        }
    }),
    getAppPath: jest.fn(() => '/mock/app/path'),
    getName: jest.fn(() => 'Audiobook Tagger'),
    getVersion: jest.fn(() => '0.1.0-test'),
    quit: jest.fn(),
    exit: jest.fn(),
    relaunch: jest.fn(),
    isPackaged: false,
    whenReady: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    once: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
};

// Mock BrowserWindow
class BrowserWindow {
    constructor(options) {
        this.options = options;
        this.webContents = {
            on: jest.fn(),
            send: jest.fn(),
            openDevTools: jest.fn(),
            session: {
                setProxy: jest.fn(),
                clearCache: jest.fn()
            }
        };
    }

    loadURL = jest.fn().mockResolvedValue(undefined);
    loadFile = jest.fn().mockResolvedValue(undefined);
    close = jest.fn();
    show = jest.fn();
    hide = jest.fn();
    maximize = jest.fn();
    unmaximize = jest.fn();
    isMaximized = jest.fn().mockReturnValue(false);
    minimize = jest.fn();
    restore = jest.fn();
    setMenuBarVisibility = jest.fn();
    on = jest.fn();
    once = jest.fn();
    removeListener = jest.fn();
    removeAllListeners = jest.fn();
    focus = jest.fn();
    isFocused = jest.fn().mockReturnValue(true);
    destroy = jest.fn();
    setTitle = jest.fn();
    getTitle = jest.fn().mockReturnValue('Audiobook Tagger');

    static getAllWindows = jest.fn().mockReturnValue([]);
    static getFocusedWindow = jest.fn().mockReturnValue(null);
    static fromId = jest.fn().mockReturnValue(null);
}

// Mock ipcMain
const ipcMain = {
    on: jest.fn(),
    once: jest.fn(),
    handle: jest.fn(),
    handleOnce: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
};

// Mock ipcRenderer
const ipcRenderer = {
    on: jest.fn(),
    once: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn().mockResolvedValue({}),
    sendSync: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn()
};

// Mock dialog
const dialog = {
    showOpenDialog: jest.fn().mockResolvedValue({ canceled: false, filePaths: ['/mock/path/file.mp3'] }),
    showSaveDialog: jest.fn().mockResolvedValue({ canceled: false, filePath: '/mock/path/save.json' }),
    showMessageBox: jest.fn().mockResolvedValue({ response: 0 }),
    showErrorBox: jest.fn()
};

// Mock Menu
const Menu = {
    buildFromTemplate: jest.fn().mockReturnValue({
        popup: jest.fn(),
        closePopup: jest.fn(),
        append: jest.fn(),
        insert: jest.fn(),
        getMenuItemById: jest.fn()
    }),
    setApplicationMenu: jest.fn(),
    getApplicationMenu: jest.fn(),
    sendActionToFirstResponder: jest.fn()
};

// Mock shell
const shell = {
    openExternal: jest.fn().mockResolvedValue(undefined),
    openPath: jest.fn().mockResolvedValue(''),
    showItemInFolder: jest.fn()
};

// Mock contextBridge
const contextBridge = {
    exposeInMainWorld: jest.fn()
};

// Export mock Electron modules
module.exports = {
    app,
    BrowserWindow,
    ipcMain,
    ipcRenderer,
    dialog,
    Menu,
    shell,
    contextBridge
};
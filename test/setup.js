/**
 * Jest setup file for configuring the test environment
 */

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.APP_VERSION = '0.1.0-test';

// Create mock directories structure for tests
const path = require('path');
const fs = require('fs');

// Ensure test directories exist
const testDirs = [
    path.join(__dirname, 'fixtures'),
    path.join(__dirname, 'fixtures/metadata'),
    path.join(__dirname, 'fixtures/config'),
    path.join(__dirname, 'mocks')
];

testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Set up basic mocks for testing
jest.mock('electron', () => require('./mocks/electron'));

// Mock console methods for cleaner test output
global.console = {
    ...console,
    // Comment these out if you want to see logs during tests
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    // Keep error and warn for test debugging
    //error: jest.fn(),
    //warn: jest.fn(),
};

// Mock timers (uncomment if needed)
// jest.useFakeTimers();

// Add any global test setup here
beforeAll(() => {
    // Setup that runs once before all tests
});

afterAll(() => {
    // Cleanup that runs once after all tests
});

// Reset mocks between tests
beforeEach(() => {
    jest.clearAllMocks();
});
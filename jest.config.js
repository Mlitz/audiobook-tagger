module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/renderer/**/*.js',
        '!**/node_modules/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    verbose: true,
    // Mock Electron
    moduleNameMapper: {
        '^electron$': '<rootDir>/test/mocks/electron.js'
    },
    // Setup files
    setupFiles: ['<rootDir>/test/setup.js']
};
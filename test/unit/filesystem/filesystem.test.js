/**
 * Comprehensive tests for the filesystem module
 */

const path = require('path');
const fs = require('fs').promises;
const {
    FileSystemService,
    isSupportedAudioFormat,
    SUPPORTED_EXTENSIONS
} = require('../../../src/core/filesystem/service');
const { FileScanner } = require('../../../src/core/filesystem/scanner');
const { FileOrganizer } = require('../../../src/core/filesystem/organizer');
const { extractMetadata } = require('../../../src/core/filesystem/metadata-extractor');

// Mock filesystem for testing
jest.mock('fs', () => {
    const originalFs = jest.requireActual('fs');
    return {
        ...originalFs,
        promises: {
            readdir: jest.fn(),
            stat: jest.fn(),
            lstat: jest.fn(),
            readlink: jest.fn(),
            mkdir: jest.fn(),
            access: jest.fn(),
            copyFile: jest.fn(),
            rename: jest.fn(),
            unlink: jest.fn(),
            readFile: jest.fn(),
            writeFile: jest.fn()
        }
    };
});

// Mock music-metadata
jest.mock('music-metadata', () => ({
    parseFile: jest.fn().mockResolvedValue({
        common: {},
        format: {}
    })
}));

// Mock node-id3
jest.mock('node-id3', () => ({
    read: jest.fn().mockResolvedValue({})
}));

describe('Filesystem Module', () => {
    let fileSystemService;
    let fileScanner;
    let fileOrganizer;
    let mockEventSystem;

    // Comprehensive test scenarios
    const scenarios = {
        mixedDirectory: [
            { name: 'music1.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'music2.m4b', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'video.mp4', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'hidden.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'subfolder', isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false }
        ],
        symlinkScenario: [
            { name: 'symlink-to-audio', isDirectory: () => false, isFile: () => false, isSymbolicLink: () => true },
            { name: 'direct-audio.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false }
        ],
        multiBookScenario: [
            { name: 'Book1_Part1.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'Book1_Part2.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
            { name: 'Book2.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false }
        ]
    };

    const mockStats = {
        size: 1024 * 1024 * 10, // 10MB
        birthtime: new Date('2023-01-01'),
        mtime: new Date('2023-01-02')
    };

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Setup mock event system
        mockEventSystem = {
            emit: jest.fn()
        };

        // Default mock implementations
        fs.readdir.mockResolvedValue(scenarios.mixedDirectory);
        fs.stat.mockResolvedValue(mockStats);
        fs.lstat.mockResolvedValue(mockStats);
        fs.mkdir.mockResolvedValue(undefined);
        fs.access.mockResolvedValue(undefined);

        // Initialize services
        fileSystemService = new FileSystemService({
            config: {},
            eventSystem: mockEventSystem
        });

        fileScanner = new FileScanner({
            fileSystemService,
            eventSystem: mockEventSystem,
            config: {}
        });

        fileOrganizer = new FileOrganizer({
            fileSystemService,
            eventSystem: mockEventSystem,
            config: {}
        });
    });

    describe('Supported Audio Formats', () => {
        it('should correctly identify supported audio formats', () => {
            const supportedFormats = [
                'test.mp3',
                'test.m4a',
                'test.m4b',
                'test.aac',
                'test.ogg',
                'test.flac',
                'test.opus'
            ];

            const unsupportedFormats = [
                'test.wav',
                'test.wma',
                'test.txt',
                'test.pdf'
            ];

            // Test supported formats
            supportedFormats.forEach(format => {
                expect(isSupportedAudioFormat(format)).toBe(true, `${format} should be supported`);
            });

            // Test unsupported formats
            unsupportedFormats.forEach(format => {
                expect(isSupportedAudioFormat(format)).toBe(false, `${format} should not be supported`);
            });
        });
    });

    describe('FileSystemService Scanning', () => {
        it('should handle mixed content directory', async () => {
            const results = await fileSystemService.scanDirectory('/test/dir');

            // Should only return audio files
            expect(results.length).toBe(2);
            expect(results.map(r => r.name)).toEqual(expect.arrayContaining(['music1.mp3', 'music2.m4b']));
        });

        it('should handle directory with symbolic links', async () => {
            // Mock symbolic link resolution
            fs.readdir.mockResolvedValue(scenarios.symlinkScenario);
            fs.readlink.mockResolvedValue('/path/to/real/audio.mp3');
            fs.stat.mockImplementation((path) => {
                if (path === '/path/to/real/audio.mp3') {
                    return Promise.resolve({
                        ...mockStats,
                        isDirectory: () => false,
                        isFile: () => true
                    });
                }
                return Promise.resolve(mockStats);
            });

            const results = await fileSystemService.scanDirectory('/test/symlink/dir');

            // Expect at least one file to be processed
            expect(results.length).toBeGreaterThan(0);
        });

        it('should handle errors during directory scanning', async () => {
            // Simulate an error during scanning
            fs.readdir.mockRejectedValue(new Error('Permission denied'));

            await expect(fileSystemService.scanDirectory('/test/error/dir'))
                .rejects.toThrow('Permission denied');
        });
    });

    describe('FileScanner Grouping', () => {
        it('should group files into books with multi-part files', () => {
            // Setup test files
            const testFiles = [
                {
                    path: '/test/Book1_Part1.mp3',
                    name: 'Book1_Part1.mp3',
                    directory: '/test',
                    size: 1000
                },
                {
                    path: '/test/Book1_Part2.mp3',
                    name: 'Book1_Part2.mp3',
                    directory: '/test',
                    size: 1000
                },
                {
                    path: '/test/Book2.mp3',
                    name: 'Book2.mp3',
                    directory: '/test',
                    size: 2000
                }
            ];

            const books = fileScanner.groupFilesByBooks(testFiles);

            // Verify grouping
            expect(books.length).toBe(2);

            // Check multi-part book
            const multiPartBook = books.find(b => b.files.length > 1);
            expect(multiPartBook).toBeDefined();
            expect(multiPartBook.files.length).toBe(2);
            expect(multiPartBook.name).toContain('Book1');
            expect(multiPartBook.totalSize).toBe(2000);

            // Check single file book
            const singleFileBook = books.find(b => b.files.length === 1);
            expect(singleFileBook).toBeDefined();
            expect(singleFileBook.name).toContain('Book2');
            expect(singleFileBook.totalSize).toBe(2000);
        });

        it('should handle files with complex naming patterns', () => {
            const complexFiles = [
                {
                    path: '/test/Series Name Book 01.mp3',
                    name: 'Series Name Book 01.mp3',
                    directory: '/test',
                    size: 1000
                },
                {
                    path: '/test/Series Name Book 02.mp3',
                    name: 'Series Name Book 02.mp3',
                    directory: '/test',
                    size: 1000
                }
            ];

            const books = fileScanner.groupFilesByBooks(complexFiles);

            // Verify complex name handling
            expect(books.length).toBe(1);
            expect(books[0].files.length).toBe(2);
            expect(books[0].name).toContain('Series Name');
        });
    });

    describe('FileOrganizer Path Generation', () => {
        const baseTestCases = [
            {
                name: 'Complete Metadata',
                metadata: {
                    title: 'Test Book',
                    authors: [{ name: 'Test Author' }],
                    narrators: [{ name: 'Test Narrator' }],
                    series: { name: 'Test Series', position: 3 },
                    asin: 'B0123456789'
                },
                expectedContains: ['Test Author', 'Test Series', '03', 'Test Book']
            },
            {
                name: 'Metadata without Series',
                metadata: {
                    title: 'Standalone Book',
                    authors: [{ name: 'Solo Author' }],
                    narrators: [{ name: 'Solo Narrator' }]
                },
                expectedContains: ['Solo Author', 'Standalone Book']
            },
            {
                name: 'Minimal Metadata',
                metadata: {
                    title: 'Minimal Title'
                },
                expectedContains: ['Minimal Title']
            }
        ];

        baseTestCases.forEach(testCase => {
            it(`should generate path correctly for ${testCase.name}`, () => {
                const targetPath = fileOrganizer.generateTargetPath(
                    testCase.metadata,
                    '/source/test.mp3',
                    '/destination'
                );

                // Check each expected component
                testCase.expectedContains.forEach(component => {
                    expect(targetPath).toContain(component);
                });

                // Check file extension preservation
                expect(targetPath).toEndWith('.mp3');
            });
        });

        it('should sanitize file paths', () => {
            const metadata = {
                title: 'Book with Invalid: Characters',
                authors: [{ name: 'Bad Author?' }]
            };

            const targetPath = fileOrganizer.generateTargetPath(
                metadata,
                '/source/test.mp3',
                '/destination'
            );

            // Verify path sanitization
            expect(targetPath).not.toContain(':');
            expect(targetPath).not.toContain('?');
        });
    });

    // Performance and error handling tests would go here
});
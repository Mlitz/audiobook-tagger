/**
 * Tests for the filesystem module
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
  parseFile: jest.fn()
}));

// Mock node-id3
jest.mock('node-id3', () => ({
  read: jest.fn()
}));

describe('Filesystem Module', () => {
  let fileSystemService;
  let fileScanner;
  let fileOrganizer;
  let mockEventSystem;

  // Sample test data
  const mockDirPath = '/mock/audiobooks';
  const mockFilePath = '/mock/audiobooks/test.mp3';
  const mockDirEntries = [
    { name: 'test.mp3', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
    { name: 'subfolder', isDirectory: () => true, isFile: () => false, isSymbolicLink: () => false },
    { name: 'test.m4b', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false },
    { name: 'not-audio.txt', isDirectory: () => false, isFile: () => true, isSymbolicLink: () => false }
  ];
  const mockFileStats = {
    size: 1024 * 1024 * 10, // 10MB
    birthtime: new Date('2023-01-01'),
    mtime: new Date('2023-01-02'),
    isDirectory: () => false
  };
  const mockDirStats = {
    isDirectory: () => true
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock event system
    mockEventSystem = {
      emit: jest.fn()
    };

    // Setup mock filesystem responses
    fs.readdir.mockResolvedValue(mockDirEntries);
    fs.stat.mockImplementation((path) => {
      if (path === mockDirPath) {
        return Promise.resolve(mockDirStats);
      }
      return Promise.resolve(mockFileStats);
    });
    fs.lstat.mockResolvedValue(mockFileStats);
    fs.mkdir.mockResolvedValue(undefined);
    fs.access.mockImplementation((path) => {
      if (path === mockFilePath) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

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

  describe('FileSystemService', () => {
    test('should identify supported audio formats correctly', () => {
      // Test supported extensions
      expect(isSupportedAudioFormat('test.mp3')).toBe(true);
      expect(isSupportedAudioFormat('test.m4b')).toBe(true);
      expect(isSupportedAudioFormat('test.m4a')).toBe(true);
      expect(isSupportedAudioFormat('test.flac')).toBe(true);
      
      // Test unsupported extensions
      expect(isSupportedAudioFormat('test.txt')).toBe(false);
      expect(isSupportedAudioFormat('test.pdf')).toBe(false);
      expect(isSupportedAudioFormat('test')).toBe(false);
      
      // Test case insensitivity
      expect(isSupportedAudioFormat('test.MP3')).toBe(true);
      expect(isSupportedAudioFormat('test.Flac')).toBe(true);
    });

    test('should scan directory and return audiobook files', async () => {
      const results = await fileSystemService.scanDirectory(mockDirPath);
      
      // Check readdir was called with correct path
      expect(fs.readdir).toHaveBeenCalledWith(mockDirPath, { withFileTypes: true });
      
      // Should return 2 audio files (.mp3 and .m4b)
      expect(results.length).toBe(2);
      expect(results.some(file => file.name === 'test.mp3')).toBe(true);
      expect(results.some(file => file.name === 'test.m4b')).toBe(true);
    });

    test('should return file info', async () => {
      const fileInfo = await fileSystemService.getFileInfo(mockFilePath);
      
      expect(fileInfo).toEqual(expect.objectContaining({
        path: mockFilePath,
        name: 'test.mp3',
        directory: '/mock/audiobooks',
        extension: '.mp3',
        size: mockFileStats.size,
        created: mockFileStats.birthtime,
        modified: mockFileStats.mtime
      }));
    });

    test('should check if a file exists', async () => {
      // Existing file
      expect(await fileSystemService.fileExists(mockFilePath)).toBe(true);
      
      // Non-existing file
      expect(await fileSystemService.fileExists('/nonexistent.mp3')).toBe(false);
    });
  });

  describe('FileScanner', () => {
    test('should scan directory and filter audiobooks', async () => {
      // Setup file scanning results
      fs.readdir.mockResolvedValue(mockDirEntries);
      
      const results = await fileScanner.scanDirectory(mockDirPath);
      
      // Should filter and return only audio files
      expect(results.length).toBe(2);
      expect(results.some(file => file.name === 'test.mp3')).toBe(true);
      expect(results.some(file => file.name === 'test.m4b')).toBe(true);
      expect(results.some(file => file.name === 'not-audio.txt')).toBe(false);
      
      // Should emit events
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        expect.stringContaining('SCAN_STARTED'),
        expect.any(Object)
      );
      expect(mockEventSystem.emit).toHaveBeenCalledWith(
        expect.stringContaining('SCAN_COMPLETED'),
        expect.any(Object)
      );
    });

    test('should group files by books', () => {
      // Setup test files
      const testFiles = [
        { path: '/test/Book1_01.mp3', name: 'Book1_01.mp3', directory: '/test', size: 1000 },
        { path: '/test/Book1_02.mp3', name: 'Book1_02.mp3', directory: '/test', size: 1000 },
        { path: '/test/Book2.mp3', name: 'Book2.mp3', directory: '/test', size: 2000 },
        { path: '/test/Another Book/part1.mp3', name: 'part1.mp3', directory: '/test/Another Book', size: 500 },
        { path: '/test/Another Book/part2.mp3', name: 'part2.mp3', directory: '/test/Another Book', size: 500 }
      ];
      
      const books = fileScanner.groupFilesByBooks(testFiles);
      
      // Should group files correctly
      expect(books.length).toBe(3); // 3 distinct books
      
      // Check Book1 with multiple files
      const book1 = books.find(b => b.files.some(f => f.name === 'Book1_01.mp3'));
      expect(book1.files.length).toBe(2);
      expect(book1.totalSize).toBe(2000);
      
      // Check Book2 with single file
      const book2 = books.find(b => b.files.some(f => f.name === 'Book2.mp3'));
      expect(book2.files.length).toBe(1);
      expect(book2.totalSize).toBe(2000);
      
      // Check "Another Book" with multiple files
      const book3 = books.find(b => b.files.some(f => f.name === 'part1.mp3'));
      expect(book3.files.length).toBe(2);
      expect(book3.totalSize).toBe(1000);
    });
  });

  describe('FileOrganizer', () => {
    test('should generate target path from metadata', () => {
      // Setup test metadata
      const metadata = {
        title: 'Test Book',
        authors: [{ name: 'Test Author' }],
        narrators: [{ name: 'Test Narrator' }],
        series: {
          name: 'Test Series',
          position: 3
        },
        asin: 'B0123456789'
      };
      
      const targetPath = fileOrganizer.generateTargetPath(
        metadata,
        '/source/test.mp3',
        '/destination'
      );
      
      // Should generate path based on metadata
      expect(targetPath).toContain('Test Author');
      expect(targetPath).toContain('Test Series');
      expect(targetPath).toContain('03');
      expect(targetPath).toContain('Test Book');
      expect(targetPath).toEndWith('.mp3');
    });

    test('should handle metadata without series', () => {
      // Setup test metadata without series
      const metadata = {
        title: 'Test Book',
        authors: [{ name: 'Test Author' }],
        narrators: [{ name: 'Test Narrator' }],
        asin: 'B0123456789'
      };
      
      const targetPath = fileOrganizer.generateTargetPath(
        metadata,
        '/source/test.mp3',
        '/destination'
      );
      
      // Should generate path based on metadata without series
      expect(targetPath).toContain('Test Author');
      expect(targetPath).toContain('Test Book');
      expect(targetPath).not.toContain('Series');
      expect(targetPath).toEndWith('.mp3');
    });
  });
});
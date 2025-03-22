import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import NodeID3 from 'node-id3';
import { applyMetadata } from '../../src/metadata/tagger';
import { AudiobookMetadata } from '../../src/api/types';
import * as fileUtils from '../../src/utils/file';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('axios');
jest.mock('node-id3');
jest.mock('../../src/utils/file');
jest.mock('../../src/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedNodeID3 = NodeID3 as jest.Mocked<typeof NodeID3>;
const mockedFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;

describe('Metadata Tagger', () => {
  const sampleMetadata: AudiobookMetadata = {
    title: 'Test Audiobook',
    author: 'Test Author',
    narrator: 'Test Narrator',
    series: 'Test Series',
    part: '1',
    year: '2023',
    publisher: 'Test Publisher',
    asin: 'B12345678',
    genres: ['Science Fiction', 'Fantasy'],
    description: 'This is a test description',
    coverUrl: 'https://example.com/cover.jpg',
    hasCoverArt: true,
    audibleLink: 'https://audible.com/pd/B12345678',
    rating: '4.8',
    duration: '600',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    mockedFileUtils.checkFileExists.mockResolvedValue(true);
    mockedNodeID3.write.mockReturnValue(true);
  });

  describe('applyMetadata', () => {
    it('should successfully apply metadata to MP3 file', async () => {
      const filePath = '/path/to/audiobook.mp3';
      
      // Mock successful cover download
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('fake-image-data'),
      });
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(true);
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com/cover.jpg', { responseType: 'arraybuffer' });
      expect(mockedNodeID3.write).toHaveBeenCalled();
      expect(mockedNodeID3.write.mock.calls[0][0]).toMatchObject({
        title: 'Test Audiobook',
        artist: 'Test Author',
        composer: 'Test Narrator',
        year: '2023',
        genre: 'Science Fiction',
      });
    });

    it('should handle M4B files with a warning', async () => {
      const filePath = '/path/to/audiobook.m4b';
      
      // Mock successful cover download
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('fake-image-data'),
      });
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(true);
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedNodeID3.write).toHaveBeenCalled();
    });

    it('should return false when file does not exist', async () => {
      const filePath = '/path/to/nonexistent.mp3';
      
      // Mock file not found
      mockedFileUtils.checkFileExists.mockResolvedValueOnce(false);
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(false);
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedNodeID3.write).not.toHaveBeenCalled();
    });

    it('should handle failure to download cover art', async () => {
      const filePath = '/path/to/audiobook.mp3';
      
      // Mock failed cover download
      mockedAxios.get.mockRejectedValueOnce(new Error('Failed to download'));
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(true); // Should still succeed even without cover
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedNodeID3.write).toHaveBeenCalled();
      
      // Verify that image was not included in the tags
      expect(mockedNodeID3.write.mock.calls[0][0].image).toBeUndefined();
    });

    it('should return false when tag writing fails', async () => {
      const filePath = '/path/to/audiobook.mp3';
      
      // Mock successful cover download but failed tag writing
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: Buffer.from('fake-image-data'),
      });
      
      mockedNodeID3.write.mockReturnValueOnce(false);
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(false);
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedNodeID3.write).toHaveBeenCalled();
    });

    it('should return false for unsupported file types', async () => {
      const filePath = '/path/to/audiobook.ogg';
      
      const result = await applyMetadata(filePath, sampleMetadata);
      
      expect(result).toBe(false);
      expect(mockedFileUtils.checkFileExists).toHaveBeenCalledWith(filePath);
      expect(mockedNodeID3.write).not.toHaveBeenCalled();
    });
  });
});

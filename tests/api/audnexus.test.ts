import axios from 'axios';
import { searchByAsin, searchByTitleAuthor } from '../../src/api/audnexus';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Audnexus API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup axios.create to return mockedAxios
    mockedAxios.create.mockReturnValue(mockedAxios);
  });

  describe('searchByAsin', () => {
    it('should return audiobook metadata when a valid ASIN is provided', async () => {
      // Mock response for successful API call
      const mockResponse = {
        status: 200,
        data: {
          success: true,
          data: {
            asin: 'B01LWUJKQ7',
            title: 'Project Hail Mary',
            authors: [{ name: 'Andy Weir', asin: 'B00TVCSHN6' }],
            narrators: [{ name: 'Ray Porter', asin: 'B01LWUJKQ7_NARRATOR' }],
            series: [],
            genres: [{ name: 'Science Fiction', asin: 'B01LWUJKQ7_GENRE' }],
            runtime: 16 * 3600, // 16 hours in seconds
            releaseDate: '2021-05-04',
            publisher: 'Audible Studios',
            summary: 'A fascinating sci-fi adventure...',
            rating: { overall: 4.8, performance: 4.9, story: 4.7 },
            language: 'english',
            image: 'https://example.com/cover.jpg',
            region: 'US'
          }
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockResponse);
      
      const result = await searchByAsin('B01LWUJKQ7');
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/books/B01LWUJKQ7');
      expect(result).toEqual(expect.objectContaining({
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        narrator: 'Ray Porter',
        asin: 'B01LWUJKQ7',
        year: '2021'
      }));
    });
    
    it('should return null when the ASIN is not found', async () => {
      // Mock 404 response
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { success: false, message: 'Book not found' }
        }
      });
      
      const result = await searchByAsin('INVALID_ASIN');
      
      expect(result).toBeNull();
    });
    
    it('should throw an error when the API call fails with a non-404 error', async () => {
      // Mock 500 response
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { success: false, message: 'Internal server error' }
        }
      });
      
      await expect(searchByAsin('B01LWUJKQ7')).rejects.toThrow();
    });
  });

  describe('searchByTitleAuthor', () => {
    it('should return audiobook metadata when valid title and author are provided', async () => {
      // Mock response for search query
      const mockSearchResponse = {
        status: 200,
        data: {
          results: [
            {
              asin: 'B01LWUJKQ7',
              title: 'Project Hail Mary',
              authors: [{ name: 'Andy Weir', asin: 'B00TVCSHN6' }],
              image: 'https://example.com/cover.jpg'
            }
          ]
        }
      };
      
      // Mock response for book details
      const mockBookResponse = {
        status: 200,
        data: {
          success: true,
          data: {
            asin: 'B01LWUJKQ7',
            title: 'Project Hail Mary',
            authors: [{ name: 'Andy Weir', asin: 'B00TVCSHN6' }],
            narrators: [{ name: 'Ray Porter', asin: 'B01LWUJKQ7_NARRATOR' }],
            series: [],
            genres: [{ name: 'Science Fiction', asin: 'B01LWUJKQ7_GENRE' }],
            runtime: 16 * 3600, // 16 hours in seconds
            releaseDate: '2021-05-04',
            publisher: 'Audible Studios',
            summary: 'A fascinating sci-fi adventure...',
            rating: { overall: 4.8, performance: 4.9, story: 4.7 },
            language: 'english',
            image: 'https://example.com/cover.jpg',
            region: 'US'
          }
        }
      };
      
      // First call returns search results, second call returns book details
      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);
      mockedAxios.get.mockResolvedValueOnce(mockBookResponse);
      
      const result = await searchByTitleAuthor('Project Hail Mary', 'Andy Weir');
      
      expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/search?q='));
      expect(mockedAxios.get).toHaveBeenCalledWith('/books/B01LWUJKQ7');
      expect(result).toEqual(expect.objectContaining({
        title: 'Project Hail Mary',
        author: 'Andy Weir',
        narrator: 'Ray Porter',
        asin: 'B01LWUJKQ7',
        year: '2021'
      }));
    });
    
    it('should return null when no search results are found', async () => {
      // Mock empty search results
      const mockSearchResponse = {
        status: 200,
        data: {
          results: []
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce(mockSearchResponse);
      
      const result = await searchByTitleAuthor('Nonexistent Book', 'Unknown Author');
      
      expect(result).toBeNull();
    });
  });
});

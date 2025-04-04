/**
 * Tests for the Audnexus API client
 */

const { AudnexusClient } = require('../../../src/api/audnexus/client');
const axios = require('axios');
const { ApiError } = require('../../../src/errors/apiErrors');

// Mock axios
jest.mock('axios');

describe('AudnexusClient', () => {
    let client;
    const mockConfig = {
        baseUrl: 'https://api.audnex.us',
        region: 'us',
        timeout: 5000
    };

    // Sample mock responses
    const mockBookResponse = {
        asin: 'B0BCKSQ2CK',
        title: 'Test Book',
        authors: [{ name: 'Test Author', asin: 'A123456789' }],
        narrators: [{ name: 'Test Narrator' }],
        releaseDate: '2023-01-01',
        runtimeLengthMin: 600,
        summary: 'This is a test book summary',
        seriesName: 'Test Series',
        seriesPosition: '1'
    };

    const mockChaptersResponse = {
        asin: 'B0BCKSQ2CK',
        chapters: [
            { title: 'Chapter 1', startOffsetMs: 0, lengthMs: 1800000 },
            { title: 'Chapter 2', startOffsetMs: 1800000, lengthMs: 1800000 }
        ],
        runtimeLengthMs: 3600000
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create a new client instance for each test
        client = new AudnexusClient(mockConfig);

        // Setup axios mock response
        axios.create.mockReturnValue({
            get: jest.fn(),
            interceptors: {
                request: { use: jest.fn() },
                response: { use: jest.fn() }
            }
        });
    });

    describe('constructor', () => {
        it('should initialize with default config', () => {
            const defaultClient = new AudnexusClient();
            expect(defaultClient).toBeDefined();
            expect(defaultClient.baseUrl).toBe('https://api.audnex.us');
            expect(defaultClient.defaultRegion).toBe('us');
        });

        it('should use provided config values', () => {
            expect(client.baseUrl).toBe(mockConfig.baseUrl);
            expect(client.defaultRegion).toBe(mockConfig.region);
            expect(client.timeout).toBe(mockConfig.timeout);
        });

        it('should set up axios interceptors', () => {
            expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
                baseURL: mockConfig.baseUrl,
                timeout: mockConfig.timeout
            }));

            const mockAxios = axios.create.mock.results[0].value;
            expect(mockAxios.interceptors.request.use).toHaveBeenCalled();
            expect(mockAxios.interceptors.response.use).toHaveBeenCalled();
        });
    });

    describe('getBookByAsin', () => {
        it('should throw an error if ASIN is not provided', async () => {
            await expect(client.getBookByAsin()).rejects.toThrow('ASIN is required');
        });

        it('should return book data on successful request', async () => {
            // Setup mock success response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: mockBookResponse });

            // Call the method
            const result = await client.getBookByAsin('B0BCKSQ2CK');

            // Verify API call
            expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/us/books/B0BCKSQ2CK'), expect.anything());

            // Verify transformed response
            expect(result).toBeDefined();
            expect(result.asin).toBe('B0BCKSQ2CK');
            expect(result.title).toBe('Test Book');
            expect(result.authors).toHaveLength(1);
            expect(result.authors[0].name).toBe('Test Author');

            // Verify series data is properly transformed
            expect(result.series).toBeDefined();
            expect(result.series.name).toBe('Test Series');
            expect(result.series.position).toBe('1');
        });

        it('should use the provided region', async () => {
            // Setup mock success response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: mockBookResponse });

            // Call the method with region override
            await client.getBookByAsin('B0BCKSQ2CK', 'uk');

            // Verify API call uses the right region
            expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/uk/books/B0BCKSQ2CK'), expect.anything());
        });

        it('should handle API errors correctly', async () => {
            // Setup mock error response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockRejectedValueOnce({
                response: {
                    status: 404,
                    data: { message: 'Book not found' },
                    statusText: 'Not Found'
                },
                config: { url: '/us/books/INVALID' }
            });

            // Call the method with invalid ASIN
            await expect(client.getBookByAsin('INVALID')).rejects.toThrow();
        });
    });

    describe('getBookChapters', () => {
        it('should return chapter data on successful request', async () => {
            // Setup mock success response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: mockChaptersResponse });

            // Call the method
            const result = await client.getBookChapters('B0BCKSQ2CK');

            // Verify API call
            expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('/us/books/B0BCKSQ2CK/chapters'), expect.anything());

            // Verify transformed response
            expect(result).toBeDefined();
            expect(result.asin).toBe('B0BCKSQ2CK');
            expect(result.chapters).toHaveLength(2);
            expect(result.chapters[0].title).toBe('Chapter 1');
            expect(result.chapters[0].startMs).toBe(0);
            expect(result.chapters[0].lengthMs).toBe(1800000);

            // Verify timestamps are properly formatted
            expect(result.chapters[0].startTimestamp).toBe('00:00:00');
            expect(result.chapters[0].endTimestamp).toBe('00:30:00');
        });
    });

    describe('searchBooks', () => {
        it('should throw error if no search parameters are provided', async () => {
            await expect(client.searchBooks()).rejects.toThrow('At least one search parameter is required');
            await expect(client.searchBooks({})).rejects.toThrow('At least one search parameter is required');
        });

        it('should perform search with title parameter', async () => {
            // Setup mock success response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: [mockBookResponse] });

            // Call the method with title
            const results = await client.searchBooks({ title: 'Test Book' });

            // Verify API call
            expect(mockAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/us/books'),
                expect.objectContaining({ params: { title: 'Test Book' } })
            );

            // Verify transformed response
            expect(results).toHaveLength(1);
            expect(results[0].title).toBe('Test Book');
        });

        it('should combine multiple search parameters', async () => {
            // Setup mock success response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: [mockBookResponse] });

            // Call the method with multiple parameters
            await client.searchBooks({
                title: 'Test Book',
                author: 'Test Author',
                narrator: 'Test Narrator'
            });

            // Verify API call includes all parameters
            expect(mockAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('/us/books'),
                expect.objectContaining({
                    params: {
                        title: 'Test Book',
                        author: 'Test Author',
                        narrator: 'Test Narrator'
                    }
                })
            );
        });

        it('should handle empty search results', async () => {
            // Setup mock empty response
            const mockAxios = axios.create.mock.results[0].value;
            mockAxios.get.mockResolvedValueOnce({ data: [] });

            // Call the method
            const results = await client.searchBooks({ title: 'Nonexistent Book' });

            // Verify response is an empty array
            expect(results).toEqual([]);
        });
    });
});
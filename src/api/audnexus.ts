import axios, { AxiosError, AxiosResponse } from 'axios';
import { getConfig } from '../config/config';
import { logger } from '../utils/logger';
import {
  AudnexusApiResponse,
  AudnexusBook,
  AudiobookMetadata,
  SearchResult,
} from './types';

// Initialize config
const config = getConfig();

// Set up axios instance for Audnexus API
const audnexusApi = axios.create({
  baseURL: `${config.api.audnexus.url}/${config.api.audnexus.version}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    ...(config.api.audnexus.key && { 'X-API-Key': config.api.audnexus.key }),
  },
});

/**
 * Convert Audnexus API book data to our internal AudiobookMetadata format
 * @param book The book data from Audnexus API
 * @returns Formatted audiobook metadata
 */
function convertToAudiobookMetadata(book: AudnexusBook): AudiobookMetadata {
  return {
    title: book.title,
    author: book.authors?.[0]?.name || '',
    narrator: book.narrators?.[0]?.name || '',
    series: book.series?.[0]?.name || '',
    part: book.series?.[0]?.position ? String(book.series[0].position) : '',
    year: book.releaseDate ? new Date(book.releaseDate).getFullYear().toString() : '',
    publisher: book.publisher || '',
    asin: book.asin,
    genres: book.genres?.map(g => g.name) || [],
    description: book.summary || '',
    coverUrl: book.image || '',
    hasCoverArt: !!book.image,
    audibleLink: `https://www.audible.com/pd/${book.asin}`,
    rating: book.rating?.overall ? String(book.rating.overall) : '',
    duration: book.runtime ? String(Math.floor(book.runtime / 60)) : '', // Convert seconds to minutes
  };
}

/**
 * Search for an audiobook by ASIN
 * @param asin The Audible ASIN
 * @returns Audiobook metadata or null if not found
 */
export async function searchByAsin(asin: string): Promise<AudiobookMetadata | null> {
  try {
    logger.debug(`Searching Audnexus API for ASIN: ${asin}`);
    
    const response: AxiosResponse<AudnexusApiResponse> = await audnexusApi.get(`/books/${asin}`);
    
    if (response.status === 200 && response.data.success && response.data.data) {
      logger.info(`Found book with ASIN: ${asin}`);
      return convertToAudiobookMetadata(response.data.data);
    } else {
      logger.warn(`No book found with ASIN: ${asin}`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        logger.warn(`Book not found with ASIN: ${asin}`);
        return null;
      }
      logger.error(`API error while searching by ASIN: ${axiosError.message}`);
      logger.debug(`Status: ${axiosError.response?.status}, Data: ${JSON.stringify(axiosError.response?.data)}`);
    } else if (error instanceof Error) {
      logger.error(`Error while searching by ASIN: ${error.message}`);
    } else {
      logger.error(`Unknown error while searching by ASIN: ${error}`);
    }
    throw error;
  }
}

/**
 * Search for an audiobook by title and author
 * @param title Book title
 * @param author Book author
 * @returns Audiobook metadata or null if not found
 */
export async function searchByTitleAuthor(title: string, author: string): Promise<AudiobookMetadata | null> {
  try {
    logger.debug(`Searching Audnexus API for title: "${title}" by author: "${author}"`);
    
    // Construct search query - basic implementation for Phase 1
    const query = encodeURIComponent(`${title} ${author}`);
    const response: AxiosResponse<{ results: SearchResult[] }> = await audnexusApi.get(`/search?q=${query}`);
    
    if (response.status === 200 && response.data.results && response.data.results.length > 0) {
      // Get the first result's ASIN
      const asin = response.data.results[0].asin;
      logger.info(`Found search result with ASIN: ${asin}`);
      
      // Fetch detailed book information using the ASIN
      return await searchByAsin(asin);
    } else {
      logger.warn(`No results found for title: "${title}" by author: "${author}"`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      logger.error(`API error while searching by title/author: ${axiosError.message}`);
      logger.debug(`Status: ${axiosError.response?.status}, Data: ${JSON.stringify(axiosError.response?.data)}`);
    } else if (error instanceof Error) {
      logger.error(`Error while searching by title/author: ${error.message}`);
    } else {
      logger.error(`Unknown error while searching by title/author: ${error}`);
    }
    throw error;
  }
}

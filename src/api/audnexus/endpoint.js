/**
 * Endpoints for the Audnexus API
 * 
 * These are the paths that will be appended to the base URL
 * Path parameters are indicated with a colon prefix (e.g., :asin)
 * and will be replaced with actual values at runtime.
 */

const ENDPOINTS = {
  // Book endpoints
  getBook: '/:region/books/:asin',
  getBookChapters: '/:region/books/:asin/chapters',
  searchBooks: '/:region/books', // With query params
  
  // Author endpoints
  getAuthor: '/:region/authors/:asin',
  searchAuthors: '/:region/authors' // With query params
};

module.exports = ENDPOINTS;
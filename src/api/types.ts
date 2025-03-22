/**
 * Interfaces for the Audnexus API responses and our internal metadata representation
 */

// Internal metadata representation
export interface AudiobookMetadata {
  title: string;
  author: string;
  narrator: string;
  series: string;
  part: string;
  year: string;
  publisher: string;
  asin: string;
  genres: string[];
  description: string;
  coverUrl: string;
  hasCoverArt: boolean;
  audibleLink: string;
  rating: string;
  duration: string;
}

// Audnexus API Types
export interface AudnexusApiResponse {
  success: boolean;
  data: AudnexusBook;
  message?: string;
}

export interface AudnexusAuthor {
  name: string;
  asin: string;
}

export interface AudnexusNarrator {
  name: string;
  asin: string;
}

export interface AudnexusSeries {
  name: string;
  asin: string;
  position: number;
}

export interface AudnexusGenre {
  name: string;
  asin: string;
}

export interface AudnexusRating {
  overall: number;
  performance: number;
  story: number;
}

export interface AudnexusBook {
  asin: string;
  title: string;
  subtitle?: string;
  authors?: AudnexusAuthor[];
  narrators?: AudnexusNarrator[];
  series?: AudnexusSeries[];
  genres?: AudnexusGenre[];
  runtime?: number; // in seconds
  releaseDate?: string;
  publisher?: string;
  summary?: string;
  rating?: AudnexusRating;
  language?: string;
  image?: string;
  region?: string;
}

export interface SearchResult {
  asin: string;
  title: string;
  authors?: AudnexusAuthor[];
  narrators?: AudnexusNarrator[];
  image?: string;
}

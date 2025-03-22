import * as path from 'path';
import { logger } from '../utils/logger';
import { AudiobookMetadata } from '../api/types';

/**
 * Extract metadata from an audiobook file
 * @param filePath Path to the audiobook file
 * @returns Extracted metadata in our standard format
 */
export async function extractMetadata(filePath: string): Promise<AudiobookMetadata> {
    try {
        logger.debug(`Extracting metadata from file: ${filePath}`);

        // Dynamically import music-metadata (ESM module)
        const mm = await import('music-metadata');

        // Parse file with music-metadata library
        const metadata = await mm.parseFile(filePath);

        // Get file extension
        const fileExt = path.extname(filePath).toLowerCase();

        // Initialize empty metadata object
        const audiobookMetadata: AudiobookMetadata = {
            title: '',
            author: '',
            narrator: '',
            series: '',
            part: '',
            year: '',
            publisher: '',
            asin: '',
            genres: [],
            description: '',
            coverUrl: '',
            hasCoverArt: false,
            audibleLink: '',
            rating: '',
            duration: '',
        };

        // Extract common metadata
        if (metadata.common) {
            // Basic metadata
            audiobookMetadata.title = metadata.common.title || '';
            audiobookMetadata.author = metadata.common.artist || metadata.common.albumartist || '';
            audiobookMetadata.narrator = Array.isArray(metadata.common.composer)
                ? metadata.common.composer[0]
                : (metadata.common.composer || '');
            audiobookMetadata.publisher = Array.isArray(metadata.common.copyright)
                ? metadata.common.copyright[0]
                : (Array.isArray(metadata.common.label)
                    ? metadata.common.label[0]
                    : (metadata.common.copyright || metadata.common.label || ''));
            audiobookMetadata.year = metadata.common.year ? metadata.common.year.toString() : '';

            // Handle genres
            if (metadata.common.genre && metadata.common.genre.length > 0) {
                audiobookMetadata.genres = metadata.common.genre;
            }

            // Extract description from comments or other fields
            if (metadata.common.comment) {
                audiobookMetadata.description = Array.isArray(metadata.common.comment)
                    ? metadata.common.comment[0]
                    : metadata.common.comment;
            }

            // Check for cover art
            if (metadata.common.picture && metadata.common.picture.length > 0) {
                audiobookMetadata.hasCoverArt = true;
            }

            // Extract ASIN from ID3v2 tags (usually in TXXX or COMM frames)
            // This is a simplistic implementation for Phase 1
            if (metadata.native && (metadata.native['ID3v2.4'] || metadata.native['ID3v2.3'])) {
                const id3Tags = metadata.native['ID3v2.4'] || metadata.native['ID3v2.3'] || [];

                for (const tag of id3Tags) {
                    // Look for ASIN in TXXX frames
                    if (tag.id === 'TXXX' && tag.value && typeof tag.value === 'object') {
                        if (tag.value.description && tag.value.description.toLowerCase().includes('asin')) {
                            audiobookMetadata.asin = tag.value.text || '';
                            break;
                        }
                    }

                    // Look for series information in TXXX frames
                    if (tag.id === 'TXXX' && tag.value && typeof tag.value === 'object') {
                        if (tag.value.description && tag.value.description.toLowerCase().includes('series')) {
                            audiobookMetadata.series = tag.value.text || '';
                        }
                        if (tag.value.description && tag.value.description.toLowerCase().includes('part')) {
                            audiobookMetadata.part = tag.value.text || '';
                        }
                    }

                    // Look in comments for descriptions or other metadata
                    if (tag.id === 'COMM' && tag.value && typeof tag.value === 'object' && tag.value.text) {
                        if (!audiobookMetadata.description) {
                            audiobookMetadata.description = tag.value.text;
                        }
                    }
                }
            }

            // Extract duration if available
            if (metadata.format && metadata.format.duration) {
                // Convert seconds to minutes and round down
                const minutes = Math.floor(metadata.format.duration / 60);
                audiobookMetadata.duration = minutes.toString();
            }
        }

        logger.debug(`Metadata extracted: ${JSON.stringify(audiobookMetadata)}`);
        return audiobookMetadata;
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error extracting metadata: ${error.message}`);
            logger.debug(error.stack || 'No stack trace available');
        } else {
            logger.error(`Unknown error extracting metadata: ${error}`);
        }

        // Return empty metadata object in case of error
        return {
            title: '',
            author: '',
            narrator: '',
            series: '',
            part: '',
            year: '',
            publisher: '',
            asin: '',
            genres: [],
            description: '',
            coverUrl: '',
            hasCoverArt: false,
            audibleLink: '',
            rating: '',
            duration: '',
        };
    }
}
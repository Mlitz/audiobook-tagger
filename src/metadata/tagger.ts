import * as path from 'path';
import * as fs from 'fs/promises';
import axios from 'axios';
import NodeID3 from 'node-id3';
import { logger } from '../utils/logger';
import { AudiobookMetadata } from '../api/types';
import { checkFileExists } from '../utils/file';

/**
 * Apply metadata to an audiobook file
 * @param filePath Path to the audiobook file
 * @param metadata Metadata to apply
 * @returns True if successful, false otherwise
 */
export async function applyMetadata(filePath: string, metadata: AudiobookMetadata): Promise<boolean> {
  try {
    logger.debug(`Applying metadata to file: ${filePath}`);
    
    // Check if file exists
    const fileExists = await checkFileExists(filePath);
    if (!fileExists) {
      logger.error(`File not found: ${filePath}`);
      return false;
    }
    
    // Get file extension to determine file type
    const fileExt = path.extname(filePath).toLowerCase();
    
    // Handle MP3 files
    if (fileExt === '.mp3') {
      return await applyMp3Metadata(filePath, metadata);
    }
    // Handle M4B files
    else if (fileExt === '.m4b') {
      // For Phase 1, we'll log that M4B is not fully supported yet
      logger.warn('M4B tagging is not fully implemented in Phase 1. Basic tagging will be attempted.');
      // For now, call the same function as MP3 (with limited support)
      return await applyMp3Metadata(filePath, metadata);
    }
    // Unsupported file type
    else {
      logger.error(`Unsupported file type: ${fileExt}`);
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error applying metadata: ${error.message}`);
      logger.debug(error.stack || 'No stack trace available');
    } else {
      logger.error(`Unknown error applying metadata: ${error}`);
    }
    return false;
  }
}

/**
 * Apply metadata to an MP3 file
 * @param filePath Path to the MP3 file
 * @param metadata Metadata to apply
 * @returns True if successful, false otherwise
 */
async function applyMp3Metadata(filePath: string, metadata: AudiobookMetadata): Promise<boolean> {
  try {
    logger.debug(`Applying MP3 metadata to file: ${filePath}`);
    
    // Create tags object for NodeID3
    const tags: NodeID3.Tags = {
      title: metadata.title,
      artist: metadata.author,
      album: metadata.title,
      composer: metadata.narrator,
      year: metadata.year,
      genre: metadata.genres.length > 0 ? metadata.genres[0] : 'Audiobook',
      comment: {
        language: 'eng',
        text: metadata.description,
      },
      publisher: metadata.publisher,
    };
    
    // Add series information using custom TXXX frames
    if (metadata.series) {
      tags.userDefinedText = tags.userDefinedText || [];
      tags.userDefinedText.push({
        description: 'Series',
        value: metadata.series,
      });
      
      // Also add as MOOD tag for Plex collections
      tags.mood = metadata.series;
    }
    
    // Add part information if available
    if (metadata.part) {
      if (!tags.userDefinedText) tags.userDefinedText = [];
      tags.userDefinedText.push({
        description: 'Part',
        value: metadata.part,
      });
      
      // Add track number for series order
      tags.trackNumber = metadata.part;
    }
    
    // Add ASIN
    if (metadata.asin) {
      if (!tags.userDefinedText) tags.userDefinedText = [];
      tags.userDefinedText.push({
        description: 'ASIN',
        value: metadata.asin,
      });
    }
    
    // Add Audible Link
    if (metadata.audibleLink) {
      if (!tags.userDefinedText) tags.userDefinedText = [];
      tags.userDefinedText.push({
        description: 'AudibleLink',
        value: metadata.audibleLink,
      });
    }
    
    // Handle cover art if URL is available
    if (metadata.coverUrl) {
      logger.debug(`Downloading cover art from ${metadata.coverUrl}`);
      try {
        const response = await axios.get(metadata.coverUrl, { 
          responseType: 'arraybuffer' 
        });
        
        if (response.status === 200) {
          tags.image = {
            mime: 'image/jpeg', // Assuming JPEG - could be improved
            type: { id: 3, name: 'front cover' },
            description: 'Cover',
            imageBuffer: Buffer.from(response.data),
          };
          logger.debug('Cover art downloaded successfully');
        } else {
          logger.warn(`Failed to download cover art: Status ${response.status}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.warn(`Error downloading cover art: ${error.message}`);
        } else {
          logger.warn(`Unknown error downloading cover art: ${error}`);
        }
        // Continue without cover art
      }
    }
    
    // Write tags to file
    const success = NodeID3.write(tags, filePath);
    
    if (success) {
      logger.info('Metadata successfully applied to MP3 file');
      return true;
    } else {
      logger.error('Failed to write metadata to MP3 file');
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error applying MP3 metadata: ${error.message}`);
      logger.debug(error.stack || 'No stack trace available');
    } else {
      logger.error(`Unknown error applying MP3 metadata: ${error}`);
    }
    return false;
  }
}

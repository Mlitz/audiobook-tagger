import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from './logger';

/**
 * Check if a file exists
 * @param filePath Path to the file
 * @returns Promise resolving to true if file exists, false otherwise
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory exists and create it if it doesn't
 * @param dirPath Path to the directory
 * @returns Promise resolving to true if successful, false otherwise
 */
export async function ensureDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    try {
      const stats = await fs.stat(dirPath);
      if (stats.isDirectory()) {
        return true;
      }
      logger.error(`Path exists but is not a directory: ${dirPath}`);
      return false;
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
      logger.debug(`Created directory: ${dirPath}`);
      return true;
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error ensuring directory exists: ${error.message}`);
    } else {
      logger.error(`Unknown error ensuring directory exists: ${error}`);
    }
    return false;
  }
}

/**
 * Get file extension from path
 * @param filePath Path to the file
 * @returns File extension (with dot) or empty string if none
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Get filename without extension
 * @param filePath Path to the file
 * @returns Filename without extension
 */
export function getFileNameWithoutExtension(filePath: string): string {
  const basename = path.basename(filePath);
  const extname = path.extname(basename);
  return basename.substring(0, basename.length - extname.length);
}

/**
 * Sanitize a filename to remove invalid characters
 * @param filename Filename to sanitize
 * @returns Sanitized filename
 */
export function sanitizeFileName(filename: string): string {
  // Replace invalid characters with underscores
  return filename
    .replace(/[<>:"\/\\|?*]/g, '_')  // Replace invalid Windows filename chars
    .replace(/\s+/g, ' ')            // Replace multiple spaces with single space
    .trim();                         // Remove leading/trailing spaces
}

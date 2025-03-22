import { Command } from 'commander';
import chalk from 'chalk';
import { logger } from './utils/logger';
import { searchByAsin, searchByTitleAuthor } from './api/audnexus';
import { extractMetadata } from './metadata/extractor';
import { applyMetadata } from './metadata/tagger';
import { checkFileExists } from './utils/file';
import { getConfig } from './config/config';

export async function setupCli(): Promise<void> {
  const program = new Command();
  const config = getConfig();
  
  // Set up the program details
  program
    .name('audiobook-tagger')
    .description('A program that tags audiobooks using the Audnexus API and organizes them according to Plex conventions')
    .version('0.1.0');

  // Tag command
  program
    .command('tag')
    .description('Tag an audiobook file with metadata from Audnexus')
    .requiredOption('-f, --file <path>', 'Path to the audiobook file')
    .option('-a, --asin <asin>', 'Audible ASIN for direct search')
    .option('-t, --title <title>', 'Book title for search')
    .option('-u, --author <author>', 'Book author for search')
    .action(async (options) => {
      try {
        // Check if file exists
        const fileExists = await checkFileExists(options.file);
        if (!fileExists) {
          logger.error(`File not found: ${options.file}`);
          process.exit(1);
        }

        logger.info(`Processing file: ${options.file}`);
        
        // Extract current metadata from file
        logger.info('Extracting current metadata...');
        const currentMetadata = await extractMetadata(options.file);
        logger.info('Current metadata extracted.');
        
        // Search for book metadata
        logger.info('Searching Audnexus API for metadata...');
        let metadata;
        
        if (options.asin) {
          logger.info(`Searching by ASIN: ${options.asin}`);
          metadata = await searchByAsin(options.asin);
        } else if (options.title && options.author) {
          logger.info(`Searching by title and author: ${options.title} by ${options.author}`);
          metadata = await searchByTitleAuthor(options.title, options.author);
        } else if (currentMetadata.asin) {
          logger.info(`Using ASIN from file metadata: ${currentMetadata.asin}`);
          metadata = await searchByAsin(currentMetadata.asin);
        } else if (currentMetadata.title && currentMetadata.author) {
          logger.info(`Using title and author from file metadata: ${currentMetadata.title} by ${currentMetadata.author}`);
          metadata = await searchByTitleAuthor(currentMetadata.title, currentMetadata.author);
        } else {
          logger.error('Not enough information to search. Please provide ASIN or title and author.');
          process.exit(1);
        }
        
        if (!metadata) {
          logger.error('No metadata found.');
          process.exit(1);
        }
        
        // Apply metadata to file
        logger.info('Applying metadata to file...');
        const success = await applyMetadata(options.file, metadata);
        
        if (success) {
          logger.info(chalk.green('Metadata successfully applied to file.'));
        } else {
          logger.error(chalk.red('Failed to apply metadata to file.'));
          process.exit(1);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error while tagging: ${error.message}`);
          logger.debug(error.stack || 'No stack trace available');
        } else {
          logger.error(`Unknown error while tagging: ${error}`);
        }
        process.exit(1);
      }
    });

  // Info command
  program
    .command('info')
    .description('Display information about an audiobook file')
    .requiredOption('-f, --file <path>', 'Path to the audiobook file')
    .action(async (options) => {
      try {
        // Check if file exists
        const fileExists = await checkFileExists(options.file);
        if (!fileExists) {
          logger.error(`File not found: ${options.file}`);
          process.exit(1);
        }

        logger.info(`Reading metadata from file: ${options.file}`);
        
        // Extract current metadata from file
        const metadata = await extractMetadata(options.file);
        
        // Display metadata
        console.log(chalk.bold('\nAudiobook Metadata:'));
        console.log(chalk.cyan('Title:'), metadata.title || 'Not available');
        console.log(chalk.cyan('Author:'), metadata.author || 'Not available');
        console.log(chalk.cyan('Narrator:'), metadata.narrator || 'Not available');
        console.log(chalk.cyan('Series:'), metadata.series || 'Not available');
        console.log(chalk.cyan('Part:'), metadata.part || 'Not available');
        console.log(chalk.cyan('Year:'), metadata.year || 'Not available');
        console.log(chalk.cyan('Publisher:'), metadata.publisher || 'Not available');
        console.log(chalk.cyan('ASIN:'), metadata.asin || 'Not available');
        console.log(chalk.cyan('Genres:'), metadata.genres?.join(', ') || 'Not available');
        console.log(chalk.cyan('Description:'), metadata.description || 'Not available');
        console.log(chalk.cyan('Cover Art:'), metadata.hasCoverArt ? 'Present' : 'Not available');
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error while reading info: ${error.message}`);
          logger.debug(error.stack || 'No stack trace available');
        } else {
          logger.error(`Unknown error while reading info: ${error}`);
        }
        process.exit(1);
      }
    });

  // Search command
  program
    .command('search')
    .description('Search for an audiobook in the Audnexus API')
    .option('-a, --asin <asin>', 'Audible ASIN for direct search')
    .option('-t, --title <title>', 'Book title')
    .option('-u, --author <author>', 'Book author')
    .action(async (options) => {
      try {
        // Check if we have enough information to search
        if (!options.asin && !(options.title && options.author)) {
          logger.error('Not enough information to search. Please provide ASIN or title and author.');
          process.exit(1);
        }
        
        // Search for book metadata
        logger.info('Searching Audnexus API for metadata...');
        let metadata;
        
        if (options.asin) {
          logger.info(`Searching by ASIN: ${options.asin}`);
          metadata = await searchByAsin(options.asin);
        } else {
          logger.info(`Searching by title and author: ${options.title} by ${options.author}`);
          metadata = await searchByTitleAuthor(options.title!, options.author!);
        }
        
        if (!metadata) {
          logger.error('No metadata found.');
          process.exit(1);
        }
        
        // Display metadata
        console.log(chalk.bold('\nAudiobook Metadata:'));
        console.log(chalk.cyan('Title:'), metadata.title || 'Not available');
        console.log(chalk.cyan('Author:'), metadata.author || 'Not available');
        console.log(chalk.cyan('Narrator:'), metadata.narrator || 'Not available');
        console.log(chalk.cyan('Series:'), metadata.series || 'Not available');
        console.log(chalk.cyan('Part:'), metadata.part || 'Not available');
        console.log(chalk.cyan('Year:'), metadata.year || 'Not available');
        console.log(chalk.cyan('Publisher:'), metadata.publisher || 'Not available');
        console.log(chalk.cyan('ASIN:'), metadata.asin || 'Not available');
        console.log(chalk.cyan('Genres:'), metadata.genres?.join(', ') || 'Not available');
        console.log(chalk.cyan('Description:'), metadata.description || 'Not available');
        console.log(chalk.cyan('Cover URL:'), metadata.coverUrl || 'Not available');
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error while searching: ${error.message}`);
          logger.debug(error.stack || 'No stack trace available');
        } else {
          logger.error(`Unknown error while searching: ${error}`);
        }
        process.exit(1);
      }
    });

  // Execute the program
  await program.parseAsync(process.argv);
}

#!/usr/bin/env node

import dotenv from 'dotenv';
import { setupCli } from './cli';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    logger.info('Starting Audiobook Tagger');
    
    // Set up and execute CLI
    await setupCli();
    
    logger.info('Audiobook Tagger completed successfully');
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`An error occurred: ${error.message}`);
      logger.debug(error.stack || 'No stack trace available');
    } else {
      logger.error(`An unknown error occurred: ${error}`);
    }
    process.exit(1);
  }
}

// Execute the main function
main();

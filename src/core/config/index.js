const { app } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { validate } = require('./schema');
const { defaultConfig } = require('./defaults');
const { logger } = require('../utils/logger');

// In-memory configuration cache
let configCache = null;

/**
 * Load the application configuration
 * @param {string} [configPath] - Optional path to config file, uses default if not provided
 * @returns {Promise<Object>} - The loaded and validated configuration
 */
async function loadConfig(configPath) {
  // If we already have a cached config, return it
  if (configCache) {
    return configCache;
  }
  
  try {
    // Determine config file path
    const configFilePath = configPath || getDefaultConfigPath();
    logger.debug(`Loading config from: ${configFilePath}`);
    
    // Check if config file exists
    let config;
    try {
      // Read and parse the config file
      const configData = await fs.readFile(configFilePath, 'utf8');
      config = JSON.parse(configData);
      logger.debug('Configuration file loaded successfully');
    } catch (error) {
      // If file doesn't exist or is invalid, use default config
      if (error.code === 'ENOENT') {
        logger.info('Configuration file not found, using defaults');
        config = { ...defaultConfig };
        
        // Save the default config for next time
        await saveConfig(config, configFilePath);
      } else {
        logger.error('Error parsing configuration file', { error });
        throw new Error(`Failed to parse configuration file: ${error.message}`);
      }
    }
    
    // Merge with defaults to ensure all properties exist
    const mergedConfig = mergeWithDefaults(config);
    
    // Validate the configuration
    const { valid, errors } = validate(mergedConfig);
    if (!valid) {
      logger.warn('Configuration validation failed', { errors });
      
      // Use default config if validation fails
      configCache = { ...defaultConfig };
      return configCache;
    }
    
    // Cache the valid config
    configCache = mergedConfig;
    return configCache;
  } catch (error) {
    logger.error('Failed to load configuration', { error });
    
    // Fallback to default config in case of errors
    configCache = { ...defaultConfig };
    return configCache;
  }
}

/**
 * Save the configuration to file
 * @param {Object} config - Configuration to save
 * @param {string} [configPath] - Optional path, uses default if not provided
 * @returns {Promise<void>}
 */
async function saveConfig(config, configPath) {
  try {
    // Validate before saving
    const { valid, errors } = validate(config);
    if (!valid) {
      logger.error('Cannot save invalid configuration', { errors });
      throw new Error('Invalid configuration');
    }
    
    // Determine config file path
    const configFilePath = configPath || getDefaultConfigPath();
    logger.debug(`Saving config to: ${configFilePath}`);
    
    // Ensure directory exists
    const configDir = path.dirname(configFilePath);
    await fs.mkdir(configDir, { recursive: true });
    
    // Write config to file with pretty formatting
    await fs.writeFile(
      configFilePath,
      JSON.stringify(config, null, 2),
      'utf8'
    );
    
    // Update cache
    configCache = config;
    
    logger.info('Configuration saved successfully');
  } catch (error) {
    logger.error('Failed to save configuration', { error });
    throw error;
  }
}

/**
 * Get a specific configuration value
 * @param {string} [key] - Configuration key (dot notation supported)
 * @returns {any} - Configuration value or entire config if no key provided
 */
function getConfig(key) {
  if (!configCache) {
    throw new Error('Configuration not loaded');
  }
  
  // Return entire config if no key specified
  if (!key) {
    return { ...configCache };
  }
  
  // Support dot notation for nested properties
  const parts = key.split('.');
  let value = configCache;
  
  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      return undefined;
    }
    value = value[part];
  }
  
  return value;
}

/**
 * Update a specific configuration value
 * @param {string} key - Configuration key to update (dot notation supported)
 * @param {any} value - New value to set
 * @returns {Promise<Object>} - Updated configuration
 */
async function updateConfig(key, value) {
  if (!configCache) {
    await loadConfig();
  }
  
  // Create a copy of the current config
  const updatedConfig = { ...configCache };
  
  // Support dot notation for nested properties
  const parts = key.split('.');
  let current = updatedConfig;
  
  // Navigate to the nested property
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // Create objects along the path if they don't exist
    if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    
    current = current[part];
  }
  
  // Set the value at the final property
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
  
  // Validate the updated config
  const { valid, errors } = validate(updatedConfig);
  if (!valid) {
    logger.error('Invalid configuration update', { key, errors });
    throw new Error(`Invalid configuration update for ${key}: ${errors.join(', ')}`);
  }
  
  // Save the updated config
  await saveConfig(updatedConfig);
  
  return updatedConfig;
}

/**
 * Reset configuration to defaults
 * @param {boolean} [persist=true] - Whether to save the reset config
 * @returns {Promise<Object>} - Default configuration
 */
async function resetConfig(persist = true) {
  logger.info('Resetting configuration to defaults');
  
  // Clone default config
  const config = { ...defaultConfig };
  
  // Save if requested
  if (persist) {
    await saveConfig(config);
  } else {
    // Just update cache
    configCache = config;
  }
  
  return config;
}

/**
 * Merge a config with default values, ensuring all properties exist
 * @param {Object} config - Configuration to merge
 * @returns {Object} - Merged configuration
 * @private
 */
function mergeWithDefaults(config) {
  // Deep merge function
  function deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (
        source[key] !== null && 
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        // Recursively merge objects
        if (key in target && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          output[key] = deepMerge(target[key], source[key]);
        } else {
          output[key] = { ...source[key] };
        }
      } else if (!(key in target)) {
        // Copy source property if not in target
        output[key] = source[key];
      }
    }
    
    return output;
  }
  
  return deepMerge(config, defaultConfig);
}

/**
 * Get the default configuration file path
 * @returns {string} - Default config file path
 * @private
 */
function getDefaultConfigPath() {
  // Use electron app path in production, fallback for development
  const userDataPath = app?.getPath ? app.getPath('userData') : process.cwd();
  return path.join(userDataPath, 'config', 'config.json');
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig,
  updateConfig,
  resetConfig
};
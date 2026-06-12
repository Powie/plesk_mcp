import dotenv from 'dotenv';
import { PleskInstance } from './types.js';

// Load environment variables
dotenv.config();

/**
 * Load all Plesk instances from environment variables
 * Supports PLESK_URL/PLESK_API_KEY and PLESK_N_URL/PLESK_N_API_KEY patterns
 */
export function loadPleskInstances(): Map<string, PleskInstance> {
  const instances = new Map<string, PleskInstance>();

  // Load default instance
  const defaultUrl = process.env.PLESK_URL;
  const defaultApiKey = process.env.PLESK_API_KEY;

  if (defaultUrl && defaultApiKey) {
    instances.set('default', {
      name: 'default',
      url: defaultUrl,
      apiKey: defaultApiKey,
    });
  }

  // Load numbered instances (PLESK_2_, PLESK_3_, etc.)
  const envVars = Object.keys(process.env);
  const instanceNumbers = new Set<string>();

  // Find all instance numbers
  envVars.forEach(key => {
    const match = key.match(/^PLESK_(\d+)_/);
    if (match) {
      instanceNumbers.add(match[1]);
    }
  });

  // Load each numbered instance
  instanceNumbers.forEach(num => {
    const url = process.env[`PLESK_${num}_URL`];
    const apiKey = process.env[`PLESK_${num}_API_KEY`];

    if (url && apiKey) {
      instances.set(`instance_${num}`, {
        name: `instance_${num}`,
        url: url,
        apiKey: apiKey,
      });
    }
  });

  if (instances.size === 0) {
    console.error('Warning: No Plesk instances configured. Please check your .env file.');
  }

  return instances;
}

/**
 * Get a specific instance or the default one
 */
export function getInstance(instances: Map<string, PleskInstance>, name?: string): PleskInstance {
  if (!name || name === 'default') {
    const defaultInstance = instances.get('default');
    if (!defaultInstance && instances.size > 0) {
      // Return first available instance if no default
      const firstInstance = instances.values().next().value;
      if (!firstInstance) {
        throw new Error('No Plesk instances configured');
      }
      return firstInstance;
    }
    if (!defaultInstance) {
      throw new Error('No Plesk instances configured');
    }
    return defaultInstance;
  }

  const instance = instances.get(name);
  if (!instance) {
    throw new Error(`Plesk instance '${name}' not found. Available: ${Array.from(instances.keys()).join(', ')}`);
  }

  return instance;
}

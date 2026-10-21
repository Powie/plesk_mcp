import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { PleskInstance } from './types.js';

/**
 * Package root directory (one level above dist/)
 */
export const PACKAGE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * .env file written by plesk_generate_api_key
 */
export const ENV_PATH = path.join(PACKAGE_ROOT, '.env');

// Load environment variables: the working directory's .env takes precedence,
// then the package's own .env (where plesk_generate_api_key saves keys).
// Variables already set in the environment (e.g. by the MCP client config) win over both.
dotenv.config({ path: [path.resolve('.env'), ENV_PATH] });

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

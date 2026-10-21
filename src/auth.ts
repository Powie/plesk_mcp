import axios from 'axios';
import fs from 'fs';
import { createHttpsAgent, normalizeUrl } from './api-client.js';
import { ENV_PATH } from './config.js';

/**
 * Generate API key using username/password authentication
 */
export async function generateApiKey(
  pleskUrl: string,
  username: string,
  password: string,
  description: string = 'MCP Server API Key'
): Promise<string> {
  try {
    const response = await axios.post(
      `${normalizeUrl(pleskUrl)}/api/v2/cli/secret_key/call`,
      {
        // /auth/keys defaults to the caller's IP. The CLI omits IP binding.
        params: ['--create', '-description', description],
      },
      {
        auth: {
          username: username,
          password: password,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        httpsAgent: createHttpsAgent(),
      }
    );

    const result = response.data;
    if (result?.code !== 0 || typeof result.stdout !== 'string' || !result.stdout.trim()) {
      throw new Error('Plesk did not return a valid API key from secret_key');
    }
    return result.stdout.trim();
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to generate API key: ${status} - ${message}`);
    }
    throw error;
  }
}

/**
 * Save API key to .env file
 */
export function saveApiKeyToEnv(
  instanceName: string,
  pleskUrl: string,
  apiKey: string
): void {
  const envPath = ENV_PATH;

  let envContent = '';

  // Read existing .env if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Determine the variable names
  let urlVar: string;
  let keyVar: string;

  if (instanceName === 'default') {
    urlVar = 'PLESK_URL';
    keyVar = 'PLESK_API_KEY';
  } else {
    // Extract number from instance name (e.g., instance_2 -> 2)
    const match = instanceName.match(/instance_(\d+)/);
    const num = match ? match[1] : instanceName;
    urlVar = `PLESK_${num}_URL`;
    keyVar = `PLESK_${num}_API_KEY`;
  }

  // Check if variables already exist
  const urlRegex = new RegExp(`^${urlVar}=.*$`, 'm');
  const keyRegex = new RegExp(`^${keyVar}=.*$`, 'm');

  if (urlRegex.test(envContent)) {
    // Update existing URL
    envContent = envContent.replace(urlRegex, `${urlVar}=${pleskUrl}`);
  } else {
    // Add new URL
    envContent += `\n${urlVar}=${pleskUrl}`;
  }

  if (keyRegex.test(envContent)) {
    // Update existing API key
    envContent = envContent.replace(keyRegex, `${keyVar}=${apiKey}`);
  } else {
    // Add new API key
    envContent += `\n${keyVar}=${apiKey}`;
  }

  // Write back to .env
  fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
}

/**
 * List all API keys via the secret_key CLI utility.
 * The REST API has no endpoint for listing keys.
 */
export async function listApiKeys(
  pleskUrl: string,
  username: string,
  password: string
): Promise<string> {
  try {
    const response = await axios.post(
      `${normalizeUrl(pleskUrl)}/api/v2/cli/secret_key/call`,
      { params: ['--list'] },
      {
        auth: { username, password },
        httpsAgent: createHttpsAgent(),
      }
    );

    const result = response.data;
    if (result?.code !== 0) {
      throw new Error(`secret_key --list failed: ${result?.stderr || result?.stdout || 'unknown error'}`);
    }
    return result.stdout;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to list API keys: ${status} - ${message}`);
    }
    throw error;
  }
}

/**
 * Delete an API key. The REST API identifies keys by their value.
 */
export async function deleteApiKey(
  pleskUrl: string,
  username: string,
  password: string,
  apiKey: string
): Promise<void> {
  try {
    await axios.delete(
      `${normalizeUrl(pleskUrl)}/api/v2/auth/keys/${encodeURIComponent(apiKey)}`,
      {
        auth: { username, password },
        httpsAgent: createHttpsAgent(),
      }
    );
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      throw new Error(`Failed to delete API key: ${status} - ${message}`);
    }
    throw error;
  }
}

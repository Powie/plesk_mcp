import axios from 'axios';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      `${pleskUrl.replace(/\/$/, '')}/api/v2/cli/secret_key/call`,
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
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
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
  const envPath = path.join(__dirname, '..', '.env');

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
 * List all existing API keys
 */
export async function listApiKeys(
  pleskUrl: string,
  username: string,
  password: string
): Promise<any[]> {
  try {
    const response = await axios.get(
      `${pleskUrl}/api/v2/auth/keys`,
      {
        auth: {
          username: username,
          password: password,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    );

    return response.data;
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
 * Delete an API key
 */
export async function deleteApiKey(
  pleskUrl: string,
  username: string,
  password: string,
  keyId: string
): Promise<void> {
  try {
    await axios.delete(
      `${pleskUrl}/api/v2/auth/keys/${keyId}`,
      {
        auth: {
          username: username,
          password: password,
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
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

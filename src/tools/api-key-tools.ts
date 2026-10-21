import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateApiKey, saveApiKeyToEnv, listApiKeys, deleteApiKey } from '../auth.js';
import { jsonResult, run, WRITE, DESTRUCTIVE } from './helpers.js';

const pleskUrl = z.string().describe('Plesk server URL including port, e.g. "https://your-server.com:8443"');
const username = z.string().describe('Plesk admin username');
const password = z.string().describe('Plesk admin password');

/**
 * API key management tools.
 * These authenticate with admin username/password instead of an API key,
 * since they are used to bootstrap or rotate the API keys themselves.
 */
export function registerApiKeyTools(server: McpServer) {
  server.registerTool(
    'plesk_generate_api_key',
    {
      description: 'Generate a new Plesk API key without IP binding using admin username/password and save it to the .env file of the MCP server. Supports clients with changing public IP addresses. Requires access to the Plesk secret_key CLI utility via REST API. Use this for initial setup or key rotation. The MCP server must be restarted afterwards to pick up the new key.',
      inputSchema: {
        plesk_url: pleskUrl,
        username,
        password,
        instance_name: z.string().optional().describe('Instance name used in .env: "default", "instance_2", etc.'),
        description: z.string().optional().describe('Description stored with the API key in Plesk'),
      },
      annotations: WRITE,
    },
    async (args) =>
      run(async () => {
        const instanceName = args.instance_name || 'default';
        const description = args.description || 'MCP Server API Key';
        const apiKey = await generateApiKey(args.plesk_url, args.username, args.password, description);
        saveApiKeyToEnv(instanceName, args.plesk_url, apiKey);
        return {
          success: true,
          message: `API key generated and saved to .env for instance "${instanceName}"`,
          instance: instanceName,
          url: args.plesk_url,
          note: 'Please restart the MCP server to load the new configuration',
        };
      })
  );

  server.registerTool(
    'plesk_list_api_keys',
    {
      description: 'List all API keys registered on a Plesk server (output of "secret_key --list": IP restrictions and descriptions). Plesk stores only key hashes, so the key values themselves are not shown. Requires admin username/password.',
      inputSchema: { plesk_url: pleskUrl, username, password },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => run(() => listApiKeys(args.plesk_url, args.username, args.password))
  );

  server.registerTool(
    'plesk_delete_api_key',
    {
      description: 'Delete an API key from a Plesk server by its value (e.g. the old key from .env). Keys whose value is unknown can be deleted in the "Keychain for API Secret Keys" extension (secret-keys-manager). Requires admin username/password. Irreversible — any client still using the key loses access immediately. Confirm with the user before calling.',
      inputSchema: {
        plesk_url: pleskUrl,
        username,
        password,
        api_key: z.string().describe('The API key value to delete, e.g. the old PLESK_API_KEY from the configuration'),
      },
      annotations: DESTRUCTIVE,
    },
    async (args) =>
      run(async () => {
        await deleteApiKey(args.plesk_url, args.username, args.password, args.api_key);
        return { success: true, message: 'API key deleted successfully' };
      })
  );
}

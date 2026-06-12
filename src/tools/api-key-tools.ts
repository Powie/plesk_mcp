import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { generateApiKey, saveApiKeyToEnv, listApiKeys, deleteApiKey } from '../auth.js';
import { jsonResult, run } from './helpers.js';

/**
 * API key management tools.
 * These authenticate with admin username/password instead of an API key,
 * since they are used to bootstrap or rotate the API keys themselves.
 */
export function registerApiKeyTools(server: McpServer) {
  server.tool(
    'plesk_generate_api_key',
    'Generate a new Plesk API key using admin username/password and save it to the local .env file. Use this for initial setup or key rotation when no working API key is configured yet. The MCP server must be restarted afterwards to pick up the new key.',
    {
      plesk_url: z.string().describe('Plesk server URL including port, e.g. "https://your-server.com:8443"'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
      instance_name: z.string().optional().describe('Instance name used in .env: "default", "instance_2", etc.'),
      description: z.string().optional().describe('Description stored with the API key in Plesk'),
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

  server.tool(
    'plesk_list_api_keys',
    'List all API keys registered on a Plesk server, with their IDs and descriptions. Requires admin username/password. Use this to find a key ID for plesk_delete_api_key.',
    {
      plesk_url: z.string().describe('Plesk server URL including port, e.g. "https://your-server.com:8443"'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
    },
    async (args) => run(() => listApiKeys(args.plesk_url, args.username, args.password))
  );

  server.tool(
    'plesk_delete_api_key',
    'Delete an API key from a Plesk server. Requires admin username/password. Irreversible — any client still using the key loses access immediately.',
    {
      plesk_url: z.string().describe('Plesk server URL including port, e.g. "https://your-server.com:8443"'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
      key_id: z.string().describe('API key ID from plesk_list_api_keys'),
    },
    async (args) =>
      run(async () => {
        await deleteApiKey(args.plesk_url, args.username, args.password, args.key_id);
        return { success: true, message: `API key ${args.key_id} deleted successfully` };
      })
  );
}

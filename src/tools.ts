import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PleskClient } from './plesk-client.js';
import { WordPressClient } from './wordpress-client.js';
import { PleskInstance } from './types.js';
import { getInstance } from './config.js';
import { generateApiKey, saveApiKeyToEnv, listApiKeys, deleteApiKey } from './auth.js';

/**
 * Register all Plesk MCP tools
 */
export function registerTools(server: McpServer, instances: Map<string, PleskInstance>) {
  /**
   * Helper function to get Plesk client for an instance
   */
  const getClient = (instanceName?: string): PleskClient => {
    const instance = getInstance(instances, instanceName);
    return new PleskClient(instance);
  };

  /**
   * Helper function to get WordPress client for an instance
   */
  const getWPClient = (instanceName?: string): WordPressClient => {
    const instance = getInstance(instances, instanceName);
    return new WordPressClient(instance);
  };

  /**
   * List available Plesk instances
   */
  server.tool(
    'plesk_list_instances',
    'List all configured Plesk instances',
    {},
    async () => {
      const instanceList = Array.from(instances.values()).map(inst => ({
        name: inst.name,
        url: inst.url,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(instanceList, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get server information
   */
  server.tool(
    'plesk_get_server_info',
    'Get Plesk server information',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get('/server');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List server IP addresses
   */
  server.tool(
    'plesk_list_ips',
    'List all IP addresses on the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get('/server/ips');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List all domains
   */
  server.tool(
    'plesk_list_domains',
    'List all domains on the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get('/domains');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get domain details
   */
  server.tool(
    'plesk_get_domain',
    'Get details of a specific domain',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      domain_id: z.number().int().positive().describe('Domain ID'),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get(`/domains/${args.domain_id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Create a new domain
   */
  server.tool(
    'plesk_create_domain',
    'Create a new domain on the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      name: z.string().describe('Domain name'),
      ip_address_id: z.number().int().positive().describe('IP address ID').optional(),
      hosting_type: z.string().describe('Hosting type (virtual, standard, etc.)').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const payload: any = {
        name: args.name,
      };

      if (args.ip_address_id) {
        payload.ipAddressId = args.ip_address_id;
      }
      if (args.hosting_type) {
        payload.hosting_type = args.hosting_type;
      }

      const data = await client.post('/domains', payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Update domain
   */
  server.tool(
    'plesk_update_domain',
    'Update a domain',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      domain_id: z.number().int().positive().describe('Domain ID'),
      name: z.string().describe('New domain name').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const payload: any = {};

      if (args.name) {
        payload.name = args.name;
      }

      const data = await client.put(`/domains/${args.domain_id}`, payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Delete domain
   */
  server.tool(
    'plesk_delete_domain',
    'Delete a domain from the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      domain_id: z.number().int().positive().describe('Domain ID'),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.delete(`/domains/${args.domain_id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List all clients
   */
  server.tool(
    'plesk_list_clients',
    'List all clients on the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get('/clients');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get client details
   */
  server.tool(
    'plesk_get_client',
    'Get details of a specific client',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      client_id: z.number().int().positive().describe('Client ID'),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get(`/clients/${args.client_id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Create a new client
   */
  server.tool(
    'plesk_create_client',
    'Create a new client account',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      type: z.string().describe('Client type (customer, reseller)'),
      name: z.string().describe('Client name'),
      email: z.string().describe('Email address'),
      login: z.string().describe('Login username'),
      password: z.string().describe('Password'),
      company: z.string().describe('Company name').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const payload: any = {
        type: args.type,
        name: args.name,
        email: args.email,
        login: args.login,
        password: args.password,
      };

      if (args.company) {
        payload.company = args.company;
      }

      const data = await client.post('/clients', payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Update client
   */
  server.tool(
    'plesk_update_client',
    'Update a client account',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      client_id: z.number().int().positive().describe('Client ID'),
      name: z.string().describe('New name').optional(),
      email: z.string().describe('New email').optional(),
      company: z.string().describe('New company name').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const payload: any = {};

      if (args.name) payload.name = args.name;
      if (args.email) payload.email = args.email;
      if (args.company) payload.company = args.company;

      const data = await client.put(`/clients/${args.client_id}`, payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Suspend client
   */
  server.tool(
    'plesk_suspend_client',
    'Suspend a client account',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      client_id: z.number().int().positive().describe('Client ID'),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.put(`/clients/${args.client_id}/suspend`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Activate client
   */
  server.tool(
    'plesk_activate_client',
    'Activate a client account',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      client_id: z.number().int().positive().describe('Client ID'),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.put(`/clients/${args.client_id}/activate`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List extensions
   */
  server.tool(
    'plesk_list_extensions',
    'List all installed extensions',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const data = await client.get('/extensions');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Execute CLI command
   */
  server.tool(
    'plesk_execute_cli',
    'Execute a Plesk CLI command',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      command: z.string().regex(/^[a-zA-Z0-9_-]+$/).describe('CLI command ID'),
      params: z.array(z.string()).describe('Command parameters').optional(),
    },
    async (args: any) => {
      const client = getClient(args.instance);
      const payload: any = {
        params: args.params || [],
      };

      const data = await client.post(`/cli/${args.command}/call`, payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Generate API Key
   */
  server.tool(
    'plesk_generate_api_key',
    'Generate a new API key for a Plesk instance using username/password and save it to .env',
    {
      plesk_url: z.url().refine(value => new URL(value).protocol === "https:", "HTTPS is required").describe('Plesk server URL (e.g., https://your-server.com:8443)'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
      instance_name: z.string().regex(/^(default|instance_[0-9]+)$/).describe('Instance name to save in .env (default, instance_2, etc.)').optional(),
      description: z.string().describe('Description for the API key').optional(),
    },
    async (args: any) => {
      try {
        const instanceName = args.instance_name || 'default';
        const description = args.description || 'MCP Server API Key';

        // Generate API key
        const apiKey = await generateApiKey(
          args.plesk_url,
          args.username,
          args.password,
          description
        );

        // Save to .env
        saveApiKeyToEnv(instanceName, args.plesk_url, apiKey);
        instances.set(instanceName, { name: instanceName, url: args.plesk_url.replace(/\/+$/, ""), apiKey });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `API key generated and saved to .env for instance "${instanceName}"`,
                instance: instanceName,
                url: args.plesk_url,
                note: 'The instance is available immediately',
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * List API Keys
   */
  server.tool(
    'plesk_list_api_keys',
    'List all API keys for a Plesk instance',
    {
      plesk_url: z.url().refine(value => new URL(value).protocol === "https:", "HTTPS is required").describe('Plesk server URL'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
    },
    async (args: any) => {
      try {
        const keys = await listApiKeys(
          args.plesk_url,
          args.username,
          args.password
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(keys, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  /**
   * Delete API Key
   */
  server.tool(
    'plesk_delete_api_key',
    'Delete an API key from a Plesk instance',
    {
      plesk_url: z.url().refine(value => new URL(value).protocol === "https:", "HTTPS is required").describe('Plesk server URL'),
      username: z.string().describe('Plesk admin username'),
      password: z.string().describe('Plesk admin password'),
      key_id: z.string().describe('API key ID to delete'),
    },
    async (args: any) => {
      try {
        await deleteApiKey(
          args.plesk_url,
          args.username,
          args.password,
          args.key_id
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `API key ${args.key_id} deleted successfully`,
              }, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    }
  );

  // ============================================================================
  // WordPress Toolkit Tools
  // ============================================================================

  /**
   * List WordPress installations
   */
  server.tool(
    'plesk_wp_list_installations',
    'List all WordPress installations on the Plesk server',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      filter: z.string().describe('Filter installations by title, URL, or other criteria').optional(),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const params = args.filter ? { filter: args.filter } : {};
      const data = await client.get('/installations', { params });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get WordPress installation details
   */
  server.tool(
    'plesk_wp_get_installation',
    'Get details of a specific WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.get(`/installations/${args.installation_id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Clone WordPress installation
   */
  server.tool(
    'plesk_wp_clone_installation',
    'Clone a WordPress installation to a new location',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID to clone'),
      target_domain: z.string().describe('Target domain for the clone').optional(),
      target_path: z.string().describe('Target path for the clone').optional(),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const payload: any = {
        installationId: args.installation_id,
      };

      if (args.target_domain) payload.targetDomain = args.target_domain;
      if (args.target_path) payload.targetPath = args.target_path;

      const data = await client.post('/cloner', payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Create WordPress backup
   */
  server.tool(
    'plesk_wp_create_backup',
    'Create a backup of a WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
      description: z.string().describe('Backup description').optional(),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const payload: any = {
        installationId: args.installation_id,
        description: args.description || 'Manual backup',
      };

      const data = await client.post('/features/backups/creator', payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Restore WordPress backup
   */
  server.tool(
    'plesk_wp_restore_backup',
    'Restore a WordPress installation from backup',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
      backup_id: z.string().describe('Backup ID to restore'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const payload: any = {
        installationId: args.installation_id,
        backupId: args.backup_id,
      };

      const data = await client.post('/features/backups/restorer', payload);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List WordPress backups
   */
  server.tool(
    'plesk_wp_list_backups',
    'List all backups for a WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.get(`/installations/${args.installation_id}/backups/meta`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Toggle WordPress maintenance mode
   */
  server.tool(
    'plesk_wp_toggle_maintenance',
    'Enable or disable maintenance mode for a WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
      enabled: z.boolean().describe('Enable (true) or disable (false) maintenance mode'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.put(
        `/installations/${args.installation_id}/features/maintenance/status`,
        { enabled: args.enabled }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Clear WordPress cache
   */
  server.tool(
    'plesk_wp_clear_cache',
    'Clear cache for one or more WordPress installations',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_ids: z.array(z.number().int().positive()).min(1).describe('Array of WordPress installation IDs'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.post('/cache-cleaner', {
        installationIds: args.installation_ids,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get background task status
   */
  server.tool(
    'plesk_wp_get_background_task',
    'Get information about a background task execution',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      task_code: z.string().describe('Task code (e.g., "backup", "clone")'),
      task_id: z.string().describe('Task ID'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.get(`/background-tasks/${args.task_code}/${args.task_id}`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * List background tasks for installation
   */
  server.tool(
    'plesk_wp_list_background_tasks',
    'List all background tasks for a WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.get(`/installations/${args.installation_id}/background-tasks`);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Update vulnerability filtering
   */
  server.tool(
    'plesk_wp_update_vulnerability_filtering',
    'Enable or disable vulnerability filtering for a WordPress installation',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
      installation_id: z.number().int().positive().describe('WordPress installation ID'),
      filtering_enabled: z.boolean().describe('Enable (true) or disable (false) vulnerability filtering'),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.patch(
        `/installations/${args.installation_id}/features/vulnerability/filtering`,
        { enabled: args.filtering_enabled }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );

  /**
   * Get WordPress changelog
   */
  server.tool(
    'plesk_wp_get_changelog',
    'Get WordPress Toolkit product changelog in markdown format',
    {
      instance: z.string().describe('Plesk instance name (default: "default")').optional(),
    },
    async (args: any) => {
      const client = getWPClient(args.instance);
      const data = await client.get('/changelogs');

      return {
        content: [
          {
            type: 'text',
            text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
          },
        ],
      };
    }
  );
}

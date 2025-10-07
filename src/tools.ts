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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      domain_id: {
        type: 'number',
        description: 'Domain ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      name: {
        type: 'string',
        description: 'Domain name',
        required: true,
      },
      ip_address_id: {
        type: 'number',
        description: 'IP address ID',
        required: false,
      },
      hosting_type: {
        type: 'string',
        description: 'Hosting type (virtual, standard, etc.)',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      domain_id: {
        type: 'number',
        description: 'Domain ID',
        required: true,
      },
      name: {
        type: 'string',
        description: 'New domain name',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      domain_id: {
        type: 'number',
        description: 'Domain ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      client_id: {
        type: 'number',
        description: 'Client ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      type: {
        type: 'string',
        description: 'Client type (customer, reseller)',
        required: true,
      },
      name: {
        type: 'string',
        description: 'Client name',
        required: true,
      },
      email: {
        type: 'string',
        description: 'Email address',
        required: true,
      },
      login: {
        type: 'string',
        description: 'Login username',
        required: true,
      },
      password: {
        type: 'string',
        description: 'Password',
        required: true,
      },
      company: {
        type: 'string',
        description: 'Company name',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      client_id: {
        type: 'number',
        description: 'Client ID',
        required: true,
      },
      name: {
        type: 'string',
        description: 'New name',
        required: false,
      },
      email: {
        type: 'string',
        description: 'New email',
        required: false,
      },
      company: {
        type: 'string',
        description: 'New company name',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      client_id: {
        type: 'number',
        description: 'Client ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      client_id: {
        type: 'number',
        description: 'Client ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      command: {
        type: 'string',
        description: 'CLI command ID',
        required: true,
      },
      params: {
        type: 'array',
        description: 'Command parameters',
        required: false,
      },
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
      plesk_url: {
        type: 'string',
        description: 'Plesk server URL (e.g., https://your-server.com:8443)',
        required: true,
      },
      username: {
        type: 'string',
        description: 'Plesk admin username',
        required: true,
      },
      password: {
        type: 'string',
        description: 'Plesk admin password',
        required: true,
      },
      instance_name: {
        type: 'string',
        description: 'Instance name to save in .env (default, instance_2, etc.)',
        required: false,
      },
      description: {
        type: 'string',
        description: 'Description for the API key',
        required: false,
      },
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `API key generated and saved to .env for instance "${instanceName}"`,
                instance: instanceName,
                url: args.plesk_url,
                note: 'Please restart the MCP server to load the new configuration',
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
      plesk_url: {
        type: 'string',
        description: 'Plesk server URL',
        required: true,
      },
      username: {
        type: 'string',
        description: 'Plesk admin username',
        required: true,
      },
      password: {
        type: 'string',
        description: 'Plesk admin password',
        required: true,
      },
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
      plesk_url: {
        type: 'string',
        description: 'Plesk server URL',
        required: true,
      },
      username: {
        type: 'string',
        description: 'Plesk admin username',
        required: true,
      },
      password: {
        type: 'string',
        description: 'Plesk admin password',
        required: true,
      },
      key_id: {
        type: 'string',
        description: 'API key ID to delete',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      filter: {
        type: 'string',
        description: 'Filter installations by title, URL, or other criteria',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID to clone',
        required: true,
      },
      target_domain: {
        type: 'string',
        description: 'Target domain for the clone',
        required: false,
      },
      target_path: {
        type: 'string',
        description: 'Target path for the clone',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
      description: {
        type: 'string',
        description: 'Backup description',
        required: false,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
      backup_id: {
        type: 'string',
        description: 'Backup ID to restore',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
      enabled: {
        type: 'boolean',
        description: 'Enable (true) or disable (false) maintenance mode',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_ids: {
        type: 'array',
        description: 'Array of WordPress installation IDs',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      task_code: {
        type: 'string',
        description: 'Task code (e.g., "backup", "clone")',
        required: true,
      },
      task_id: {
        type: 'string',
        description: 'Task ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
      installation_id: {
        type: 'number',
        description: 'WordPress installation ID',
        required: true,
      },
      filtering_enabled: {
        type: 'boolean',
        description: 'Enable (true) or disable (false) vulnerability filtering',
        required: true,
      },
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
      instance: {
        type: 'string',
        description: 'Plesk instance name (default: "default")',
        required: false,
      },
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

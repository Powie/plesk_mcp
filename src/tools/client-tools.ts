import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, run, READ_ONLY, WRITE, DESTRUCTIVE } from './helpers.js';

const clientId = z.number().describe('Numeric client ID from plesk_list_clients');

/**
 * Client (customer/reseller) account management tools
 */
export function registerClientTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'plesk_list_clients',
    {
      description: 'List all client accounts (customers and resellers) on the Plesk server with their IDs, names and status. Call this first to look up a client ID for the other plesk_*_client tools.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get('/clients'))
  );

  server.registerTool(
    'plesk_get_client',
    {
      description: 'Get full details of a single client account by its numeric ID. Use plesk_list_clients to find the ID.',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/clients/${args.client_id}`))
  );

  server.registerTool(
    'plesk_list_client_domains',
    {
      description: 'List all domains owned by a client account.',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/clients/${args.client_id}/domains`))
  );

  server.registerTool(
    'plesk_get_client_statistics',
    {
      description: 'Get resource usage statistics of a client account (disk space, traffic, number of domains, etc.).',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/clients/${args.client_id}/statistics`))
  );

  server.registerTool(
    'plesk_create_client',
    {
      description: 'Create a new client account (customer or reseller) with login credentials.',
      inputSchema: {
        instance: instanceParam,
        type: z.enum(['customer', 'reseller']).describe('Account type'),
        name: z.string().describe('Full contact name (1-60 characters)'),
        email: z.string().describe('Contact email address'),
        login: z.string().describe('Login username for the Plesk panel (must be unique)'),
        password: z.string().describe('Password for the Plesk panel login'),
        company: z.string().optional().describe('Company name'),
        locale: z.string().optional().describe('Panel language, e.g. "de-DE" (default: "en-US")'),
        owner_login: z.string().optional().describe('Login of the owning reseller (default: admin)'),
      },
      annotations: WRITE,
    },
    async (args) => {
      const payload: any = {
        type: args.type,
        name: args.name,
        email: args.email,
        login: args.login,
        password: args.password,
      };
      if (args.company) payload.company = args.company;
      if (args.locale) payload.locale = args.locale;
      if (args.owner_login) payload.owner_login = args.owner_login;
      return run(() => ctx.getClient(args.instance).post('/clients', payload));
    }
  );

  server.registerTool(
    'plesk_update_client',
    {
      description: 'Update contact details of an existing client account. Only the provided fields are changed.',
      inputSchema: {
        instance: instanceParam,
        client_id: clientId,
        name: z.string().optional().describe('New contact name'),
        email: z.string().optional().describe('New contact email address'),
        company: z.string().optional().describe('New company name'),
        locale: z.string().optional().describe('New panel language, e.g. "de-DE"'),
      },
      annotations: WRITE,
    },
    async (args) => {
      const payload: any = {};
      if (args.name) payload.name = args.name;
      if (args.email) payload.email = args.email;
      if (args.company) payload.company = args.company;
      if (args.locale) payload.locale = args.locale;
      return run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}`, payload));
    }
  );

  server.registerTool(
    'plesk_suspend_client',
    {
      description: 'Suspend a client account: the client loses access to the Plesk panel and their sites are deactivated. Reversible via plesk_activate_client. Confirm with the user before calling.',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) => run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}/suspend`))
  );

  server.registerTool(
    'plesk_activate_client',
    {
      description: 'Reactivate a previously suspended client account, restoring panel access and site availability.',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) => run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}/activate`))
  );

  server.registerTool(
    'plesk_delete_client',
    {
      description: 'Permanently delete a client account together with all of its subscriptions, domains and data. Irreversible — confirm with the user before calling.',
      inputSchema: { instance: instanceParam, client_id: clientId },
      annotations: DESTRUCTIVE,
    },
    async (args) => run(() => ctx.getClient(args.instance).delete(`/clients/${args.client_id}`))
  );
}

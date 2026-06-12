import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, run } from './helpers.js';

/**
 * Client (customer/reseller) account management tools
 */
export function registerClientTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'plesk_list_clients',
    'List all client accounts (customers and resellers) on the Plesk server with their IDs, names and status. Call this first to look up a client ID for the other plesk_*_client tools.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getClient(args.instance).get('/clients'))
  );

  server.tool(
    'plesk_get_client',
    'Get full details of a single client account by its numeric ID. Use plesk_list_clients to find the ID.',
    {
      instance: instanceParam,
      client_id: z.number().describe('Numeric client ID from plesk_list_clients'),
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/clients/${args.client_id}`))
  );

  server.tool(
    'plesk_create_client',
    'Create a new client account (customer or reseller) with login credentials.',
    {
      instance: instanceParam,
      type: z.string().describe('Account type: "customer" or "reseller"'),
      name: z.string().describe('Full contact name'),
      email: z.string().describe('Contact email address'),
      login: z.string().describe('Login username for the Plesk panel'),
      password: z.string().describe('Password for the Plesk panel login'),
      company: z.string().optional().describe('Company name'),
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
      return run(() => ctx.getClient(args.instance).post('/clients', payload));
    }
  );

  server.tool(
    'plesk_update_client',
    'Update contact details of an existing client account. Only the provided fields are changed.',
    {
      instance: instanceParam,
      client_id: z.number().describe('Numeric client ID from plesk_list_clients'),
      name: z.string().optional().describe('New contact name'),
      email: z.string().optional().describe('New contact email address'),
      company: z.string().optional().describe('New company name'),
    },
    async (args) => {
      const payload: any = {};
      if (args.name) payload.name = args.name;
      if (args.email) payload.email = args.email;
      if (args.company) payload.company = args.company;
      return run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}`, payload));
    }
  );

  server.tool(
    'plesk_suspend_client',
    'Suspend a client account: the client loses access to the Plesk panel and their sites are deactivated. Reversible via plesk_activate_client.',
    {
      instance: instanceParam,
      client_id: z.number().describe('Numeric client ID from plesk_list_clients'),
    },
    async (args) => run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}/suspend`))
  );

  server.tool(
    'plesk_activate_client',
    'Reactivate a previously suspended client account, restoring panel access and site availability.',
    {
      instance: instanceParam,
      client_id: z.number().describe('Numeric client ID from plesk_list_clients'),
    },
    async (args) => run(() => ctx.getClient(args.instance).put(`/clients/${args.client_id}/activate`))
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, run } from './helpers.js';

/**
 * Domain management tools
 */
export function registerDomainTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'plesk_list_domains',
    'List all domains on the Plesk server with their IDs, names and hosting status. Call this first to look up a domain ID before using plesk_get_domain, plesk_update_domain or plesk_delete_domain.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getClient(args.instance).get('/domains'))
  );

  server.tool(
    'plesk_get_domain',
    'Get full details of a single domain (hosting settings, status, creation date) by its numeric ID. Use plesk_list_domains to find the ID.',
    {
      instance: instanceParam,
      domain_id: z.number().describe('Numeric domain ID from plesk_list_domains'),
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/domains/${args.domain_id}`))
  );

  server.tool(
    'plesk_create_domain',
    'Create a new domain on the Plesk server. Use plesk_list_ips first if a specific IP address should be assigned.',
    {
      instance: instanceParam,
      name: z.string().describe('Fully qualified domain name, e.g. "example.com"'),
      ip_address_id: z.number().optional().describe('IP address ID from plesk_list_ips'),
      hosting_type: z.string().optional().describe('Hosting type: "virtual" (web hosting), "standard_forwarding", "frame_forwarding" or "none"'),
    },
    async (args) => {
      const payload: any = { name: args.name };
      if (args.ip_address_id) payload.ipAddressId = args.ip_address_id;
      if (args.hosting_type) payload.hosting_type = args.hosting_type;
      return run(() => ctx.getClient(args.instance).post('/domains', payload));
    }
  );

  server.tool(
    'plesk_update_domain',
    'Update an existing domain, e.g. rename it. Only the provided fields are changed.',
    {
      instance: instanceParam,
      domain_id: z.number().describe('Numeric domain ID from plesk_list_domains'),
      name: z.string().optional().describe('New fully qualified domain name'),
    },
    async (args) => {
      const payload: any = {};
      if (args.name) payload.name = args.name;
      return run(() => ctx.getClient(args.instance).put(`/domains/${args.domain_id}`, payload));
    }
  );

  server.tool(
    'plesk_delete_domain',
    'Permanently delete a domain and its hosting configuration from the Plesk server. This is irreversible — confirm with the user before calling.',
    {
      instance: instanceParam,
      domain_id: z.number().describe('Numeric domain ID from plesk_list_domains'),
    },
    async (args) => run(() => ctx.getClient(args.instance).delete(`/domains/${args.domain_id}`))
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, run, READ_ONLY, WRITE, DESTRUCTIVE } from './helpers.js';

const domainId = z.number().describe('Numeric domain ID from plesk_list_domains');

/**
 * Domain management tools
 */
export function registerDomainTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'plesk_list_domains',
    {
      description: 'List all domains on the Plesk server with their IDs, names and hosting types. Call this first to look up a domain ID before using the other plesk_*_domain tools.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get('/domains'))
  );

  server.registerTool(
    'plesk_get_domain',
    {
      description: 'Get full details of a single domain (hosting type, owner, creation date) by its numeric ID. Use plesk_list_domains to find the ID.',
      inputSchema: { instance: instanceParam, domain_id: domainId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/domains/${args.domain_id}`))
  );

  server.registerTool(
    'plesk_create_domain',
    {
      description: 'Create a new domain. Without base_domain_id a new subscription is created; with base_domain_id the domain is added to that existing subscription. Web hosting ("virtual") requires an FTP login and password.',
      inputSchema: {
        instance: instanceParam,
        name: z.string().describe('Fully qualified domain name, e.g. "example.com"'),
        hosting_type: z.enum(['virtual', 'standard_forwarding', 'frame_forwarding', 'none']).optional()
          .describe('"virtual" (web hosting), "standard_forwarding", "frame_forwarding" or "none"'),
        ftp_login: z.string().optional().describe('FTP user login (required for hosting_type "virtual")'),
        ftp_password: z.string().optional().describe('FTP user password (required for hosting_type "virtual")'),
        forwarding_url: z.string().optional().describe('Destination URL for standard_forwarding / frame_forwarding'),
        ip_addresses: z.array(z.string()).optional().describe('IP addresses from plesk_list_ips, e.g. ["203.0.113.10"]'),
        owner_client_id: z.number().optional().describe('Client ID from plesk_list_clients that will own the new subscription'),
        plan_name: z.string().optional().describe('Service plan name for the new subscription'),
        base_domain_id: z.number().optional().describe('Domain ID of an existing subscription to add this domain to'),
        description: z.string().optional().describe('Description of the domain'),
      },
      annotations: WRITE,
    },
    async (args) => {
      const payload: any = { name: args.name };
      if (args.hosting_type) payload.hosting_type = args.hosting_type;
      if (args.ftp_login || args.ftp_password) {
        payload.hosting_settings = { ftp_login: args.ftp_login, ftp_password: args.ftp_password };
      }
      if (args.forwarding_url) payload.hosting_settings = { dest_url: args.forwarding_url };
      if (args.ip_addresses) payload.ip_addresses = args.ip_addresses;
      if (args.owner_client_id) payload.owner_client = { id: args.owner_client_id };
      if (args.plan_name) payload.plan = { name: args.plan_name };
      if (args.base_domain_id) payload.base_domain = { id: args.base_domain_id };
      if (args.description) payload.description = args.description;
      return run(() => ctx.getClient(args.instance).post('/domains', payload));
    }
  );

  server.registerTool(
    'plesk_update_domain',
    {
      description: 'Update an existing domain, e.g. rename it or change its description. Only the provided fields are changed.',
      inputSchema: {
        instance: instanceParam,
        domain_id: domainId,
        name: z.string().optional().describe('New fully qualified domain name'),
        description: z.string().optional().describe('New description'),
      },
      annotations: WRITE,
    },
    async (args) => {
      const payload: any = {};
      if (args.name) payload.name = args.name;
      if (args.description) payload.description = args.description;
      return run(() => ctx.getClient(args.instance).put(`/domains/${args.domain_id}`, payload));
    }
  );

  server.registerTool(
    'plesk_get_domain_status',
    {
      description: 'Get the status of a domain: "active", "suspended" or "disabled".',
      inputSchema: { instance: instanceParam, domain_id: domainId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get(`/domains/${args.domain_id}/status`))
  );

  server.registerTool(
    'plesk_set_domain_status',
    {
      description: 'Activate, suspend or disable a domain. Suspended or disabled domains are offline for visitors. Confirm with the user before suspending or disabling.',
      inputSchema: {
        instance: instanceParam,
        domain_id: domainId,
        status: z.enum(['active', 'suspended', 'disabled']).describe('New domain status'),
      },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) =>
      run(() => ctx.getClient(args.instance).put(`/domains/${args.domain_id}/status`, { status: args.status }))
  );

  server.registerTool(
    'plesk_delete_domain',
    {
      description: 'Permanently delete a domain and its hosting configuration from the Plesk server. This is irreversible — confirm with the user before calling.',
      inputSchema: { instance: instanceParam, domain_id: domainId },
      annotations: DESTRUCTIVE,
    },
    async (args) => run(() => ctx.getClient(args.instance).delete(`/domains/${args.domain_id}`))
  );
}

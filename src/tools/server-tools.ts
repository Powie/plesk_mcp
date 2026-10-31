import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, jsonResult, run, READ_ONLY, DESTRUCTIVE } from './helpers.js';

/**
 * General server tools: instances, server info, IPs, extensions, CLI
 */
export function registerServerTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'plesk_list_instances',
    {
      description: 'List the names and URLs of all configured Plesk instances. Call this first when more than one Plesk server is configured, to find the correct value for the "instance" parameter accepted by all other tools.',
      inputSchema: {},
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const instanceList = Array.from(ctx.instances.values()).map(inst => ({
        name: inst.name,
        url: inst.url,
      }));
      return jsonResult(instanceList);
    }
  );

  server.registerTool(
    'plesk_get_server_info',
    {
      description: 'Get general information about the Plesk server: product version, OS, platform and hostname.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get('/server'))
  );

  server.registerTool(
    'plesk_list_ips',
    {
      description: 'List all IP addresses configured on the Plesk server with their types (shared/dedicated). Use the addresses for the ip_addresses parameter of plesk_create_domain.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get('/server/ips'))
  );

  server.registerTool(
    'plesk_list_extensions',
    {
      description: 'List all extensions installed on the Plesk server with their IDs, names, versions and enabled state.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getClient(args.instance).get('/extensions'))
  );

  server.registerTool(
    'plesk_execute_cli',
    {
      description: 'Execute a Plesk CLI utility (e.g. "site", "subscription", "dns") with parameters. Use this only for operations not covered by a dedicated tool — prefer the specific plesk_* tools when one exists. Runs with admin privileges on the server.',
      inputSchema: {
        instance: instanceParam,
        command: z.string().describe('CLI utility name, e.g. "site", "subscription", "extension"'),
        params: z.array(z.string()).optional().describe('Command-line arguments passed to the utility, e.g. ["--list"]'),
      },
      annotations: DESTRUCTIVE,
    },
    async (args) =>
      run(() =>
        ctx.getClient(args.instance).post(`/cli/${encodeURIComponent(args.command)}/call`, {
          params: args.params || [],
        })
      )
  );
}

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, jsonResult, run } from './helpers.js';

/**
 * General server tools: instances, server info, IPs, extensions, CLI
 */
export function registerServerTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'plesk_list_instances',
    'List the names and URLs of all configured Plesk instances. Call this first when more than one Plesk server is configured, to find the correct value for the "instance" parameter accepted by all other tools.',
    {},
    async () => {
      const instanceList = Array.from(ctx.instances.values()).map(inst => ({
        name: inst.name,
        url: inst.url,
      }));
      return jsonResult(instanceList);
    }
  );

  server.tool(
    'plesk_get_server_info',
    'Get general information about the Plesk server: product version, OS, platform and hostname.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getClient(args.instance).get('/server'))
  );

  server.tool(
    'plesk_list_ips',
    'List all IP addresses configured on the Plesk server, including their IDs and types (shared/dedicated). Call this to look up an ip_address_id before creating a domain with plesk_create_domain.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getClient(args.instance).get('/server/ips'))
  );

  server.tool(
    'plesk_list_extensions',
    'List all extensions installed on the Plesk server with their IDs, names and versions.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getClient(args.instance).get('/extensions'))
  );

  server.tool(
    'plesk_execute_cli',
    'Execute a Plesk CLI utility (e.g. "site", "subscription", "bind") with parameters. Use this only for operations not covered by a dedicated tool — prefer the specific plesk_* tools when one exists. Runs with admin privileges on the server.',
    {
      instance: instanceParam,
      command: z.string().describe('CLI utility name, e.g. "site", "subscription", "extension"'),
      params: z.array(z.string()).optional().describe('Command-line arguments passed to the utility, e.g. ["--list"]'),
    },
    async (args) =>
      run(() =>
        ctx.getClient(args.instance).post(`/cli/${args.command}/call`, {
          params: args.params || [],
        })
      )
  );
}

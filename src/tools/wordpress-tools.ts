import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WordPressClient } from '../wordpress-client.js';
import { ToolContext, instanceParam, run, READ_ONLY, WRITE, DESTRUCTIVE } from './helpers.js';

const installationId = z.number().describe('WordPress installation ID from plesk_wp_list_installations');

/**
 * Unwrap WP Toolkit stub values, which are nested as { value: ... }
 */
function stubValue(node: any): any {
  return node && typeof node === 'object' && 'value' in node ? stubValue(node.value) : node;
}

/**
 * Determine the database name for a clone: the given one, or the default
 * suggested by the WP Toolkit clone stub
 */
async function cloneDatabaseName(client: WordPressClient, id: number, given?: string): Promise<string> {
  if (given) return given;
  const stub = await client.get(`/installations/${id}/features/clone/stub`);
  const name = stubValue(stubValue(stub)?.database)?.name;
  const value = stubValue(name);
  if (typeof value !== 'string' || !value) {
    throw new Error('Could not determine a default database name for the clone — please pass database_name');
  }
  return value;
}

/**
 * WordPress Toolkit tools
 */
export function registerWordPressTools(server: McpServer, ctx: ToolContext) {
  server.registerTool(
    'plesk_wp_list_installations',
    {
      description: 'List all WordPress installations managed by the WordPress Toolkit, with their IDs, titles and URLs. Call this first to look up an installation ID for the other plesk_wp_* tools.',
      inputSchema: {
        instance: instanceParam,
        filter: z.string().optional().describe('Only return installations whose data (title, URL, path, ...) contains this text, case-insensitive'),
      },
      annotations: READ_ONLY,
    },
    async (args) =>
      run(async () => {
        const installations = await ctx.getWPClient(args.instance).get('/installations');
        if (!args.filter || !Array.isArray(installations)) return installations;
        const needle = args.filter.toLowerCase();
        return installations.filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
      })
  );

  server.registerTool(
    'plesk_wp_get_installation',
    {
      description: 'Get full details of a single WordPress installation (version, URL, state) by its numeric ID. Use plesk_wp_list_installations to find the ID.',
      inputSchema: { instance: instanceParam, installation_id: installationId },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getWPClient(args.instance).get(`/installations/${args.installation_id}`))
  );

  server.registerTool(
    'plesk_wp_clone_installation',
    {
      description: 'Clone a WordPress installation to an existing domain or a new subdomain (e.g. to create a staging copy). Returns a background task ({task: {id, code}}) — track it with plesk_wp_get_background_task.',
      inputSchema: {
        instance: instanceParam,
        installation_id: z.number().describe('WordPress installation ID to clone'),
        target_domain: z.string().describe('Existing domain that receives the clone, or the parent domain when target_subdomain is set'),
        target_subdomain: z.string().optional().describe('Create a new subdomain with this name (e.g. "staging") under target_domain for the clone'),
        target_path: z.string().optional().describe('Installation path relative to the document root of the target domain'),
        database_name: z.string().optional().describe('Database name for the clone (default: suggested by the WordPress Toolkit)'),
        overwrite: z.boolean().optional().describe('Overwrite an existing installation at the target'),
      },
      annotations: WRITE,
    },
    async (args) =>
      run(async () => {
        const client = ctx.getWPClient(args.instance);
        const payload: any = {
          installationId: args.installation_id,
          domain: args.target_subdomain
            ? { newSubdomain: { parentDomain: args.target_domain, name: args.target_subdomain } }
            : { existing: args.target_domain },
          database: { name: await cloneDatabaseName(client, args.installation_id, args.database_name) },
        };
        if (args.target_path) payload.installationPath = args.target_path;
        if (args.overwrite !== undefined) payload.overwrite = args.overwrite;
        return client.post('/cloner', payload);
      })
  );

  server.registerTool(
    'plesk_wp_create_backup',
    {
      description: 'Create a backup of a WordPress installation (files and database). Returns a background task ({task: {id, code}}) — track it with plesk_wp_get_background_task.',
      inputSchema: {
        instance: instanceParam,
        installation_id: installationId,
        description: z.string().optional().describe('Human-readable backup description'),
      },
      annotations: WRITE,
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).post('/features/backups/creator', {
          installationId: args.installation_id,
          description: args.description || 'Manual backup',
        })
      )
  );

  server.registerTool(
    'plesk_wp_restore_backup',
    {
      description: 'Restore a WordPress installation from an existing backup, overwriting the current files and database. Use plesk_wp_list_backups to find the backup file name. Returns a background task. Confirm with the user before calling.',
      inputSchema: {
        instance: instanceParam,
        installation_id: installationId,
        file_name: z.string().describe('Backup file name (fileName) from plesk_wp_list_backups'),
        clobber: z.boolean().optional().describe('Remove files that are not contained in the backup'),
        drop_all_database_tables: z.boolean().optional().describe('Drop all database tables before restoring'),
      },
      annotations: DESTRUCTIVE,
    },
    async (args) => {
      const payload: any = { installationId: args.installation_id, fileName: args.file_name };
      if (args.clobber !== undefined) payload.clobber = args.clobber;
      if (args.drop_all_database_tables !== undefined) payload.dropAllDatabaseTables = args.drop_all_database_tables;
      return run(() => ctx.getWPClient(args.instance).post('/features/backups/restorer', payload));
    }
  );

  server.registerTool(
    'plesk_wp_list_backups',
    {
      description: 'List all existing backups of a WordPress installation with file names, sizes and creation dates.',
      inputSchema: { instance: instanceParam, installation_id: installationId },
      annotations: READ_ONLY,
    },
    async (args) =>
      run(() => ctx.getWPClient(args.instance).get(`/installations/${args.installation_id}/backups`))
  );

  server.registerTool(
    'plesk_wp_toggle_maintenance',
    {
      description: 'Enable or disable maintenance mode for a WordPress installation. While enabled, visitors see a maintenance page instead of the site.',
      inputSchema: {
        instance: instanceParam,
        installation_id: installationId,
        enabled: z.boolean().describe('true to enable maintenance mode, false to disable it'),
      },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).put(
          `/installations/${args.installation_id}/features/maintenance/status`,
          { status: args.enabled }
        )
      )
  );

  server.registerTool(
    'plesk_wp_clear_cache',
    {
      description: 'Clear the object/page cache of one or more WordPress installations at once.',
      inputSchema: {
        instance: instanceParam,
        installation_ids: z.array(z.number()).min(1).describe('WordPress installation IDs from plesk_wp_list_installations'),
      },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).post('/cache-cleaner', {
          installationsIds: args.installation_ids,
        })
      )
  );

  server.registerTool(
    'plesk_wp_get_background_task',
    {
      description: 'Get the status and progress of a background task (e.g. a running backup, restore or clone). Pass task.code and task.id from the response of the tool that started the task.',
      inputSchema: {
        instance: instanceParam,
        task_code: z.string().describe('Task code (task.code) returned when the task was started'),
        task_id: z.string().describe('Task ID (task.id) returned when the task was started'),
      },
      annotations: READ_ONLY,
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).get(
          `/background-tasks/${encodeURIComponent(args.task_code)}/${encodeURIComponent(args.task_id)}`
        )
      )
  );

  server.registerTool(
    'plesk_wp_update_vulnerability_filtering',
    {
      description: 'Enable or disable vulnerability filtering (virtual patching) for a WordPress installation.',
      inputSchema: {
        instance: instanceParam,
        installation_id: installationId,
        filtering_enabled: z.boolean().describe('true to enable vulnerability filtering, false to disable it'),
      },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).patch(
          `/installations/${args.installation_id}/features/vulnerability/filtering`,
          { status: args.filtering_enabled }
        )
      )
  );

  server.registerTool(
    'plesk_wp_get_changelog',
    {
      description: 'Get the WordPress Toolkit product changelog in markdown format. Useful to check which features the installed Toolkit version supports.',
      inputSchema: { instance: instanceParam },
      annotations: READ_ONLY,
    },
    async (args) => run(() => ctx.getWPClient(args.instance).get('/changelogs'))
  );
}

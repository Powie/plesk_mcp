import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ToolContext, instanceParam, run } from './helpers.js';

/**
 * WordPress Toolkit tools
 */
export function registerWordPressTools(server: McpServer, ctx: ToolContext) {
  server.tool(
    'plesk_wp_list_installations',
    'List all WordPress installations managed by the WordPress Toolkit, with their IDs, titles and URLs. Call this first to look up an installation ID for the other plesk_wp_* tools.',
    {
      instance: instanceParam,
      filter: z.string().optional().describe('Filter installations by title, URL or other criteria'),
    },
    async (args) => {
      const params = args.filter ? { filter: args.filter } : {};
      return run(() => ctx.getWPClient(args.instance).get('/installations', { params }));
    }
  );

  server.tool(
    'plesk_wp_get_installation',
    'Get full details of a single WordPress installation (version, URL, state) by its numeric ID. Use plesk_wp_list_installations to find the ID.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
    },
    async (args) => run(() => ctx.getWPClient(args.instance).get(`/installations/${args.installation_id}`))
  );

  server.tool(
    'plesk_wp_clone_installation',
    'Clone a WordPress installation to another domain or path (e.g. to create a staging copy). Returns a background task — track it with plesk_wp_get_background_task.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID to clone'),
      target_domain: z.string().optional().describe('Target domain for the clone'),
      target_path: z.string().optional().describe('Target path for the clone'),
    },
    async (args) => {
      const payload: any = { installationId: args.installation_id };
      if (args.target_domain) payload.targetDomain = args.target_domain;
      if (args.target_path) payload.targetPath = args.target_path;
      return run(() => ctx.getWPClient(args.instance).post('/cloner', payload));
    }
  );

  server.tool(
    'plesk_wp_create_backup',
    'Create a backup of a WordPress installation (files and database). Returns a background task — track it with plesk_wp_get_background_task.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
      description: z.string().optional().describe('Human-readable backup description'),
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).post('/features/backups/creator', {
          installationId: args.installation_id,
          description: args.description || 'Manual backup',
        })
      )
  );

  server.tool(
    'plesk_wp_restore_backup',
    'Restore a WordPress installation from an existing backup, overwriting the current files and database. Use plesk_wp_list_backups to find the backup ID. Confirm with the user before calling.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
      backup_id: z.string().describe('Backup ID from plesk_wp_list_backups'),
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).post('/features/backups/restorer', {
          installationId: args.installation_id,
          backupId: args.backup_id,
        })
      )
  );

  server.tool(
    'plesk_wp_list_backups',
    'List all existing backups of a WordPress installation with their IDs, dates and descriptions.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
    },
    async (args) =>
      run(() => ctx.getWPClient(args.instance).get(`/installations/${args.installation_id}/backups/meta`))
  );

  server.tool(
    'plesk_wp_toggle_maintenance',
    'Enable or disable maintenance mode for a WordPress installation. While enabled, visitors see a maintenance page instead of the site.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
      enabled: z.boolean().describe('true to enable maintenance mode, false to disable it'),
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).put(
          `/installations/${args.installation_id}/features/maintenance/status`,
          { enabled: args.enabled }
        )
      )
  );

  server.tool(
    'plesk_wp_clear_cache',
    'Clear the object/page cache of one or more WordPress installations at once.',
    {
      instance: instanceParam,
      installation_ids: z.array(z.number()).describe('WordPress installation IDs from plesk_wp_list_installations'),
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).post('/cache-cleaner', {
          installationIds: args.installation_ids,
        })
      )
  );

  server.tool(
    'plesk_wp_get_background_task',
    'Get the status and progress of a background task (e.g. a running backup or clone). Task code and ID are returned by the tool that started the task.',
    {
      instance: instanceParam,
      task_code: z.string().describe('Task code returned when the task was started, e.g. "backup", "clone"'),
      task_id: z.string().describe('Task ID returned when the task was started'),
    },
    async (args) =>
      run(() => ctx.getWPClient(args.instance).get(`/background-tasks/${args.task_code}/${args.task_id}`))
  );

  server.tool(
    'plesk_wp_list_background_tasks',
    'List all background tasks (backups, clones, updates) of a WordPress installation with their statuses.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
    },
    async (args) =>
      run(() => ctx.getWPClient(args.instance).get(`/installations/${args.installation_id}/background-tasks`))
  );

  server.tool(
    'plesk_wp_update_vulnerability_filtering',
    'Enable or disable vulnerability filtering (virtual patching) for a WordPress installation.',
    {
      instance: instanceParam,
      installation_id: z.number().describe('WordPress installation ID from plesk_wp_list_installations'),
      filtering_enabled: z.boolean().describe('true to enable vulnerability filtering, false to disable it'),
    },
    async (args) =>
      run(() =>
        ctx.getWPClient(args.instance).patch(
          `/installations/${args.installation_id}/features/vulnerability/filtering`,
          { enabled: args.filtering_enabled }
        )
      )
  );

  server.tool(
    'plesk_wp_get_changelog',
    'Get the WordPress Toolkit product changelog in markdown format. Useful to check which features the installed Toolkit version supports.',
    { instance: instanceParam },
    async (args) => run(() => ctx.getWPClient(args.instance).get('/changelogs'))
  );
}

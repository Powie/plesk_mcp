import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

/**
 * Shared rules embedded in every workflow prompt (kept in sync with skills/plesk/SKILL.md)
 */
const SAFETY_RULES = `Rules:
- Pass the "instance" parameter on every plesk_* call (use plesk_list_instances if unsure which instance is meant).
- Never guess IDs: resolve them with the matching plesk_list_* / plesk_wp_list_* tool first.
- Background tasks (backup, restore, clone): poll plesk_wp_get_background_task until finished before continuing.
- Ask for explicit confirmation before deleting, restoring, suspending or running state-changing plesk_execute_cli commands.
- Summarize results as compact tables instead of dumping raw JSON. Never echo passwords.`;

function instanceHint(instance?: string): string {
  return instance ? `Use instance "${instance}".` : 'Use the default instance unless the user names another one.';
}

function userPrompt(text: string) {
  return {
    messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `${text}\n\n${SAFETY_RULES}` } }],
  };
}

const instanceArg = z.string().optional().describe('Plesk instance name as returned by plesk_list_instances');

/**
 * Register workflow prompts that guide the model through common multi-step Plesk tasks
 */
export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    'plesk_server_overview',
    {
      title: 'Plesk server overview',
      description: 'Summarize the state of a Plesk server: version, IPs, extensions, domains, clients and WordPress sites.',
      argsSchema: { instance: instanceArg },
    },
    (args) =>
      userPrompt(`Give me an overview of the Plesk server. ${instanceHint(args.instance)}

Steps:
1. plesk_get_server_info - Plesk version, OS, hostname.
2. plesk_list_ips - IP addresses and types.
3. plesk_list_extensions - installed extensions (note whether WordPress Toolkit is present).
4. plesk_list_domains and plesk_list_clients - counts, suspended clients.
5. plesk_wp_list_installations (only if WordPress Toolkit is installed) - WordPress sites per domain.

Finish with a short summary and anything that looks like it needs attention.`)
  );

  server.registerPrompt(
    'plesk_wp_safe_maintenance',
    {
      title: 'Safe WordPress maintenance',
      description: 'Back up a WordPress site, put it into maintenance mode, do the work, clear the cache and bring it back online.',
      argsSchema: {
        instance: instanceArg,
        site: z.string().describe('Domain or URL of the WordPress site'),
        task: z.string().optional().describe('What should be done while the site is in maintenance mode'),
      },
    },
    (args) =>
      userPrompt(`Run a safe maintenance workflow for the WordPress site "${args.site}". ${instanceHint(args.instance)}
${args.task ? `Maintenance work to do: ${args.task}\n` : ''}
Steps:
1. plesk_wp_list_installations with filter "${args.site}" to find the installation_id (ask if several match).
2. plesk_wp_create_backup with a descriptive description; wait for the background task to succeed. Stop if it fails.
3. plesk_wp_toggle_maintenance enabled=true.
4. Do the maintenance work (or wait for the user to tell you it is done).
5. plesk_wp_clear_cache for the installation.
6. plesk_wp_toggle_maintenance enabled=false - always do this, also if a step in between failed.
7. Report what was done and the ID of the backup taken in step 2.`)
  );

  server.registerPrompt(
    'plesk_wp_staging_clone',
    {
      title: 'WordPress staging clone',
      description: 'Clone a WordPress site to a staging domain or path.',
      argsSchema: {
        instance: instanceArg,
        site: z.string().describe('Domain or URL of the source WordPress site'),
        target_domain: z.string().describe('Existing domain that receives the clone, or the parent domain for target_subdomain'),
        target_subdomain: z.string().optional().describe('Name of a new subdomain to create for the clone, e.g. "staging"'),
      },
    },
    (args) =>
      userPrompt(`Create a staging copy of the WordPress site "${args.site}" on "${args.target_subdomain ? `${args.target_subdomain}.` : ''}${args.target_domain}". ${instanceHint(args.instance)}

Steps:
1. plesk_wp_list_installations with filter "${args.site}" to find the source installation_id.
2. plesk_list_domains to check that "${args.target_domain}" exists. If not, ask before creating it with plesk_create_domain.
3. Offer a backup of the source (plesk_wp_create_backup) before cloning.
4. plesk_wp_clone_installation with target_domain "${args.target_domain}"${args.target_subdomain ? ` and target_subdomain "${args.target_subdomain}"` : ''}; wait for the background task (task.code / task.id).
5. plesk_wp_list_installations to confirm the new installation and report its ID and URL.`)
  );

  server.registerPrompt(
    'plesk_onboard_customer',
    {
      title: 'Onboard a new customer',
      description: 'Create a customer account and its first domain.',
      argsSchema: {
        instance: instanceArg,
        name: z.string().describe('Full contact name of the customer'),
        email: z.string().describe('Contact email address'),
        domain: z.string().describe('First domain for the customer, e.g. "example.com"'),
      },
    },
    (args) =>
      userPrompt(`Onboard the new customer "${args.name}" <${args.email}> with the domain "${args.domain}". ${instanceHint(args.instance)}

Steps:
1. plesk_list_clients and plesk_list_domains - make sure neither the customer nor the domain already exists.
2. Ask the user for login, password and company (or propose a login and ask for confirmation).
3. plesk_create_client with type "customer".
4. plesk_list_ips - pick the shared IP unless the user wants a dedicated one.
5. Ask for FTP login and password, then plesk_create_domain with owner_client_id, hosting_type "virtual", ftp_login, ftp_password and ip_addresses.
6. Summarize client ID, login, domain ID and IP. Do not repeat the password.`)
  );

  server.registerPrompt(
    'plesk_rotate_api_key',
    {
      title: 'Rotate Plesk API key',
      description: 'Generate a new API key without IP binding, verify it and remove the old key.',
      argsSchema: {
        plesk_url: z.string().describe('Plesk server URL including port, e.g. "https://your-server.com:8443"'),
        instance_name: z.string().optional().describe('Instance name in .env: "default", "instance_2", etc.'),
      },
    },
    (args) =>
      userPrompt(`Rotate the API key for the Plesk server ${args.plesk_url} (instance "${args.instance_name ?? 'default'}").

Steps:
1. Ask the user for the Plesk admin username and password.
2. Ask the user to note the current key value (PLESK_API_KEY in .env or the MCP client config) - Plesk only stores hashes, so it cannot be looked up later.
3. plesk_generate_api_key with instance_name "${args.instance_name ?? 'default'}" - this writes the new key to .env.
4. Tell the user to restart the MCP server, then verify access with plesk_get_server_info.
5. Only after successful verification and explicit confirmation: plesk_delete_api_key with the old key's value, or remove it in the "Keychain for API Secret Keys" extension (secret-keys-manager).`)
  );
}

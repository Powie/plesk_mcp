---
name: plesk
description: Use the plesk MCP server (plesk_* tools) efficiently and safely. Use whenever the user wants to inspect or manage a Plesk hosting server - domains, customers/resellers, IP addresses, extensions, Plesk CLI, WordPress Toolkit sites (backups, restores, staging clones, maintenance mode, cache, vulnerability filtering) or Plesk API keys - including setups with several Plesk instances.
---

# Plesk MCP

Guidance for working with the `plesk_*` tools of the Plesk MCP server.

## 1. Pick the instance first

- If more than one Plesk server might be configured, call `plesk_list_instances` once at the start.
- Match the server the user means (by name or URL) and pass that name as `instance` on **every** following call. Omitting it uses `"default"`.
- If the user's wording is ambiguous across instances, ask which server they mean before changing anything.

## 2. Never guess IDs - look them up

Most tools take IDs or exact names. Resolve them first and reuse them for the rest of the conversation:

| Need | Lookup tool |
|------|-------------|
| `domain_id` | `plesk_list_domains` |
| `client_id` | `plesk_list_clients` |
| `ip_addresses` (for `plesk_create_domain`) | `plesk_list_ips` |
| `base_domain_id` (add a domain to an existing subscription) | `plesk_list_domains` / `plesk_list_client_domains` |
| WordPress `installation_id` | `plesk_wp_list_installations` (use `filter` with the domain to keep the result small) |
| Backup `file_name` | `plesk_wp_list_backups` |
| `api_key` to delete | `plesk_list_api_keys` |

If a lookup returns several matches, show them and let the user choose.

## 3. Background tasks (WordPress Toolkit)

`plesk_wp_create_backup`, `plesk_wp_restore_backup` and `plesk_wp_clone_installation` start a background task and return immediately.

1. Take `task.code` and `task.id` from the response.
2. Poll `plesk_wp_get_background_task` until the task is finished or failed. Space out the polls; don't hammer the API.
3. Only continue with dependent steps (e.g. maintenance mode after a backup) once the task has succeeded. Report failures with the task's error message.

## 4. Safety rules

Ask for explicit confirmation - naming the instance and the exact object - before:

- `plesk_delete_domain`, `plesk_delete_client` (irreversible)
- `plesk_set_domain_status` with `suspended` / `disabled` (site goes offline)
- `plesk_wp_restore_backup` (overwrites files and database; offer a fresh backup first)
- `plesk_suspend_client` (takes the customer's sites offline)
- `plesk_delete_api_key` (clients using the key lose access immediately)
- `plesk_execute_cli` with any parameter that changes state (`--create`, `--update`, `--remove`, `--delete`, `-on`, `-off`, ...)

Read-only calls (`list`, `get`, `--info`, `--list`) need no confirmation.

Never echo passwords back in your answers. API key tools need admin username/password - ask for them only when needed and don't store them anywhere else.

## 5. Prefer dedicated tools over the CLI

Use `plesk_execute_cli` only when no `plesk_*` tool covers the task. Run a read-only variant first. Useful utilities:

| Goal | `command` | `params` example |
|------|-----------|------------------|
| Subscription details / limits | `subscription` | `["--info", "example.com"]` |
| Site (sub)domain details | `site` | `["--info", "shop.example.com"]` |
| DNS zone records | `dns` | `["--info", "example.com"]` |
| Service plans | `service_plan` | `["--list"]` |
| SSL certificates | `certificate` | `["--list", "-domain", "example.com"]` |
| Let's Encrypt for a domain | `extension` | `["--exec", "letsencrypt", "cli.php", "-d", "example.com", "-m", "admin@example.com"]` |

## 6. SSH keys

Manage SSH keys for subscriptions with the **SSH Keys Manager** extension (`ssh-keys`) instead of editing `authorized_keys` by hand.

- Check with `plesk_list_extensions` whether `ssh-keys` is installed. If it is missing, recommend installing it.
- Keys are added or removed per subscription in the Plesk UI: Domains > *domain* > SSH Keys > Add Key (paste the public `.pub` key).
- The key must end with a name/comment without spaces (e.g. `ssh-ed25519 AAAA... user@laptop`); add one if it is missing.
- There is no documented CLI for this extension - don't guess `plesk_execute_cli` commands for it; point the user to the UI steps above.

## 7. Errors

Tool errors come back as `{"error": "...", "details": ...}`.

- **401 / 403**: invalid or IP-bound API key. Suggest the key rotation recipe below.
- **404**: wrong ID or wrong `instance` - re-run the lookup on the right instance.
- **Connection errors / timeouts**: check the instance URL via `plesk_list_instances`; the server may be unreachable.
- WordPress Toolkit errors on an otherwise working instance usually mean the WordPress Toolkit extension is missing or outdated - check with `plesk_list_extensions` and `plesk_wp_get_changelog`.

## 8. Recipes

**Server overview**: `plesk_get_server_info` -> `plesk_list_ips` -> `plesk_list_extensions` -> `plesk_list_domains` -> `plesk_list_clients` -> `plesk_wp_list_installations`. Summarize: Plesk version/OS, counts, suspended clients, WordPress sites per domain.

**Safe WordPress maintenance**: find installation -> `plesk_wp_create_backup` (wait for task) -> `plesk_wp_toggle_maintenance` `enabled: true` -> do the work -> `plesk_wp_clear_cache` -> `plesk_wp_toggle_maintenance` `enabled: false`. Always switch maintenance off again, also after errors.

**Staging clone**: find installation -> optional backup -> `plesk_wp_clone_installation` with `target_domain` (existing domain) or `target_domain` + `target_subdomain` (creates e.g. `staging.example.com`), optional `target_path` -> wait for task -> `plesk_wp_list_installations` to show the new site.

**Onboard customer**: `plesk_list_clients` (avoid duplicates) -> `plesk_create_client` -> `plesk_list_ips` -> `plesk_create_domain` with `owner_client_id`, `hosting_type: "virtual"`, `ftp_login` / `ftp_password` and optionally `ip_addresses` / `plan_name` -> summarize login, domain and IP (without passwords).

**Customer report**: `plesk_get_client` -> `plesk_list_client_domains` -> `plesk_get_client_statistics` (disk/traffic usage).

**Rotate API key**: `plesk_generate_api_key` (writes `.env`) -> tell the user to restart the MCP server -> verify with `plesk_get_server_info` -> `plesk_list_api_keys` -> delete the old key (`api_key` = its value) only after verification and confirmation.

## 9. Presenting results

- List tools return raw JSON; summarize as compact tables (ID, name, status) instead of dumping it.
- For large lists, show the relevant subset and offer the rest.
- After changes, state what was changed on which instance, and the relevant IDs.

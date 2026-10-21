# Plesk MCP Server

MCP Server for the Plesk REST API with support for multiple Plesk instances.

## Features

- ✅ Support for multiple Plesk instances
- ✅ Automatic API key generation
- ✅ Complete REST API integration
- ✅ Domain management
- ✅ Client management
- ✅ Server information
- ✅ Extension management
- ✅ Execute CLI commands
- ✅ **WordPress Toolkit Integration**
  - Manage WordPress installations
  - Create and restore backups
  - Clone installations
  - Control maintenance mode
  - Clear cache
  - Security settings (Vulnerability Filtering)

## Installation

Requires Node.js 20 or newer. See [INSTALL.md](INSTALL.md) for all options.

```bash
npm install   # also compiles TypeScript via the prepare script
```

## Configuration

1. Copy `.env.example` to `.env`
2. Enter your Plesk instances:

```env
PLESK_URL=https://your-plesk-server.com
PLESK_API_KEY=your-api-key

PLESK_2_URL=https://second-server.com
PLESK_2_API_KEY=second-api-key
```

Variables can also be set in the `env` block of the MCP client configuration; they take precedence over `.env`.

Plesk often uses a self-signed certificate, so TLS certificate verification is disabled by default. If your server has a valid certificate, enable verification:

```env
PLESK_VERIFY_TLS=true
```

## Generate API Key

### Automatically via MCP Tool (recommended)

The MCP Server provides a tool for automatic API key generation:

**In Claude Desktop:**
```
Use the plesk_generate_api_key tool with:
- plesk_url: https://your-server.com:8443
- username: admin
- password: your-password
- instance_name: default (or instance_2, etc.)
```

The tool automatically generates an API key and saves it in the `.env` file. After restarting the MCP Server, the instance is available.

New keys have no IP binding, so they remain usable when the client's public IP changes. Both the MCP tool and `generate-key.cjs` call `/api/v2/cli/secret_key/call` with `--create` and `-description`, without `-ip-address`. This requires administrator credentials and access to that CLI utility through the REST API. There is no fallback to `/auth/keys`, because that endpoint binds keys to the sender's IP when `ip` is omitted.

Existing IP-bound keys are not changed by this update. Generate a replacement, restart the MCP server, and verify access before deleting the old key. See the [Plesk secret_key reference](https://docs.plesk.com/en-US/obsidian/cli-linux/73880/).

### Manually via Plesk UI

1. Log in to Plesk
2. Go to "Tools & Settings" > "API Keys"
3. Create a new API key
4. Copy the key to your `.env` file

## MCP Tools

### Authentication & Setup
- `plesk_generate_api_key` - Generate API key and save to .env
- `plesk_list_api_keys` - List all API keys
- `plesk_delete_api_key` - Delete API key
- `plesk_list_instances` - Show all configured instances

### Domain Management
- `plesk_list_domains` - List all domains
- `plesk_get_domain` - Retrieve domain details
- `plesk_create_domain` - Create new domain (new subscription or added to an existing one; owner, plan, IPs, FTP login)
- `plesk_update_domain` - Update domain
- `plesk_get_domain_status` - Get domain status
- `plesk_set_domain_status` - Activate, suspend or disable domain
- `plesk_delete_domain` - Delete domain

### Client Management
- `plesk_list_clients` - List all clients
- `plesk_get_client` - Retrieve client details
- `plesk_list_client_domains` - List domains of a client
- `plesk_get_client_statistics` - Client resource usage
- `plesk_create_client` - Create new client
- `plesk_update_client` - Update client
- `plesk_suspend_client` - Suspend client
- `plesk_activate_client` - Activate client
- `plesk_delete_client` - Delete client

### Server Management
- `plesk_get_server_info` - Server information
- `plesk_list_ips` - List all IP addresses

### Extensions
- `plesk_list_extensions` - List all extensions

### CLI
- `plesk_execute_cli` - Execute Plesk CLI command

### WordPress Toolkit
- `plesk_wp_list_installations` - List all WordPress installations (optionally filtered)
- `plesk_wp_get_installation` - WordPress installation details
- `plesk_wp_clone_installation` - Clone WordPress installation to an existing domain or a new subdomain
- `plesk_wp_create_backup` - Create backup
- `plesk_wp_restore_backup` - Restore backup
- `plesk_wp_list_backups` - List all backups
- `plesk_wp_toggle_maintenance` - Enable/disable maintenance mode
- `plesk_wp_clear_cache` - Clear cache
- `plesk_wp_get_background_task` - Retrieve background task status
- `plesk_wp_update_vulnerability_filtering` - Enable/disable vulnerability filtering
- `plesk_wp_get_changelog` - Retrieve WordPress Toolkit changelog

All tools carry MCP annotations (`readOnlyHint`, `destructiveHint`), so clients can ask for confirmation before destructive calls.

## Skill & Prompts

To help Claude use the tools efficiently and safely, the repository ships a usage skill and a set of MCP prompts.

### Agent Skill (`skills/plesk/SKILL.md`)

Teaches Claude the right call order (instance -> ID lookup -> action -> poll background task), which operations need confirmation, useful Plesk CLI calls and ready-made recipes.

- **Claude Code:** `cp -r skills/plesk ~/.claude/skills/` (or `.claude/skills/` inside a project)
- **Claude Desktop / claude.ai:** zip the `skills/plesk` folder and upload it under Settings > Capabilities > Skills

### MCP Prompts

Available in every MCP client that supports prompts (e.g. as slash commands):

- `plesk_server_overview` - Summarize version, IPs, extensions, domains, clients and WordPress sites
- `plesk_wp_safe_maintenance` - Backup -> maintenance mode -> work -> clear cache -> back online
- `plesk_wp_staging_clone` - Clone a WordPress site to a staging domain
- `plesk_onboard_customer` - Create a customer and their first domain
- `plesk_rotate_api_key` - Generate a new API key, verify it, delete the old one

## Usage with Claude Desktop

Add to Claude Desktop Config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "plesk": {
      "command": "node",
      "args": ["/yourgit/plesk_mcp/dist/index.js"]
    }
  }
}
```

Or without a local clone, directly from GitHub:

```json
{
  "mcpServers": {
    "plesk": {
      "command": "npx",
      "args": ["-y", "github:Powie/plesk_mcp"],
      "env": {
        "PLESK_URL": "https://your-server.com:8443",
        "PLESK_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage with Claude Code

```bash
claude mcp add plesk -e PLESK_URL=https://your-server.com:8443 -e PLESK_API_KEY=your-api-key -- node /yourgit/plesk_mcp/dist/index.js
```

## Development

```bash
npm run dev   # compile and start
npm test      # run tests
```

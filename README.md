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

```bash
npm install
npm run build
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
- `plesk_create_domain` - Create new domain
- `plesk_update_domain` - Update domain
- `plesk_delete_domain` - Delete domain

### Client Management
- `plesk_list_clients` - List all clients
- `plesk_get_client` - Retrieve client details
- `plesk_create_client` - Create new client
- `plesk_update_client` - Update client
- `plesk_suspend_client` - Suspend client
- `plesk_activate_client` - Activate client

### Server Management
- `plesk_get_server_info` - Server information
- `plesk_list_ips` - List all IP addresses

### Extensions
- `plesk_list_extensions` - List all extensions

### CLI
- `plesk_execute_cli` - Execute Plesk CLI command

### WordPress Toolkit
- `plesk_wp_list_installations` - List all WordPress installations
- `plesk_wp_get_installation` - WordPress installation details
- `plesk_wp_clone_installation` - Clone WordPress installation
- `plesk_wp_create_backup` - Create backup
- `plesk_wp_restore_backup` - Restore backup
- `plesk_wp_list_backups` - List all backups
- `plesk_wp_toggle_maintenance` - Enable/disable maintenance mode
- `plesk_wp_clear_cache` - Clear cache
- `plesk_wp_get_background_task` - Retrieve background task status
- `plesk_wp_list_background_tasks` - List background tasks
- `plesk_wp_update_vulnerability_filtering` - Enable/disable vulnerability filtering
- `plesk_wp_get_changelog` - Retrieve WordPress Toolkit changelog

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

## Development

```bash
npm run dev
```

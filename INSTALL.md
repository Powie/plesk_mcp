# Plesk MCP Server Installation

This guide describes how to install and configure the Plesk MCP Server for use with Claude Desktop or other MCP clients.

## Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Access to one or more Plesk servers
- Claude Desktop (for use with Claude)

## Installation

### Option A: Installation from GitHub (Recommended)

The easiest method is direct installation from GitHub:

```bash
npm install github:Powie/plesk_mcp
```

The project will be automatically downloaded, dependencies installed, and TypeScript compiled.

**Note:** You can also install a specific branch:
```bash
npm install github:Powie/plesk_mcp#beta
```

### Option B: Local Installation (Development)

For development purposes or if you want to customize the code:

#### 1. Clone repository

```bash
git clone https://github.com/Powie/plesk_mcp.git
cd plesk_mcp
```

#### 2. Install dependencies and compile

```bash
npm install
```

The `prepare` script will automatically run and compile TypeScript with `npm run build`.

## Configuration

### 1. Set up environment variables

Copy the example configuration:

```bash
cp .env.example .env
```

Edit the `.env` file and enter your Plesk credentials:

```env
# First Plesk instance (default)
PLESK_URL=https://your-plesk-server.com:8443
PLESK_API_KEY=your-api-key-here

# Second Plesk instance (optional)
PLESK_2_URL=https://second-server.com:8443
PLESK_2_API_KEY=second-api-key-here

# Additional instances following the same pattern
# PLESK_3_URL=...
# PLESK_3_API_KEY=...
```

### 2. Obtaining an API Key

You have several options to obtain an API key:

#### Option A: Automatically via MCP Server (Recommended)

After integrating with Claude Desktop, you can have the API key generated automatically:

1. Start Claude Desktop
2. Use the `plesk_generate_api_key` tool
3. The key will be automatically written to the `.env` file
4. Restart Claude Desktop to load the new key

#### Option B: Manually via Plesk UI

1. Log in to Plesk
2. Navigate to: **Tools & Settings** → **API Keys**
3. Click on **Create API Key**
4. Copy the generated key
5. Add it to your `.env` file

#### Option C: Via Plesk CLI

```bash
plesk ext call api-management --method create --params "name=MyAPIKey"
```

## Integration with Claude Desktop

### 1. Open Claude Desktop Config

The configuration file can be found here:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### 2. Add MCP Server

Add the Plesk MCP Server to the configuration:

#### For GitHub installation:

```json
{
  "mcpServers": {
   "plesk": {
      "command": "npx",
      "args": [
        "-y",
        "github:Powie/plesk_mcp#beta"
      ]
   }
  }
}
```

#### For local installation (development):

```json
{
  "mcpServers": {
    "plesk": {
      "command": "node",
      "args": ["/home/user/plesk-mcp-server/dist/index.js"]
    }
  }
}
```

**Important:** Adjust the path to match your installation!

For Linux/macOS use forward slashes:
```json
"args": ["/home/user/plesk_mcp/dist/index.js"]
```

### 3. Restart Claude Desktop

Completely restart Claude Desktop for the changes to take effect.

Add the first server with this prompt:

Add a new Plesk server, server name: https://server.xx:8443 with username: user and password: secretpassword

### 4. Test connection

Open Claude Desktop and test the connection:

```
Show me all available Plesk instances
```

Claude should now display the configured Plesk servers.

## Available MCP Tools

After installation, the following tools are available:

### Server & Instances
- `plesk_list_instances` - Show all configured Plesk instances
- `plesk_get_server_info` - Retrieve server information
- `plesk_list_ips` - List all IP addresses

### API Key Management
- `plesk_generate_api_key` - Generate and save new API key
- `plesk_list_api_keys` - List all API keys
- `plesk_delete_api_key` - Delete API key

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

### Extensions & CLI
- `plesk_list_extensions` - List installed extensions
- `plesk_execute_cli` - Execute Plesk CLI command

### WordPress Toolkit
- `plesk_wp_list_installations` - List all WordPress installations
- `plesk_wp_get_installation` - Retrieve WordPress installation details
- `plesk_wp_clone_installation` - Clone WordPress installation
- `plesk_wp_create_backup` - Create backup of WordPress installation
- `plesk_wp_restore_backup` - Restore WordPress installation from backup
- `plesk_wp_list_backups` - List all backups for an installation
- `plesk_wp_toggle_maintenance` - Enable/disable maintenance mode
- `plesk_wp_clear_cache` - Clear cache for WordPress installations
- `plesk_wp_get_background_task` - Retrieve background task status
- `plesk_wp_list_background_tasks` - List all background tasks for an installation
- `plesk_wp_update_vulnerability_filtering` - Enable/disable security filtering
- `plesk_wp_get_changelog` - Retrieve WordPress Toolkit changelog

## Usage Examples

### List domains
```
Show me all domains on my Plesk server
```

### Create domain
```
Create a new domain "example.com" for client with ID 5
```

### Retrieve server information
```
Which Plesk version is running on my server?
```

### Generate API key
```
Generate a new API key for my Plesk server at https://server.com:8443 with username admin and password xyz
```

### Manage WordPress installations
```
Show me all WordPress installations on my server
```

```
Create a backup of WordPress installation with ID 15
```

```
Enable maintenance mode for WordPress installation with ID 15
```

```
Clone WordPress installation with ID 15 to staging.example.com
```

```
Clear cache for WordPress installations 10, 15 and 20
```

## Multiple Plesk Instances

The MCP Server supports multiple Plesk instances simultaneously. Simply add more instances in the `.env` file:

```env
PLESK_URL=https://server1.com:8443
PLESK_API_KEY=key1

PLESK_2_URL=https://server2.com:8443
PLESK_2_API_KEY=key2

PLESK_3_URL=https://server3.com:8443
PLESK_3_API_KEY=key3
```

When calling the tools, you can then specify the desired instance.

## Troubleshooting

### MCP Server not recognized

1. Check the path in `claude_desktop_config.json`
2. Ensure that `npm run build` was executed successfully
3. Check if the file `dist/index.js` exists
4. Completely restart Claude Desktop (not just close the window)

### Connection errors to Plesk

1. Check the URL in the `.env` file (including port 8443)
2. Test the connection in your browser
3. Check if the API key is still valid
4. Ensure that the Plesk server is reachable from your network

### API key not working

1. Generate a new API key via the Plesk UI
2. Ensure there are no extra spaces in the key
3. Check if the key has the correct permissions
4. Restart Claude Desktop after changes to the `.env` file

## Updates

To update the MCP Server:

```bash
git pull
npm install
npm run build
```

Then restart Claude Desktop.

## Uninstallation

1. Remove the entry from `claude_desktop_config.json`
2. Restart Claude Desktop
3. Optionally delete the `plesk_mcp` directory

## Support

For problems or questions:
- Check the Claude Desktop logs
- Test the Plesk API directly with curl/Postman
- Open an issue in the repository

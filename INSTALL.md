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

#### Option A: Manually via Plesk UI

1. Log in to Plesk
2. Navigate to: **Tools & Settings** → **API Keys**
3. Click on **Create API Key**
4. Copy the generated key
5. Add it to your `.env` file

#### Option B: Via Plesk Extension

1. Install Plesk Extension "secret-keys-manager" 
2. Open the Extension and add a new API Key

## Integration with Claude Desktop

### 1. Open Claude Desktop Config

The configuration file can be found here:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

### 2. Add MCP Server

Add the Plesk MCP Server to the configuration:

#### Recomended: For GitHub installation:

```json
{
  "mcpServers": {
   "plesk": {
      "command": "npx",
      "args": [
        "-y",
        "github:Powie/plesk_mcp#beta"
      ],
      "env": {
        "PLESK_1_URL": "https://my.server1.com:8443",
        "PLESK_1_API_KEY": "total-secret-key"
      }
   }
  }
}
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

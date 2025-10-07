#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadPleskInstances } from './config.js';
import { registerTools } from './tools.js';

/**
 * Main MCP Server Entry Point
 */
async function main() {
  // Load Plesk instances from environment
  const instances = loadPleskInstances();

  if (instances.size === 0) {
    console.error('Error: No Plesk instances configured.');
    console.error('Please create a .env file with PLESK_URL and PLESK_API_KEY');
    process.exit(1);
  }

  console.error(`Loaded ${instances.size} Plesk instance(s):`);
  instances.forEach((instance) => {
    console.error(`  - ${instance.name}: ${instance.url}`);
  });

  // Create MCP server
  const server = new McpServer({
    name: 'plesk',
    version: '1.0.0',
  });

  // Register all tools
  registerTools(server, instances);

  // Create stdio transport
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  console.error('Plesk MCP Server running on stdio');
}

// Run the server
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

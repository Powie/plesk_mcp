#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadPleskInstances, PACKAGE_ROOT } from './config.js';
import { registerTools } from './tools/index.js';
import { registerPrompts } from './prompts/index.js';
import { readFileSync } from 'fs';
import path from 'path';

const { version } = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf-8'));

/**
 * Main MCP Server Entry Point
 */
async function main() {
  // Load Plesk instances from environment
  const instances = loadPleskInstances();

  // Keep running without instances so plesk_generate_api_key can bootstrap the first one
  if (instances.size === 0) {
    console.error('Warning: No Plesk instances configured.');
    console.error('Set PLESK_URL and PLESK_API_KEY, or use the plesk_generate_api_key tool.');
  }

  console.error(`Loaded ${instances.size} Plesk instance(s):`);
  instances.forEach((instance) => {
    console.error(`  - ${instance.name}: ${instance.url}`);
  });

  // Create MCP server
  const server = new McpServer({
    name: 'plesk',
    version,
  });

  // Register all tools
  registerTools(server, instances);

  // Register workflow prompts
  registerPrompts(server);

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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { PleskClient } from '../plesk-client.js';
import { WordPressClient } from '../wordpress-client.js';
import { PleskInstance } from '../types.js';
import { getInstance } from '../config.js';
import { ToolContext } from './helpers.js';
import { registerServerTools } from './server-tools.js';
import { registerDomainTools } from './domain-tools.js';
import { registerClientTools } from './client-tools.js';
import { registerApiKeyTools } from './api-key-tools.js';
import { registerWordPressTools } from './wordpress-tools.js';

/**
 * Register all MCP tools on the server
 */
export function registerTools(server: McpServer, instances: Map<string, PleskInstance>) {
  const ctx: ToolContext = {
    instances,
    getClient: (instanceName?: string): PleskClient =>
      new PleskClient(getInstance(instances, instanceName)),
    getWPClient: (instanceName?: string): WordPressClient =>
      new WordPressClient(getInstance(instances, instanceName)),
  };

  registerServerTools(server, ctx);
  registerDomainTools(server, ctx);
  registerClientTools(server, ctx);
  registerApiKeyTools(server);
  registerWordPressTools(server, ctx);
}

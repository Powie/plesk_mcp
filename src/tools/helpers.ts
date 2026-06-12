import axios from 'axios';
import { z } from 'zod';
import { PleskClient } from '../plesk-client.js';
import { WordPressClient } from '../wordpress-client.js';
import { PleskInstance } from '../types.js';

/**
 * Shared context passed to every tool registration module
 */
export interface ToolContext {
  instances: Map<string, PleskInstance>;
  getClient: (instanceName?: string) => PleskClient;
  getWPClient: (instanceName?: string) => WordPressClient;
}

/**
 * Common "instance" parameter used by all instance-scoped tools
 */
export const instanceParam = z
  .string()
  .optional()
  .describe('Plesk instance name as returned by plesk_list_instances (default: "default")');

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

/**
 * Wrap arbitrary data into an MCP text result
 */
export function jsonResult(data: unknown): ToolResult {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: 'text', text }] };
}

/**
 * Convert an error into an MCP error result with useful details
 */
export function errorResult(error: unknown): ToolResult {
  let message: string;
  let details: unknown;

  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    message = status
      ? `Plesk API error ${status}: ${error.response?.statusText || error.message}`
      : error.message;
    details = error.response?.data;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify({ error: message, details }, null, 2) }],
    isError: true,
  };
}

/**
 * Execute a tool action and convert the outcome (data or error) into an MCP result.
 * Use inside tool handlers: `async (args) => run(() => client.get(...))`
 */
export async function run(action: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return jsonResult(await action());
  } catch (error) {
    return errorResult(error);
  }
}

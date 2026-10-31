import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'plesk-mcp-test-'));
process.env.PLESK_ENV_FILE = path.join(directory, '.env');
const { getInstance, loadPleskInstances } = await import('../dist/config.js');
const { saveApiKeyToEnv } = await import('../dist/auth.js');
const { registerTools } = await import('../dist/tools/index.js');
const one = { name: 'instance_1', url: 'https://one.invalid', apiKey: 'test-one' };
const two = { name: 'instance_2', url: 'https://two.invalid', apiKey: 'test-two' };
const instances = new Map([[one.name, one], [two.name, two]]);
test('multiple servers require an explicit target without a default', () => {
  assert.equal(getInstance(instances, 'instance_2'), two);
  assert.throws(() => getInstance(instances), /Specify an instance/);
  assert.throws(() => getInstance(instances, 'missing'), /not found/);
  assert.equal(getInstance(new Map([[one.name, one]])), one);
  assert.throws(() => getInstance(new Map([[one.name, one]]), 'default'));
  assert.equal(getInstance(new Map([...instances, ['default', one]])), one);
});
test('numbered configuration includes instance_1', () => {
  const previous = process.env;
  try {
    process.env = { PLESK_1_URL: one.url + '/', PLESK_1_API_KEY: one.apiKey, PLESK_2_URL: two.url, PLESK_2_API_KEY: two.apiKey };
    const loaded = loadPleskInstances();
    assert.equal(loaded.size, 2);
    assert.equal(loaded.get('instance_1').url, one.url);
  } finally { process.env = previous; }
});
test('saving keys preserves other instances and rejects invalid names', () => {
  saveApiKeyToEnv(one.name, one.url, one.apiKey);
  saveApiKeyToEnv(two.name, two.url, two.apiKey);
  saveApiKeyToEnv(one.name, one.url, 'replacement');
  const content = fs.readFileSync(process.env.PLESK_ENV_FILE, 'utf8');
  assert.match(content, /PLESK_1_API_KEY=replacement/);
  assert.match(content, /PLESK_2_API_KEY=test-two/);
  assert.throws(() => saveApiKeyToEnv('invalid', one.url, 'key'));
  assert.throws(() => saveApiKeyToEnv(one.name, one.url, 'key\ninjected'));
});
test('MCP lists schemas, routes instances and rejects invalid inputs', async () => {
  const server = new McpServer({ name: 'test', version: '0.11.0' });
  registerTools(server, instances);
  const client = new Client({ name: 'test-client', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  await client.connect(b);
  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 35);
    const domain = tools.find(t => t.name === 'plesk_get_domain');
    assert.ok(domain.inputSchema.required.includes('domain_id'));
    const list = await client.callTool({ name: 'plesk_list_instances', arguments: {} });
    assert.deepEqual(JSON.parse(list.content[0].text).map(i => i.name), ['instance_1', 'instance_2']);
    const ambiguous = await client.callTool({ name: 'plesk_get_server_info', arguments: {} });
    assert.equal(ambiguous.isError, true);
    const invalid = await client.callTool({ name: 'plesk_get_domain', arguments: { domain_id: 'invalid' } });
    assert.equal(invalid.isError, true);
  } finally { await client.close(); await server.close(); }
});
test.after(() => fs.rmSync(directory, { recursive: true, force: true }));

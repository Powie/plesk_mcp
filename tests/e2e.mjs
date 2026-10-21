// End-to-end test: runs dist/index.js over stdio against a mock Plesk HTTPS server
// with a self-signed certificate and checks the requests every tool sends.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const WP = '/api/modules/wp-toolkit/v1';
const API_KEY = 'test-key-123';
const ADMIN_AUTH = 'Basic ' + Buffer.from('admin:pw').toString('base64');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plesk-mcp-e2e-'));
const log = [];
let server, url, pkg;

/**
 * Mock Plesk API: records every request and answers the few endpoints
 * whose responses the tools inspect; everything else gets a generic 200
 */
function handle(req, res, body) {
  const entry = {
    method: req.method,
    url: req.url,
    apiKey: req.headers['x-api-key'],
    auth: req.headers.authorization,
    body: body ? JSON.parse(body) : undefined,
  };
  log.push(entry);
  const send = (code, data) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  if (entry.url === '/api/v2/cli/secret_key/call') {
    if (entry.auth !== ADMIN_AUTH) return send(401, { code: 0, message: 'Unauthorized' });
    if (entry.body.params[0] === '--create') return send(200, { code: 0, stdout: 'NEW-KEY-abc\n', stderr: '' });
    return send(200, { code: 0, stdout: 'key list output', stderr: '' });
  }
  if (entry.url.startsWith('/api/v2/auth/keys/')) return send(entry.auth === ADMIN_AUTH ? 200 : 401, {});
  if (entry.apiKey !== API_KEY) return send(401, { code: 1, message: 'Invalid API key' });
  if (entry.url === '/api/v2/domains/999') return send(404, { code: 1013, message: 'Domain not found' });
  if (entry.url === `${WP}/installations`) {
    return send(200, [{ id: 1, url: 'https://foo.example' }, { id: 2, url: 'https://bar.example' }]);
  }
  if (entry.url === `${WP}/installations/1/features/clone/stub`) {
    return send(200, { value: { database: { value: { name: { value: 'wp_clone_db' } } } } });
  }
  send(200, { ok: true });
}

/**
 * Start dist/index.js from a copy of the package root, so .env writes stay in the temp dir
 */
async function connect(env) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(pkg, 'dist/index.js')],
    cwd: pkg,
    env: { PATH: process.env.PATH, ...env },
    stderr: 'ignore',
  });
  const client = new Client({ name: 'e2e', version: '1' });
  await client.connect(transport);
  return client;
}

async function call(client, name, args = {}) {
  const start = log.length;
  const result = await client.callTool({ name, arguments: args });
  const text = result.content?.[0]?.text;
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { result, data, requests: log.slice(start) };
}

let client;

before(async () => {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
    '-keyout', path.join(tmp, 'key.pem'), '-out', path.join(tmp, 'cert.pem'),
  ], { stdio: 'ignore' });
  server = https.createServer(
    { key: fs.readFileSync(path.join(tmp, 'key.pem')), cert: fs.readFileSync(path.join(tmp, 'cert.pem')) },
    (req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => handle(req, res, body));
    }
  );
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `https://127.0.0.1:${server.address().port}`;

  pkg = path.join(tmp, 'pkg');
  fs.mkdirSync(pkg);
  fs.cpSync(path.join(ROOT, 'dist'), path.join(pkg, 'dist'), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(pkg, 'package.json'));
  fs.symlinkSync(path.join(ROOT, 'node_modules'), path.join(pkg, 'node_modules'));

  client = await connect({
    PLESK_URL: `${url}/`,
    PLESK_API_KEY: API_KEY,
    PLESK_2_URL: url,
    PLESK_2_API_KEY: 'wrong-key',
  });
});

after(async () => {
  await client?.close();
  server?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('lists tools and prompts', async () => {
  const { tools } = await client.listTools();
  assert.equal(tools.length, 35);
  for (const tool of tools) {
    assert.ok(tool.description, `${tool.name} has a description`);
    assert.ok(tool.annotations, `${tool.name} has annotations`);
  }
  const { prompts } = await client.listPrompts();
  assert.equal(prompts.length, 5);
  for (const prompt of prompts) {
    const args = Object.fromEntries((prompt.arguments || []).filter((a) => a.required).map((a) => [a.name, 'x.example']));
    const { messages } = await client.getPrompt({ name: prompt.name, arguments: args });
    assert.match(messages[0].content.text, /Rules:/, prompt.name);
  }
});

test('lists configured instances', async () => {
  const { data } = await call(client, 'plesk_list_instances');
  assert.deepEqual(data.map((i) => i.name).sort(), ['default', 'instance_2']);
});

// [tool, arguments, method, path, body (undefined = not checked)]
const cases = [
  ['plesk_get_server_info', {}, 'GET', '/api/v2/server'],
  ['plesk_list_ips', {}, 'GET', '/api/v2/server/ips'],
  ['plesk_list_extensions', {}, 'GET', '/api/v2/extensions'],
  ['plesk_execute_cli', { command: 'site', params: ['--list'] }, 'POST', '/api/v2/cli/site/call', { params: ['--list'] }],
  ['plesk_execute_cli', { command: 'a/b' }, 'POST', '/api/v2/cli/a%2Fb/call', { params: [] }],
  ['plesk_list_domains', {}, 'GET', '/api/v2/domains'],
  ['plesk_get_domain', { domain_id: 5 }, 'GET', '/api/v2/domains/5'],
  ['plesk_create_domain',
    { name: 'ex.com', hosting_type: 'virtual', ftp_login: 'u', ftp_password: 'p', ip_addresses: ['1.2.3.4'], owner_client_id: 3, plan_name: 'Default' },
    'POST', '/api/v2/domains',
    { name: 'ex.com', hosting_type: 'virtual', hosting_settings: { ftp_login: 'u', ftp_password: 'p' }, ip_addresses: ['1.2.3.4'], owner_client: { id: 3 }, plan: { name: 'Default' } }],
  ['plesk_create_domain', { name: 'fw.com', hosting_type: 'standard_forwarding', forwarding_url: 'https://x' },
    'POST', '/api/v2/domains', { name: 'fw.com', hosting_type: 'standard_forwarding', hosting_settings: { dest_url: 'https://x' } }],
  ['plesk_update_domain', { domain_id: 5, description: 'd' }, 'PUT', '/api/v2/domains/5', { description: 'd' }],
  ['plesk_get_domain_status', { domain_id: 5 }, 'GET', '/api/v2/domains/5/status'],
  ['plesk_set_domain_status', { domain_id: 5, status: 'suspended' }, 'PUT', '/api/v2/domains/5/status', { status: 'suspended' }],
  ['plesk_delete_domain', { domain_id: 5 }, 'DELETE', '/api/v2/domains/5'],
  ['plesk_list_clients', {}, 'GET', '/api/v2/clients'],
  ['plesk_get_client', { client_id: 3 }, 'GET', '/api/v2/clients/3'],
  ['plesk_list_client_domains', { client_id: 3 }, 'GET', '/api/v2/clients/3/domains'],
  ['plesk_get_client_statistics', { client_id: 3 }, 'GET', '/api/v2/clients/3/statistics'],
  ['plesk_create_client', { type: 'customer', name: 'N', email: 'e@x', login: 'l', password: 'p', locale: 'de-DE' },
    'POST', '/api/v2/clients', { type: 'customer', name: 'N', email: 'e@x', login: 'l', password: 'p', locale: 'de-DE' }],
  ['plesk_update_client', { client_id: 3, email: 'n@x' }, 'PUT', '/api/v2/clients/3', { email: 'n@x' }],
  ['plesk_suspend_client', { client_id: 3 }, 'PUT', '/api/v2/clients/3/suspend'],
  ['plesk_activate_client', { client_id: 3 }, 'PUT', '/api/v2/clients/3/activate'],
  ['plesk_delete_client', { client_id: 3 }, 'DELETE', '/api/v2/clients/3'],
  ['plesk_wp_get_installation', { installation_id: 1 }, 'GET', `${WP}/installations/1`],
  ['plesk_wp_create_backup', { installation_id: 1 }, 'POST', `${WP}/features/backups/creator`, { installationId: 1, description: 'Manual backup' }],
  ['plesk_wp_restore_backup', { installation_id: 1, file_name: 'b.zip', clobber: false },
    'POST', `${WP}/features/backups/restorer`, { installationId: 1, fileName: 'b.zip', clobber: false }],
  ['plesk_wp_list_backups', { installation_id: 1 }, 'GET', `${WP}/installations/1/backups`],
  ['plesk_wp_toggle_maintenance', { installation_id: 1, enabled: true }, 'PUT', `${WP}/installations/1/features/maintenance/status`, { status: true }],
  ['plesk_wp_clear_cache', { installation_ids: [1, 2] }, 'POST', `${WP}/cache-cleaner`, { installationsIds: [1, 2] }],
  ['plesk_wp_get_background_task', { task_code: 'clone', task_id: '7' }, 'GET', `${WP}/background-tasks/clone/7`],
  ['plesk_wp_update_vulnerability_filtering', { installation_id: 1, filtering_enabled: false },
    'PATCH', `${WP}/installations/1/features/vulnerability/filtering`, { status: false }],
  ['plesk_wp_get_changelog', {}, 'GET', `${WP}/changelogs`],
];

for (const [tool, args, method, endpoint, body] of cases) {
  test(`${tool} ${JSON.stringify(args)} -> ${method} ${endpoint}`, async () => {
    const { result, data, requests } = await call(client, tool, args);
    assert.ok(!result.isError, JSON.stringify(data));
    assert.equal(requests.length, 1);
    const [request] = requests;
    assert.equal(request.method, method);
    assert.equal(request.url, endpoint);
    assert.equal(request.apiKey, API_KEY);
    if (body !== undefined) assert.deepEqual(request.body, body);
  });
}

test('plesk_wp_list_installations filters case-insensitively', async () => {
  const { data } = await call(client, 'plesk_wp_list_installations', { filter: 'FOO' });
  assert.deepEqual(data.map((i) => i.id), [1]);
});

test('plesk_wp_clone_installation uses the stub database name for a new subdomain', async () => {
  const { result, requests } = await call(client, 'plesk_wp_clone_installation', {
    installation_id: 1, target_domain: 'ex.com', target_subdomain: 'staging',
  });
  assert.ok(!result.isError);
  assert.deepEqual(requests.map((r) => r.url), [`${WP}/installations/1/features/clone/stub`, `${WP}/cloner`]);
  assert.deepEqual(requests[1].body, {
    installationId: 1,
    domain: { newSubdomain: { parentDomain: 'ex.com', name: 'staging' } },
    database: { name: 'wp_clone_db' },
  });
});

test('plesk_wp_clone_installation with database_name skips the stub', async () => {
  const { requests } = await call(client, 'plesk_wp_clone_installation', {
    installation_id: 1, target_domain: 'ex.com', database_name: 'mydb', target_path: 'sub', overwrite: true,
  });
  assert.equal(requests.length, 1);
  assert.deepEqual(requests[0].body, {
    installationId: 1, domain: { existing: 'ex.com' }, database: { name: 'mydb' }, installationPath: 'sub', overwrite: true,
  });
});

test('plesk_wp_clone_installation fails without a default database name', async () => {
  const { result, data } = await call(client, 'plesk_wp_clone_installation', { installation_id: 2, target_domain: 'ex.com' });
  assert.ok(result.isError);
  assert.match(data.error, /database_name/);
});

test('plesk_generate_api_key creates an unbound key and saves it to .env', async () => {
  const { result, requests } = await call(client, 'plesk_generate_api_key', {
    plesk_url: url, username: 'admin', password: 'pw', instance_name: 'instance_5',
  });
  assert.ok(!result.isError);
  assert.deepEqual(requests[0].body, { params: ['--create', '-description', 'MCP Server API Key'] });
  const env = fs.readFileSync(path.join(pkg, '.env'), 'utf-8');
  assert.match(env, new RegExp(`^PLESK_5_URL=${url}$`, 'm'));
  assert.match(env, /^PLESK_5_API_KEY=NEW-KEY-abc$/m);
});

test('plesk_generate_api_key reports wrong credentials', async () => {
  const { result, data } = await call(client, 'plesk_generate_api_key', { plesk_url: url, username: 'admin', password: 'bad' });
  assert.ok(result.isError);
  assert.match(data.error, /401/);
});

test('plesk_list_api_keys returns the secret_key --list output', async () => {
  const { data, requests } = await call(client, 'plesk_list_api_keys', { plesk_url: url, username: 'admin', password: 'pw' });
  assert.equal(data, 'key list output');
  assert.deepEqual(requests[0].body, { params: ['--list'] });
});

test('plesk_delete_api_key URL-encodes the key', async () => {
  const { result, requests } = await call(client, 'plesk_delete_api_key', {
    plesk_url: url, username: 'admin', password: 'pw', api_key: 'a/b c',
  });
  assert.ok(!result.isError);
  assert.equal(requests[0].method, 'DELETE');
  assert.equal(requests[0].url, '/api/v2/auth/keys/a%2Fb%20c');
});

test('API errors are returned with details', async () => {
  const { result, data } = await call(client, 'plesk_get_domain', { domain_id: 999 });
  assert.ok(result.isError);
  assert.match(data.error, /404/);
  assert.equal(data.details.code, 1013);
});

test('each instance uses its own API key', async () => {
  const { result, requests } = await call(client, 'plesk_get_server_info', { instance: 'instance_2' });
  assert.ok(result.isError);
  assert.equal(requests[0].apiKey, 'wrong-key');
});

test('unknown instance is rejected', async () => {
  const { result, data } = await call(client, 'plesk_get_server_info', { instance: 'nope' });
  assert.ok(result.isError);
  assert.match(data.error, /not found/);
});

test('invalid arguments are rejected', async () => {
  const result = await client.callTool({ name: 'plesk_get_domain', arguments: { domain_id: 'abc' } });
  assert.ok(result.isError);
});

test('server starts without instances', async () => {
  fs.rmSync(path.join(pkg, '.env'), { force: true });
  const empty = await connect({});
  try {
    assert.deepEqual((await call(empty, 'plesk_list_instances')).data, []);
    const { result, data } = await call(empty, 'plesk_get_server_info');
    assert.ok(result.isError);
    assert.match(data.error, /No Plesk instances configured/);
  } finally {
    await empty.close();
  }
});

test('PLESK_VERIFY_TLS=true rejects the self-signed certificate', async () => {
  const strict = await connect({ PLESK_URL: url, PLESK_API_KEY: API_KEY, PLESK_VERIFY_TLS: 'true' });
  try {
    const { result, data } = await call(strict, 'plesk_get_server_info');
    assert.ok(result.isError);
    assert.match(data.error, /self-signed certificate/);
  } finally {
    await strict.close();
  }
});

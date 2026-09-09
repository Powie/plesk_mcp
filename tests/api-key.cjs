const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { test } = require('node:test');
const ts = require(process.env.PLESK_TEST_TYPESCRIPT || 'typescript');

for (const entry of ['src/auth.ts', 'generate-key.cjs']) {
  for (const valid of [true, false]) {
    test(`${entry}: ${valid ? 'creates unbound key' : 'rejects failed creation'}`, async () => {
      let request;
      let saved = false;
      const axios = {
        post: async (...args) => {
          request = args;
          return { data: valid ? { code: 0, stdout: 'test-key\n' } : { code: 1, stdout: '' } };
        },
        isAxiosError: () => false,
      };
      const source = fs.readFileSync(path.join(__dirname, '..', entry), 'utf8');
      const isTs = entry.endsWith('.ts');
      const code = isTs ? ts.transpileModule(source.replace('import.meta.url', JSON.stringify(require('node:url').pathToFileURL(path.join(__dirname, '../dist/auth.js')).href)), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
      }).outputText : source.replace('generateApiKey();', 'module.exports = generateApiKey;');
      const module = { exports: {} };
      vm.runInNewContext(code, {
        module, exports: module.exports, __dirname,
        require: (name) => name === 'axios' ? axios : name === 'fs' ? {
          existsSync: () => false,
          writeFileSync: () => { saved = true; },
        } : require(name),
        process: { argv: ['node', entry, 'https://example.test:8443/', 'admin', 'test-password'], exit: () => { throw new Error('exit'); } },
        console: { log() {}, error() {} },
      });
      const invoke = () => isTs
        ? module.exports.generateApiKey('https://example.test:8443/', 'admin', 'test-password', 'MCP Server API Key')
        : module.exports();
      if (valid) {
        const result = await invoke();
        if (isTs) assert.equal(result, 'test-key');
        else assert.equal(saved, true);
      } else {
        await assert.rejects(invoke);
        assert.equal(saved, false);
      }
      assert.equal(request[0], 'https://example.test:8443/api/v2/cli/secret_key/call');
      assert.equal(JSON.stringify(request[1]), JSON.stringify({ params: ['--create', '-description', 'MCP Server API Key'] }));
      assert.equal(request[2].auth.username, 'admin');
    });
  }
}

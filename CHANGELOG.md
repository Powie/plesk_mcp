# Changelog

## 0.11.0

- Merge the current main branch: retain modular tools, corrected Plesk/WP Toolkit payloads, workflow prompts and API key generation without IP binding.
- Update MCP SDK, Axios, dotenv, Zod, Node types and transitive dependencies. Keep TypeScript 5.9.3 for compatibility with the existing compiler-API tests.
- Require explicit instance selection with multiple servers and no default.
- Activate generated instances immediately, including initial setup without configured servers.
- Use a consistent configuration path with PLESK_ENV_FILE support.
- Verify TLS certificates by default and set 30-second request timeouts. Custom CAs use NODE_EXTRA_CA_CERTS; PLESK_VERIFY_TLS=false remains an explicit test-only opt-out.
- Validate instance names and configuration values before saving.
- Support environment-based credentials in the standalone helper.
- Update English/German READMEs and installation instructions.
- Combine regression and end-to-end tests; make the HTTPS mock setup work on Windows.

Validation: 55 tests passed against local mocks, build passed, npm audit reported zero vulnerabilities. No production Plesk server was contacted.

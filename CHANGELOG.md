# Changelog

## 0.2.0

- Updated dependencies and added Zod directly.
- Replaced invalid argument schemas for all 31 MCP tools.
- Require explicit server selection when multiple instances exist without a default.
- Allow empty startup and activate generated instances immediately.
- Use one configuration path for reading and writing; support PLESK_ENV_FILE.
- Enable TLS verification and 30-second request timeouts.
- Remove embedded administrator credentials from the helper. Previously exposed credentials require rotation; Git history is unchanged.
- Validate instance names before persisting configuration.
- Align package and protocol versions at 0.2.0.
- Add regression coverage for server selection, configuration and MCP schemas.

Validation: build, four local tests and npm audit passed. No live Plesk requests were made. Endpoint compatibility with deployed Plesk and WP Toolkit versions still requires a test server.

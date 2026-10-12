# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report security issues by email to the maintainer listed in `package.json`, or open a [GitHub Security Advisory](https://github.com/stufently/yandex-metrica-mcp/security/advisories/new).

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 7 days.

## Scope

This project is an MCP proxy for the Yandex Metrica API. Most tools only read, but some write. Key security properties:

- **Token isolation**: the OAuth token is only ever sent to `api-metrika.yandex.net` (SSRF guard in `src/client/http.ts`)
- **No persistence**: no database, no file writes, no caching of credentials
- **Writes are limited and marked**: `yandex_metrica_create_counter` and `yandex_metrica_delete_counter` change the account (they need a token with the `metrika:write` scope; deleting a counter is permanent), and the Logs API create/cancel/clean tools manage temporary export jobs. These five tools carry `readOnlyHint: false`; the other eight are read-only. A token with only `metrika:read` keeps counters out of reach
- **Non-root Docker**: container runs as the built-in `node` user

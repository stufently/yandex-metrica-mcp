# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report security issues by email to the maintainer listed in `package.json`, or open a [GitHub Security Advisory](https://github.com/stufently/mcp-yandex-metrica/security/advisories/new).

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact

You will receive a response within 7 days.

## Scope

This project is a read-only MCP proxy for the Yandex Metrica API. Key security properties:

- **Token isolation**: the OAuth token is only ever sent to `api-metrika.yandex.net` (SSRF guard in `src/client/http.ts`)
- **No persistence**: no database, no file writes, no caching of credentials
- **No write access**: no tool modifies Yandex Metrica counter data (Logs API lifecycle operations only manage temporary export jobs)
- **Non-root Docker**: container runs as the built-in `node` user

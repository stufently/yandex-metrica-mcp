# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- **BREAKING (npm package name)** — package renamed from `mcp-yandex-metrica` to the
  scoped `@stufently/mcp-yandex-metrica`. The unscoped name on npm is already taken by
  an unrelated project (maintainer `gistrec`, latest 1.4.1), so publishing under it is
  impossible. In practice nobody is affected: this package has never been published to
  npm, so no install can break. The **GitHub repository, the Docker image name and the
  MCP server name stay `mcp-yandex-metrica`** — only the npm identifier changed.
- README: Docker/GHCR examples now pull `:latest` instead of `:main`.
- README: install section split into Docker / npm / from-source; added copy-paste
  configs for Claude Code, Claude Desktop and Cursor, plus a "Common prompts" section.

### Fixed
- README "Limitations": comparison params were documented as `date1b`/`date2b`; the
  schema actually takes `date1_b`/`date2_b`.

### Added
- `package.json`: `publishConfig.access = "public"` — without it npm refuses to publish
  a scoped package (defaults to restricted, which needs a paid plan).
- `package.json`: `bin` (`mcp-yandex-metrica` → `dist/index.js`) and `files` whitelist,
  so the published tarball ships only `dist` and is runnable via `npx`.
- `package.json`: `prepack` script running the build. `dist/` is gitignored, so without
  it `npm pack`/`npm publish` from a clean checkout produced a tarball containing only
  the four metadata files — no `dist/index.js`, and npm gave no warning about it.
- `src/index.ts`: `#!/usr/bin/env node` shebang, required for the `bin` entry to work.
- CI (`docker.yml`): image now also gets a `latest` tag on the default branch and an
  `X` major tag on version tags. Previously only `main` and `sha-*` were ever pushed,
  because no version tag has been created yet — nothing for users to pin, and a bare
  `docker pull` without a tag failed.

### Security
- CI: third-party actions in `.github/workflows/docker.yml` pinned by commit SHA
  (`docker/setup-buildx-action@8d2750c6` v3.12.0, `docker/login-action@c94ce9fb`
  v3.7.0, `docker/metadata-action@c299e40c` v5.10.0,
  `docker/build-push-action@53b7df96` v7.3.0). `vN` tags are mutable and the job
  carries a GHCR push token. SHAs equal what the tags resolved to on 2026-07-25 —
  build behaviour unchanged. First-party `actions/*` left on `vN`.

### Added
- `yandex_metrica_create_counter` tool — create new counters (add sites) via Management API
- `yandex_metrica_delete_counter` tool — delete counters via Management API
- HTTP client: `postJsonBody` method for POST with JSON body
- HTTP client: `deleteRequest` method for DELETE requests
- Counter schemas: `createCounterSchema`, `deleteCounterSchema`
- Management client: `createCounter`, `deleteCounter` methods

### Fixed
- ESLint: added Node.js/Web globals (`fetch`, `URL`, `AbortController`, `TextDecoder`, etc.) — lint now passes cleanly
- HTTP client: POST requests no longer retried (only GET); prevents duplicate `createLogsRequest` on transient 5xx
- Comparison endpoint: corrected to `/stat/v1/data/comparison` with `date1_a/date2_a/date1_b/date2_b` params
- Comparison response schema: `metrics` is `{ a: number[], b: number[] }` not `number[][]`
- Attribution enums: corrected to `lastsign`, added missing `last_yandex_direct_click`, `cross_device_last_yandex_direct_click`, `automatic`
- Validation: error returned when only one of `date1_b`/`date2_b` is provided
- `include_undefined` now forwarded in comparison mode
- `logRequestPartSchema` used inside `logRequestSchema` (`log_request_parts` validated)
- Error cause propagated in timeout error

### Added
- 5 new integration tests for `getComparison` (endpoint routing, param passing, `{a,b}` format, schema rejection, filters)
- `fixtureComparisonResponse` with correct `metrics: { a, b }` format

## [0.1.0] - 2026-03-15

### Added
- MCP server with stdio transport for Yandex Metrica
- Counter tools: `list_counters`, `get_counter`, `list_goals`
- Reporting API tool: `get_report` with period comparison (`date1b`/`date2b`)
- Logs API tools: `evaluate`, `create`, `list`, `get`, `download_part`, `cancel`, `clean`
- Streaming download with 50KB preview mode and 10MB full mode cap
- SSRF guard: token only sent to `api-metrika.yandex.net`
- Automatic retry with exponential backoff for 429/500/502/503/504 (`Retry-After` respected)
- Runtime zod response validation for all API clients
- Strict TypeScript, ESLint, Prettier
- Vitest unit and integration tests (42 tests, no live API calls)
- Live test scaffolding (opt-in via `LIVE_TESTS=1`)
- Multi-stage Dockerfile (node:24-alpine), runs as non-root
- Docker image published to GHCR on every push to `main`
- GitHub Actions CI and Docker workflows

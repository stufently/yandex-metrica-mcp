# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- Releases now attach `checksums.txt` with SHA256 checksums for every `.mcpb` bundle.
- The MCPB release workflow attests build provenance for every `.mcpb` (`actions/attest-build-provenance`); check one with `gh attestation verify`.
- README: a "Verified clients and platforms" table that separates what was run from what is only documented.
- The Docker image starts without credentials: it ships a placeholder
  `YANDEX_METRICA_TOKEN` (`introspection-placeholder-not-a-key`), so registries such as
  Glama can run `initialize` and `tools/list`. A real `-e YANDEX_METRICA_TOKEN=...`
  overrides it; a tool call with the placeholder fails with "YANDEX_METRICA_TOKEN is not
  set" and sends nothing to Yandex. Outside Docker a missing token still stops startup.
- CI smoke-tests the built image with no token and `--network none`.

### Fixed

- Logs API: the parts of a processed export are now read from `log_request.parts`,
  the field the Logs API actually returns, instead of the non-existent
  `log_request_parts`. The response schema validates `parts` and `size`, the
  `processing_failed` status is part of `LogRequestStatus`, and the README points
  to the right field. Responses were passed through unchanged before, so
  `get_logs_request` output already contained `parts`; only the types, schema,
  fixtures, and the README instruction were wrong.

## [0.2.2] - 2026-10-10

### Added

- `glama.json` in the repository root names the maintainer for the Glama
  directory listing.
- Desktop extension (`.mcpb`) for Claude Desktop. `scripts/build-mcpb.sh` packs it,
  and `.github/workflows/mcpb.yml` attaches the bundle to the GitHub Release of a
  `vX.Y.Z` tag. Nothing is published to npm, PyPI, GHCR, or the MCP registry by that
  workflow.

### Changed

- Every tool description now says when to call the tool (and when to call a neighbor
  instead). Each tool sets `readOnlyHint`, `destructiveHint`, `openWorldHint`, and
  `idempotentHint`.
- README: separate JSON config for Claude Code, Claude Desktop, Cursor, Windsurf, and
  Zed, all on the same Docker command, plus an Example prompts list.

## [0.2.1] - 2026-10-09

### Added

- `server.json` for the official MCP Registry (`io.github.stufently/yandex-metrica-mcp`),
  listing the GHCR image and the npm package, both requiring `YANDEX_METRICA_TOKEN`.
- `package.json`: `mcpName` — the registry only accepts an npm package that names the
  server it belongs to.
- `Dockerfile`: `io.modelcontextprotocol.server.name` label — the registry rejects an OCI
  image without it. Images up to and including `0.2.0` lack it, so `0.2.0` itself cannot be
  listed; `0.2.1` is the first listed version.
- `docker.yml`: `mcp-registry` job. On a `vX.Y.Z` tag, after the image is pushed, it stamps
  the tag version into `server.json` (fails if it differs from `package.json`), logs in with
  GitHub OIDC and runs `mcp-publisher publish` (v1.8.1, checksum-pinned). The npm package is
  published by hand and may lag the tag: if that npm version is missing or has no
  `mcpName`, the job publishes the OCI package alone instead of failing. Pushes to `main`
  do not publish anything to the registry.

### Changed

- README: one install path — the GHCR Docker image — with a no-token smoke test
  (`initialize` + `tools/list`), and copy-paste configs for Claude Code, Codex CLI,
  Claude Desktop, Cursor, Windsurf and Zed. Configs now pass the token through the
  client's `env` block and `docker run -e YANDEX_METRICA_TOKEN` (no value), so it no
  longer sits in the `docker` command line.

## [0.2.0] - 2026-09-18

### Changed

- **BREAKING (project renamed)** — `mcp-yandex-metrica` → `yandex-metrica-mcp`
  everywhere: GitHub repository (`stufently/yandex-metrica-mcp`; GitHub redirects the
  old URL), GHCR image (`ghcr.io/stufently/yandex-metrica-mcp`), `bin` command, MCP
  server name, default User-Agent (`yandex-metrica-mcp/0.2.0`), docker-compose service
  and local image tag (`yandex-metrica-mcp:local`). The npm package is the scoped
  `@stufently/yandex-metrica-mcp`: both unscoped names are taken on npm by unrelated
  projects (`mcp-yandex-metrica` — maintainer `gistrec`; `yandex-metrica-mcp` —
  maintainer `dearonski`). Nothing was ever published to npm under the old name, and
  images already pushed as `ghcr.io/stufently/mcp-yandex-metrica` stay where they are
  but get no new tags — switch to the new image name.
- README: Docker/GHCR examples now pull `:latest` instead of `:main`.
- README: install section split into Docker / npm / from-source; added copy-paste
  configs for Claude Code, Claude Desktop and Cursor, plus a "Common prompts" section.
- Whole repo reformatted with Prettier in one formatting-only commit. 20 files had
  drifted, most of them never touched by recent work. Verified formatting-only by
  compiling before and after: all 31 emitted `.js` files are identical apart from line
  wrapping and trailing commas.

### Removed

- Dead `ReportQuery` interface in `src/types/api.ts`. Nothing imported it — the live
  request shapes are `GetReportParams`/`GetComparisonParams` in `src/client/reporting.ts`.
  It still carried the pre-fix `date1b`/`date2b` field names, which the comparison fix
  had already corrected to `date1_b`/`date2_b` everywhere that runs; its index signature
  (`[key: string]: …`) meant TypeScript would never have flagged the stale names.

### Fixed

- README "Limitations": comparison params were documented as `date1b`/`date2b`; the
  schema actually takes `date1_b`/`date2_b`.

### Added

- `package.json`: `publishConfig.access = "public"` — without it npm refuses to publish
  a scoped package (defaults to restricted, which needs a paid plan).
- `package.json`: `bin` (`yandex-metrica-mcp` → `dist/index.js`) and `files` whitelist,
  so the published tarball ships only `dist` and is runnable via `npx`.
- `package.json`: `prepack` script running the build. `dist/` is gitignored, so without
  it `npm pack`/`npm publish` from a clean checkout produced a tarball containing only
  the four metadata files — no `dist/index.js`, and npm gave no warning about it.
- `src/index.ts`: `#!/usr/bin/env node` shebang, required for the `bin` entry to work.
- CI (`ci.yml`): `Format check` step running `npm run format:check`. The script existed
  but no workflow called it, which is how 20 files drifted out of Prettier style unnoticed.
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

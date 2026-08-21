# Tasks

## Active

### Infrastructure

- [ ] **April 2026**: Upgrade Docker base image and CI to Node 26 LTS once it releases (scheduled April 2026)

### v0.2.0 Candidates

- [ ] Reporting API: drilldown endpoint (`/stat/v1/data/drilldown`)
- [ ] Reporting API: bytime endpoint (`/stat/v1/data/bytime`)
- [ ] Reporting API: pivot table endpoint
- [ ] Logs API: streaming/chunked output for very large parts
- [x] Retry with exponential backoff for 429 and transient 5xx
- [ ] Publish to npm as CLI-installable package
- [ ] Publish Docker image to GHCR on releases

---

## Completed — 2026-03-15 (open source cleanup)

| Task                                                         | Status |
| ------------------------------------------------------------ | ------ |
| Fix tsconfig lib to include DOM types (fetch, URL, Response) | Done   |
| Fix CI: opt into Node.js 24 for GitHub Actions               | Done   |
| Add CONTRIBUTING.md                                          | Done   |
| Add SECURITY.md                                              | Done   |
| Add GitHub issue templates                                   | Done   |
| Update CHANGELOG.md to reflect all changes in 0.1.0          | Done   |

## Completed — 2026-03-15 (security/reliability patch)

| Task                                                             | Status |
| ---------------------------------------------------------------- | ------ |
| Add `retryAfter` field to `YandexApiError`                       | Done   |
| Rewrite `http.ts`: SSRF guard, retry logic, `Retry-After` header | Done   |

## Completed — 2026-03-15 (runtime validation)

| Task                                                                             | Status |
| -------------------------------------------------------------------------------- | ------ |
| Create `src/schemas/responses.ts` with zod schemas and `validateResponse` helper | Done   |
| Update `management.ts` to validate all API responses via zod                     | Done   |
| Update `reporting.ts` to validate all API responses via zod                      | Done   |
| Update `logs.ts` to validate all API responses via zod                           | Done   |

## Completed — 2026-03-15 (initial)

| Task                                                     | Status |
| -------------------------------------------------------- | ------ |
| Project setup (package.json, tsconfig, eslint, prettier) | Done   |
| Core infrastructure (config, types, errors, utils)       | Done   |
| HTTP client layer (http, management, reporting, logs)    | Done   |
| Zod schemas (common, counter, report, logs)              | Done   |
| MCP tools — counter (list, get, goals)                   | Done   |
| MCP tools — reporting (get_report)                       | Done   |
| MCP tools — logs lifecycle (7 tools)                     | Done   |
| Server registration and index.ts                         | Done   |
| Unit tests                                               | Done   |
| Mock integration tests                                   | Done   |
| Live test scaffolding                                    | Done   |
| Dockerfile (multi-stage, node:24-alpine)                 | Done   |
| docker-compose.yml                                       | Done   |
| GitHub Actions CI workflow                               | Done   |
| GitHub Actions Docker workflow (GHCR)                    | Done   |
| README.md with Claude Code setup                         | Done   |

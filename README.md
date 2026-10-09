# yandex-metrica-mcp

Read-only MCP server for the Yandex Metrica Reporting API and Logs API, designed for use with [Claude Code](https://claude.ai/claude-code) and [Codex CLI](https://openai.com/codex).

Runs locally over **stdio**. No web server, no persistent storage, no background daemons.

---

## Why this project exists

Yandex Metrica has two distinct APIs that serve different purposes:

- **Reporting API** (`/stat/v1/data`) — aggregated, sampled statistics. Use this to build reports, query traffic sources, behavior metrics, goal conversions, etc.
- **Logs API** (`/management/v1/counter/{id}/logrequests`) — raw, non-aggregated event export. Use this when you need row-level session or hit data for custom analytics pipelines.

This MCP server exposes both APIs as named tools that an LLM can call directly.

---

## Features

- 13 MCP tools covering counter management, goals, reporting, and full Logs API lifecycle
- Authentication via environment variable only (no interactive OAuth)
- Minimal transformation — responses stay close to the Yandex API format
- Safe download behavior: logs parts default to 50KB preview + metadata
- Strict TypeScript, zod validation, clean error messages
- Multi-stage Docker image (node:24-alpine)
- Unit + mock integration tests, live test scaffolding
- GitHub Actions CI and Docker workflows

---

## Supported MCP Tools

### Counter Management

| Tool                            | Description                       |
| ------------------------------- | --------------------------------- |
| `yandex_metrica_list_counters`  | List accessible counters (tags)   |
| `yandex_metrica_get_counter`    | Get counter details by ID         |
| `yandex_metrica_list_goals`     | List goals for a counter          |
| `yandex_metrica_create_counter` | Create a new counter (add a site) |
| `yandex_metrica_delete_counter` | Delete a counter permanently      |

### Reporting API (aggregated)

| Tool                        | Description               |
| --------------------------- | ------------------------- |
| `yandex_metrica_get_report` | Run a Reporting API query |

> For period comparison, pass `date1_b`/`date2_b` to `yandex_metrica_get_report`. The tool automatically routes to `/stat/v1/data/comparison`; `date1`/`date2` become segment A, `date1_b`/`date2_b` become segment B. Each result row returns `metrics: { a, b }`.

### Logs API (raw export)

| Tool                                   | Description                         |
| -------------------------------------- | ----------------------------------- |
| `yandex_metrica_evaluate_logs_request` | Check if export is possible         |
| `yandex_metrica_create_logs_request`   | Create an async export request      |
| `yandex_metrica_list_logs_requests`    | List all requests for a counter     |
| `yandex_metrica_get_logs_request`      | Poll status of a request            |
| `yandex_metrica_download_logs_part`    | Download a processed part (TSV)     |
| `yandex_metrica_cancel_logs_request`   | Cancel a pending request            |
| `yandex_metrica_clean_logs_request`    | Clean processed files to free quota |

---

## Logs API Workflow

```
evaluate → create → [poll get until status=processed] → download parts → clean
```

The Logs API is asynchronous. After creating a request, poll `yandex_metrica_get_logs_request` until `status = "processed"`, then download each part listed in `log_request_parts`.

---

## Download Behavior

Raw log parts can be hundreds of MB. By default `yandex_metrica_download_logs_part` returns:

```json
{
  "mode": "preview",
  "truncated": true,
  "original_byte_size": 52428800,
  "preview_byte_size": 49980,
  "content": "ym:s:visitID\tym:s:date\t...\n..."
}
```

Set `mode: "full"` to get the entire content — only do this for small parts.

---

## Requirements

- Node.js 24+
- Yandex OAuth token with `metrika:read` scope

### How to get YANDEX_METRICA_TOKEN

1. Go to https://oauth.yandex.com/ → **Create app**
2. Fill in any name, select **For API access**
3. Under **Access** → enable `metrika:read`
4. Click **Create app**, copy the **ClientID**
5. Open in browser (replace `<ClientID>` with yours):
   ```
   https://oauth.yandex.com/authorize?response_type=token&client_id=<ClientID>
   ```
6. Authorize → copy the `access_token` from the URL fragment (`#access_token=...`)

### How to get YANDEX_METRICA_COUNTER_ID

The counter ID is the numeric ID of your Yandex Metrica tag (счётчик):

- Open https://metrika.yandex.ru — the counter ID is shown next to each tag
- Or look at the URL: `metrika.yandex.ru/dashboard?id=**12345678**`
- Or use the tool itself: call `yandex_metrica_list_counters` — it returns all counters with their IDs

> `YANDEX_METRICA_COUNTER_ID` is only needed for live tests (`npm run test:live`), not for normal server operation.

---

## Installation

**One path that works today: Docker.** Nothing to clone, no Node.js. Every MCP client
below starts the server with the same command:

```bash
docker run -i --rm -e YANDEX_METRICA_TOKEN ghcr.io/stufently/yandex-metrica-mcp:latest
```

`-e YANDEX_METRICA_TOKEN` without a value forwards the variable from the client's
environment into the container, so the token lives in the client's `env` block and never
appears in the `docker` command line or `ps` output. The client pulls the image on
first start; `docker pull ghcr.io/stufently/yandex-metrica-mcp:latest` up front just
makes that first start faster.

Smoke test without a real token — the server must answer `initialize` and list 13 tools:

```bash
printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | YANDEX_METRICA_TOKEN=placeholder docker run -i --rm -e YANDEX_METRICA_TOKEN \
    ghcr.io/stufently/yandex-metrica-mcp:latest
```

Image tags on GHCR: `latest` and `main` (every push to `main`), `sha-<short>`, and
`X.Y.Z` / `X.Y` / `X` on version tags. Pin a version tag (`:0.2.1`) for reproducible setups.

### npm (not published yet)

The package is **scoped** — both unscoped names (`yandex-metrica-mcp` and the project's
former name `mcp-yandex-metrica`) belong to unrelated projects on npm — so it ships as
`@stufently/yandex-metrica-mcp` (command `yandex-metrica-mcp`). The first npm release
has not been cut, so `npx -y @stufently/yandex-metrica-mcp` does **not** work today. Use
Docker.

### From source

```bash
git clone https://github.com/stufently/yandex-metrica-mcp.git
cd yandex-metrica-mcp
npm install && npm run build
```

See [Running from a local build](#running-from-a-local-build-instead-of-docker) for the
client config.

---

## Configuration

Copy `.env.example` to `.env` and set your token:

```bash
cp .env.example .env
```

| Variable                    | Required | Default                          | Description                                 |
| --------------------------- | -------- | -------------------------------- | ------------------------------------------- |
| `YANDEX_METRICA_TOKEN`      | **Yes**  | —                                | OAuth token with `metrika:read`             |
| `YANDEX_METRICA_TIMEOUT_MS` | No       | `30000`                          | Request timeout in ms                       |
| `LOG_LEVEL`                 | No       | `info`                           | Log level: debug, info, warn, error, silent |
| `YANDEX_METRICA_USER_AGENT` | No       | `yandex-metrica-mcp/0.2.1`       | Custom User-Agent                           |
| `YANDEX_METRICA_BASE_URL`   | No       | `https://api-metrika.yandex.net` | API base URL (tests only)                   |

---

## Local Development

```bash
# Development with hot reload
YANDEX_METRICA_TOKEN=your_token npm run dev

# Build
npm run build

# Run production build
YANDEX_METRICA_TOKEN=your_token npm start

# Lint
npm run lint

# Type check
npm run typecheck

# Tests (unit + mock integration, no live API calls)
npm test

# Live tests (requires real token and counter ID)
LIVE_TESTS=1 YANDEX_METRICA_TOKEN=your_token YANDEX_METRICA_COUNTER_ID=12345678 npm run test:live

# Format
npm run format
```

---

## Docker

```bash
# Use pre-built image from GHCR (updated on every push to main)
docker run -i --rm \
  -e YANDEX_METRICA_TOKEN=your_token \
  ghcr.io/stufently/yandex-metrica-mcp:latest

# Or build locally
docker build -t yandex-metrica-mcp:local .
docker run -i --rm \
  -e YANDEX_METRICA_TOKEN=your_token \
  yandex-metrica-mcp:local
```

## Docker Compose

```bash
# Create .env with your token first
cp .env.example .env

# Run
docker-compose run --rm yandex-metrica-mcp
```

---

## Client Configuration

All configs below are copy-paste ready and use the Docker command from
[Installation](#installation). Replace `your_oauth_token_here` with your Yandex OAuth
token and nothing else.

### Claude Code

```bash
claude mcp add yandex-metrica \
  -e YANDEX_METRICA_TOKEN=your_oauth_token_here \
  -- docker run -i --rm -e YANDEX_METRICA_TOKEN ghcr.io/stufently/yandex-metrica-mcp:latest
```

Add `--scope user` to make it available in every project, or `--scope project` to write
it to `.mcp.json` in the repo root. Check with `claude mcp list` / `claude mcp get yandex-metrica`.

### Codex CLI

```bash
codex mcp add yandex-metrica \
  --env YANDEX_METRICA_TOKEN=your_oauth_token_here \
  -- docker run -i --rm -e YANDEX_METRICA_TOKEN ghcr.io/stufently/yandex-metrica-mcp:latest
```

Or by hand in `~/.codex/config.toml` (shared by the Codex CLI, IDE extension and desktop app):

```toml
[mcp_servers.yandex-metrica]
command = "docker"
args = ["run", "-i", "--rm", "-e", "YANDEX_METRICA_TOKEN", "ghcr.io/stufently/yandex-metrica-mcp:latest"]
env = { YANDEX_METRICA_TOKEN = "your_oauth_token_here" }
```

### Claude Desktop, Cursor, Windsurf

These three share one `mcpServers` format — only the file differs:

| Client         | Config file                                                                                                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Desktop | `claude_desktop_config.json`: macOS `~/Library/Application Support/Claude/`, Windows `%APPDATA%\Claude\`, Linux `~/.config/Claude/`. Restart the app after saving.                                 |
| Cursor         | `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project)                                                                                                                            |
| Windsurf       | `~/.codeium/windsurf/mcp_config.json`; after the rename to Devin Desktop — `~/.config/devin/mcp_config.json` (Windows `%APPDATA%\devin\mcp_config.json`). Cascade → `...` → _Open MCP config file_ |

```json
{
  "mcpServers": {
    "yandex-metrica": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "YANDEX_METRICA_TOKEN",
        "ghcr.io/stufently/yandex-metrica-mcp:latest"
      ],
      "env": {
        "YANDEX_METRICA_TOKEN": "your_oauth_token_here"
      }
    }
  }
}
```

The same block works in a project-scoped `.mcp.json` for Claude Code.

### Zed

In Zed's `settings.json` (`zed: open settings file`), under `context_servers`:

```json
{
  "context_servers": {
    "yandex-metrica": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "YANDEX_METRICA_TOKEN",
        "ghcr.io/stufently/yandex-metrica-mcp:latest"
      ],
      "env": {
        "YANDEX_METRICA_TOKEN": "your_oauth_token_here"
      }
    }
  }
}
```

### Running from a local build instead of Docker

Works in any client above — swap `command`/`args` for:

```json
{
  "mcpServers": {
    "yandex-metrica": {
      "command": "node",
      "args": ["/absolute/path/to/yandex-metrica-mcp/dist/index.js"],
      "env": {
        "YANDEX_METRICA_TOKEN": "your_oauth_token_here"
      }
    }
  }
}
```

In Claude Code the same thing via CLI:

```bash
claude mcp add yandex-metrica \
  -e YANDEX_METRICA_TOKEN=your_oauth_token_here \
  -- node /absolute/path/to/yandex-metrica-mcp/dist/index.js
```

---

## Common prompts

Once the server is registered, ask in plain language — the client picks the tool.

**List what you have access to** → `yandex_metrica_list_counters`

```
List all my Yandex Metrica counters with their IDs and site names.
```

**Traffic report over a period** → `yandex_metrica_get_report`

```
Show visits, users and bounce rate for counter 12345678 for the last 7 days,
broken down by date.
```

**Top traffic sources** → `yandex_metrica_get_report`

```
What were the top 10 traffic sources for counter 12345678 last month,
by visits and conversion rate?
```

**Compare two periods** → `yandex_metrica_get_report` with `date1_b`/`date2_b`

```
Compare visits and average session duration for counter 12345678
between this month and the same month last year.
```

**Goal conversions** → `yandex_metrica_list_goals` + `yandex_metrica_get_report`

```
List the goals configured on counter 12345678, then show conversions
for each of them over the last 30 days.
```

**Raw event export** → the Logs API chain (`evaluate` → `create` → `get` → `download_part` → `clean`)

```
Export raw visits for counter 12345678 from 2024-01-01 to 2024-01-07 with fields
visitID, date, clientID, startURL, trafficSource. Poll until it is ready,
then show me a preview of the first part.
```

---

## Architecture

```
src/
  index.ts              Entry point, loads config, connects stdio transport
  config/env.ts         Zod-based environment config validation
  server/
    createServer.ts     Creates MCP Server instance
    registerTools.ts    Registers all tools with the server
  tools/                One file per MCP tool
  client/
    http.ts             Fetch-based HTTP client with auth, timeout, error handling
    management.ts       Counters and goals endpoints
    reporting.ts        Reporting API (/stat/v1/data)
    logs.ts             Logs API lifecycle endpoints
  schemas/              Zod schemas for tool input validation
  errors/               YandexApiError + error mapping
  types/api.ts          TypeScript types for Yandex API responses
  utils/
    arrays.ts           Array → comma-separated conversion
    text.ts             Text preview/truncation for large downloads
```

---

## Limitations

- **Mostly read-only** (plus counter create/delete and Logs API lifecycle operations)
- **No comparison report tool** — use `yandex_metrica_get_report` with `date1_b`/`date2_b` params
- **No drilldown/pivot/bytime tools** in v1 — planned for v0.2
- **No caching** — every tool call hits the Yandex API
- **Large log parts** — use `mode: "full"` carefully; defaults to 50KB preview
- Retry with exponential backoff is built-in (3 retries, statuses 429/500/502/503/504)

---

## Testing

```bash
# Unit + mock integration (CI-safe, no real API calls)
npm test

# Live tests (hit real Yandex API)
LIVE_TESTS=1 \
YANDEX_METRICA_TOKEN=your_token \
YANDEX_METRICA_COUNTER_ID=12345678 \
npm run test:live
```

---

## CI / Docker Image

GitHub Actions workflows are in `.github/workflows/`:

- `ci.yml` — lint, typecheck, test, build on every push/PR
- `docker.yml` — build Docker image; push to GHCR on pushes to `main` and version tags;
  on a `vX.Y.Z` tag, also publish `server.json` to the
  [official MCP Registry](https://registry.modelcontextprotocol.io) as
  `io.github.stufently/yandex-metrica-mcp` (GitHub OIDC, no stored secret)

Image tags produced by `docker.yml`:

| Tag                 | When                                       |
| ------------------- | ------------------------------------------ |
| `latest`            | every push to `main`                       |
| `main`              | every push to `main`                       |
| `sha-<short>`       | every push to `main` and every version tag |
| `X.Y.Z`, `X.Y`, `X` | pushing a `vX.Y.Z` git tag                 |

`REGISTRY` and `IMAGE_NAME` default to `ghcr.io` and `${{ github.repository }}`.

---

## Security

- Token is passed via environment variable only — never hardcoded
- Token never appears in logs
- Counter create/delete requires `metrika:write` scope; all other tools use read-only access
- Docker image runs as non-root (`node` user)

---

## License

MIT — see [LICENSE](./LICENSE)

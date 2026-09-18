# Contributing

Contributions are welcome. Please follow these guidelines.

## Setup

```bash
git clone https://github.com/stufently/yandex-metrica-mcp.git
cd yandex-metrica-mcp
npm install
cp .env.example .env   # add your YANDEX_METRICA_TOKEN
```

## Development

```bash
npm run dev          # run with tsx watch (hot reload)
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run format       # Prettier
npm test             # unit + mock integration tests (no API calls)
```

## Running tests

Unit and integration tests use mocked fetch — no real token needed:

```bash
npm test
```

Live tests hit the real Yandex API:

```bash
LIVE_TESTS=1 YANDEX_METRICA_TOKEN=... YANDEX_METRICA_COUNTER_ID=... npm run test:live
```

## Pull Requests

- Keep PRs focused — one feature or fix per PR
- Add or update tests for changed behavior
- Run `npm run typecheck && npm run lint && npm test` before submitting
- Update `CHANGELOG.md` under `[Unreleased]`

## Adding a new tool

1. Add input schema to `src/schemas/`
2. Add tool handler to `src/tools/`
3. Register it in `src/server/registerTools.ts`
4. Add integration test in `tests/integration/`

## Code style

- TypeScript strict mode — no `any`, no non-null assertions without comment
- Zod schemas for all external inputs and API responses
- Errors bubble up as `YandexApiError` or plain `Error`; never swallowed silently

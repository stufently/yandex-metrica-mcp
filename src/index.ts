#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config/env.js";
import { createServer } from "./server/createServer.js";

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[yandex-metrica-mcp] Startup failed: ${message}\n`);
    process.exit(1);
  }

  const server = createServer(config);
  const transport = new StdioServerTransport();

  process.stderr.write("[yandex-metrica-mcp] Starting server...\n");

  await server.connect(transport);

  process.stderr.write("[yandex-metrica-mcp] Server running on stdio\n");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[yandex-metrica-mcp] Fatal error: ${message}\n`);
  process.exit(1);
});

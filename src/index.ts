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
    process.stderr.write(`[mcp-yandex-metrica] Startup failed: ${message}\n`);
    process.exit(1);
  }

  const server = createServer(config);
  const transport = new StdioServerTransport();

  process.stderr.write("[mcp-yandex-metrica] Starting server...\n");

  await server.connect(transport);

  process.stderr.write("[mcp-yandex-metrica] Server running on stdio\n");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`[mcp-yandex-metrica] Fatal error: ${message}\n`);
  process.exit(1);
});

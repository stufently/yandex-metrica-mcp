import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { registerAllTools } from "./registerTools.js";

export function createServer(config: Config): McpServer {
  const server = new McpServer(
    {
      name: "yandex-metrica-mcp",
      version: "0.2.2",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  registerAllTools(server, config);

  return server;
}

import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { listLogsRequestsSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { mapError } from "../errors/mapError.js";

export function registerListLogsRequests(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_list_logs_requests",
    {
      description:
        "List every Logs API export request on a Yandex Metrica counter, in any status from created through cleaned. " +
        "Use when the user wants to see existing exports or find a request id. " +
        "Do not use this to poll a single request; call yandex_metrica_get_logs_request with that request id.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: listLogsRequestsSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.listLogsRequests(args.counter_id);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

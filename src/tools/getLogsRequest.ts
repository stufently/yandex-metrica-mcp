import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { getLogsRequestSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { mapError } from "../errors/mapError.js";

export function registerGetLogsRequest(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_get_logs_request",
    {
      description:
        "Get the status and prepared parts of one Yandex Metrica Logs API export request. " +
        "Use when the user is waiting for a created export to reach processed before downloading it. " +
        "Do not use this to fetch the TSV rows; call yandex_metrica_download_logs_part once the status is processed. " +
        "Do not use it to list every request; call yandex_metrica_list_logs_requests.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: getLogsRequestSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.getLogsRequest({
          counter_id: args.counter_id,
          request_id: args.request_id,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { cancelLogsRequestSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { mapError } from "../errors/mapError.js";

export function registerCancelLogsRequest(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_cancel_logs_request",
    {
      description:
        "Cancel a Yandex Metrica Logs API export that is still pending, in status created or awaiting_retry. " +
        "Use when the user wants to stop an export that has not been processed yet. " +
        "Do not use this on a processed request; call yandex_metrica_clean_logs_request to delete the prepared files.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: cancelLogsRequestSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.cancelLogsRequest({
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

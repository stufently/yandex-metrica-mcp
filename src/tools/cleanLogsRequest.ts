import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { cleanLogsRequestSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { mapError } from "../errors/mapError.js";

export function registerCleanLogsRequest(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_clean_logs_request",
    {
      description:
        "Delete the prepared files of a processed Yandex Metrica Logs API export and free the export quota. " +
        "Use when the user has finished downloading and the request status is processed. " +
        "Do not use this to stop a request that is still pending; call yandex_metrica_cancel_logs_request instead.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: cleanLogsRequestSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.cleanLogsRequest({
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

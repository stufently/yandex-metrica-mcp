import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { evaluateLogsRequestSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { toCommaSeparated } from "../utils/arrays.js";
import { mapError } from "../errors/mapError.js";

export function registerEvaluateLogsRequest(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_evaluate_logs_request",
    {
      description:
        "Check whether a Yandex Metrica Logs API export can be created for the given dates, source, and fields, without creating a request. " +
        "Use when the user wants to know if a raw export is possible and how many days fit the quota. " +
        "Do not use this to start the export; call yandex_metrica_create_logs_request after the check succeeds.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: evaluateLogsRequestSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.evaluateLogsRequest({
          counter_id: args.counter_id,
          date1: args.date1,
          date2: args.date2,
          source: args.source,
          fields: toCommaSeparated(args.fields) ?? "",
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

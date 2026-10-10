import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { createLogsRequestSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { toCommaSeparated } from "../utils/arrays.js";
import { mapError } from "../errors/mapError.js";

export function registerCreateLogsRequest(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_create_logs_request",
    {
      description:
        "Create an asynchronous Yandex Metrica Logs API export of raw visits or hits for one counter and date range. " +
        "Use when the user wants row-level data and yandex_metrica_evaluate_logs_request has shown the export is possible. " +
        "Do not use this only to test feasibility, and do not use it for aggregated totals; call yandex_metrica_get_report for those. " +
        "Poll yandex_metrica_get_logs_request until the status is processed. date2 cannot be today. " +
        "Fields use the ym:s: prefix for visits and ym:pv: for hits.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
      inputSchema: createLogsRequestSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const result = await client.createLogsRequest({
          counter_id: args.counter_id,
          date1: args.date1,
          date2: args.date2,
          source: args.source,
          fields: toCommaSeparated(args.fields) ?? "",
          attribution: args.attribution,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

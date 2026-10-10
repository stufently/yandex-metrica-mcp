import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { getReportSchema } from "../schemas/report.js";
import { createReportingClient } from "../client/reporting.js";
import { toCommaSeparated } from "../utils/arrays.js";
import { mapError } from "../errors/mapError.js";

export function registerGetReport(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_get_report",
    {
      description:
        "Run a Yandex Metrica Reporting API query and return aggregated statistics such as visits, users, bounce rate, and traffic sources. " +
        "Use when the user wants a summary, a breakdown, or a comparison of two periods via date1_b and date2_b. " +
        "Do not use this for row-level visits or pageviews; call yandex_metrica_evaluate_logs_request and the other Logs API tools. " +
        "Metrics use the ym:s: prefix for visits and ym:pv: for hits.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: getReportSchema.shape,
    },
    async (args) => {
      try {
        const client = createReportingClient(config);
        const ids = args.counter_ids.join(",");
        const metrics = args.metrics.join(",");
        const dimensions = toCommaSeparated(args.dimensions);
        const sort = toCommaSeparated(args.sort);

        // Route to comparison endpoint when segment B dates are provided
        if (args.date1_b || args.date2_b) {
          if (!args.date1_b || !args.date2_b) {
            return {
              isError: true as const,
              content: [
                {
                  type: "text" as const,
                  text: "Both date1_b and date2_b must be provided together for period comparison.",
                },
              ],
            };
          }
          const result = await client.getComparison({
            ids,
            metrics,
            dimensions,
            date1_a: args.date1,
            date2_a: args.date2,
            date1_b: args.date1_b,
            date2_b: args.date2_b,
            filters: args.filters,
            filters_a: args.filters_a,
            filters_b: args.filters_b,
            sort,
            limit: args.limit,
            offset: args.offset,
            accuracy: args.accuracy,
            include_undefined: args.include_undefined,
            lang: args.lang,
            preset: args.preset,
          });
          return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
        }

        const result = await client.getReport({
          ids,
          metrics,
          dimensions,
          date1: args.date1,
          date2: args.date2,
          filters: args.filters,
          sort,
          limit: args.limit,
          offset: args.offset,
          accuracy: args.accuracy,
          currency: args.currency,
          attribution: args.attribution,
          lang: args.lang,
          include_undefined: args.include_undefined,
          preset: args.preset,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

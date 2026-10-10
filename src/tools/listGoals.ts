import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { listGoalsSchema } from "../schemas/counter.js";
import { createManagementClient } from "../client/management.js";
import { mapError } from "../errors/mapError.js";

export function registerListGoals(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_list_goals",
    {
      description:
        "List conversion goals configured on one Yandex Metrica counter, including each goal id and type. " +
        "Use when the user asks which goals exist on a counter before building a report. " +
        "Do not use this for conversion counts or rates; call yandex_metrica_get_report with the goal metrics.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: listGoalsSchema.shape,
    },
    async (args) => {
      try {
        const client = createManagementClient(config);
        const result = await client.listGoals({ counter_id: args.counter_id });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

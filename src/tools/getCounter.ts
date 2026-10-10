import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { getCounterSchema } from "../schemas/counter.js";
import { createManagementClient } from "../client/management.js";
import { mapError } from "../errors/mapError.js";

export function registerGetCounter(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_get_counter",
    {
      description:
        "Get one Yandex Metrica counter by id, including its settings, status, owner, timezone, and site. " +
        "Use when the user already has a counter id and wants that counter's configuration. " +
        "Do not use this to discover unknown ids; call yandex_metrica_list_counters instead.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: getCounterSchema.shape,
    },
    async (args) => {
      try {
        const client = createManagementClient(config);
        const result = await client.getCounter({ counter_id: args.counter_id });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

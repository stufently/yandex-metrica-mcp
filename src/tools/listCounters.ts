import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { listCountersSchema } from "../schemas/counter.js";
import { createManagementClient } from "../client/management.js";
import { mapError } from "../errors/mapError.js";

export function registerListCounters(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_list_counters",
    {
      description:
        "List Yandex Metrica counters the configured token can access, with each counter id, name, and site. " +
        "Use when the user needs a counter id before any other query. " +
        "Do not use this to read one counter's settings; call yandex_metrica_get_counter once the id is known.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: listCountersSchema.shape,
    },
    async (args) => {
      try {
        const client = createManagementClient(config);
        const result = await client.listCounters({
          page: args.page,
          per_page: args.per_page,
          status: args.status,
          type: args.type,
          search: args.search,
          sort: args.sort,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

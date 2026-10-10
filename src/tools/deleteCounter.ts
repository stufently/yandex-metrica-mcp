import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { deleteCounterSchema } from "../schemas/counter.js";
import { createManagementClient } from "../client/management.js";
import { mapError } from "../errors/mapError.js";

export function registerDeleteCounter(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_delete_counter",
    {
      description:
        "Permanently delete one Yandex Metrica counter and all data stored on it. " +
        "Use when the user explicitly asks to remove a counter and accepts that the deletion cannot be undone. " +
        "Do not use this to inspect a counter; call yandex_metrica_get_counter instead.",
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: deleteCounterSchema.shape,
    },
    async (args) => {
      try {
        const client = createManagementClient(config);
        await client.deleteCounter({ counter_id: args.counter_id });
        return {
          content: [
            {
              type: "text" as const,
              text: `Counter ${args.counter_id} deleted successfully.`,
            },
          ],
        };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

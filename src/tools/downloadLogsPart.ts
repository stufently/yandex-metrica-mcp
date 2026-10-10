import { type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../config/env.js";
import { downloadLogsPartSchema } from "../schemas/logs.js";
import { createLogsClient } from "../client/logs.js";
import { mapError } from "../errors/mapError.js";

const PREVIEW_LIMIT = 50_000; // 50 KB
const FULL_LIMIT = 10 * 1024 * 1024; // 10 MB hard cap for "full" mode

/**
 * Reads up to `limitBytes` from a ReadableStream<Uint8Array>.
 * Returns the collected bytes and whether the stream had more data.
 */
async function readStreamCapped(
  body: ReadableStream<Uint8Array>,
  limitBytes: number,
): Promise<{ bytes: Uint8Array; truncated: boolean; total_read: number }> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let totalRead = 0;
  let truncated = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const remaining = limitBytes - totalRead;
      if (value.byteLength <= remaining) {
        chunks.push(value);
        totalRead += value.byteLength;
      } else {
        chunks.push(value.slice(0, remaining));
        totalRead += remaining;
        truncated = true;
        break;
      }
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  // Merge chunks
  const merged = new Uint8Array(totalRead);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { bytes: merged, truncated, total_read: totalRead };
}

export function registerDownloadLogsPart(server: McpServer, config: Config): void {
  server.registerTool(
    "yandex_metrica_download_logs_part",
    {
      description:
        "Download one processed part of a Yandex Metrica Logs API export as TSV text. " +
        "Use when the user wants the rows of a request whose status is already processed. " +
        "Do not use this to check whether the export is ready; call yandex_metrica_get_logs_request first. " +
        "Preview mode returns about the first 50KB; full mode is only for small parts under 10MB. " +
        "Part numbers come from the parts list returned by yandex_metrica_get_logs_request and start at 0.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
      inputSchema: downloadLogsPartSchema.shape,
    },
    async (args) => {
      try {
        const client = createLogsClient(config);
        const response = await client.downloadLogsPart({
          counter_id: args.counter_id,
          request_id: args.request_id,
          part_number: args.part_number,
        });

        if (!response.body) {
          throw new Error("Response body is empty or streaming not supported");
        }

        const decoder = new TextDecoder("utf-8", { fatal: false });
        const limit = args.mode === "full" ? FULL_LIMIT : PREVIEW_LIMIT;
        const { bytes, truncated, total_read } = await readStreamCapped(response.body, limit);

        if (args.mode === "full" && truncated) {
          return {
            isError: true as const,
            content: [
              {
                type: "text" as const,
                text:
                  `Part exceeds the 10MB limit for full mode (read ${total_read} bytes before stopping). ` +
                  `Use mode='preview' to safely inspect the first 50KB, or process this part outside the MCP server.`,
              },
            ],
          };
        }

        let text = decoder.decode(bytes);

        if (args.mode === "preview" && truncated) {
          // Trim to last complete line to avoid mid-row cut
          const lastNewline = text.lastIndexOf("\n");
          if (lastNewline > 0) text = text.slice(0, lastNewline + 1);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  mode: args.mode,
                  truncated,
                  bytes_read: total_read,
                  content: text,
                },
                null,
                2,
              ),
            },
          ],
        };
      } catch (error) {
        return mapError(error);
      }
    },
  );
}

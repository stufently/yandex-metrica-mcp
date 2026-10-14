import { readFileSync } from "node:fs";
import { describe, it, expect, vi, afterEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadConfig, PLACEHOLDER_TOKEN } from "../../src/config/env.js";
import { createHttpClient } from "../../src/client/http.js";
import { createManagementClient } from "../../src/client/management.js";
import { registerListCounters } from "../../src/tools/listCounters.js";

describe("introspection placeholder token", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("matches the value the Dockerfile ships", () => {
    const dockerfile = readFileSync(new URL("../../Dockerfile", import.meta.url), "utf8");
    expect(dockerfile).toContain(`ENV YANDEX_METRICA_TOKEN=${PLACEHOLDER_TOKEN}\n`);
  });

  it("lets the config load so the server can start", () => {
    const config = loadConfig({ YANDEX_METRICA_TOKEN: PLACEHOLDER_TOKEN });
    expect(config.YANDEX_METRICA_TOKEN).toBe(PLACEHOLDER_TOKEN);
  });

  it("refuses API calls without sending the placeholder anywhere", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const config = loadConfig({ YANDEX_METRICA_TOKEN: PLACEHOLDER_TOKEN });

    expect(() => createHttpClient(config)).toThrow(/YANDEX_METRICA_TOKEN is not set/);
    expect(() => createManagementClient(config)).toThrow(/YANDEX_METRICA_TOKEN is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("turns a tool call into a readable tool error", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const server = new McpServer({ name: "t", version: "0" });
    const spy = vi.spyOn(server, "registerTool");
    registerListCounters(server, loadConfig({ YANDEX_METRICA_TOKEN: PLACEHOLDER_TOKEN }));

    const handler = spy.mock.calls[0]?.[2] as (args: object) => Promise<{
      isError?: boolean;
      content: Array<{ text: string }>;
    }>;
    const result = await handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toMatch(/YANDEX_METRICA_TOKEN is not set/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still builds a client for a real token", () => {
    expect(() => createHttpClient(loadConfig({ YANDEX_METRICA_TOKEN: "real" }))).not.toThrow();
  });
});

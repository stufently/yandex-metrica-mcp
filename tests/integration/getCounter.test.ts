import { describe, it, expect, vi, afterEach } from "vitest";
import { createManagementClient } from "../../src/client/management.js";
import { loadConfig } from "../../src/config/env.js";
import {
  fixtureCounterResponse,
  fixtureGoalsResponse,
  FIXTURE_COUNTER_ID,
} from "../fixtures/index.js";

const testConfig = () => loadConfig({ YANDEX_METRICA_TOKEN: "test_token" });

describe("getCounter (mocked)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls correct endpoint and returns counter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(fixtureCounterResponse),
      }),
    );
    const client = createManagementClient(testConfig());
    const result = await client.getCounter({ counter_id: FIXTURE_COUNTER_ID });
    expect(result.counter.id).toBe(FIXTURE_COUNTER_ID);
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain(`/counter/${FIXTURE_COUNTER_ID}`);
  });

  it("returns 404 error for unknown counter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: async () => JSON.stringify({ message: "Counter not found" }),
      }),
    );
    const client = createManagementClient(testConfig());
    await expect(client.getCounter({ counter_id: 9999 })).rejects.toMatchObject({ status: 404 });
  });
});

describe("listGoals (mocked)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls goals endpoint and returns goals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify(fixtureGoalsResponse),
      }),
    );
    const client = createManagementClient(testConfig());
    const result = await client.listGoals({ counter_id: FIXTURE_COUNTER_ID });
    expect(result.goals).toHaveLength(2);
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain(`/counter/${FIXTURE_COUNTER_ID}/goals`);
  });
});

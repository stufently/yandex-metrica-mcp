import { describe, it, expect, vi, afterEach } from "vitest";
import { createLogsClient } from "../../src/client/logs.js";
import { loadConfig } from "../../src/config/env.js";
import {
  fixtureEvaluationResponse,
  fixtureLogRequestResponse,
  fixtureLogRequestsResponse,
  fixtureTsvContent,
  FIXTURE_COUNTER_ID,
  FIXTURE_REQUEST_ID,
} from "../fixtures/index.js";

const testConfig = () =>
  loadConfig({
    YANDEX_METRICA_TOKEN: "test_token",
    YANDEX_METRICA_BASE_URL: "https://api-metrika.yandex.net",
  });

function mockFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      statusText: ok ? "OK" : "Error",
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    }),
  );
}

describe("Logs API lifecycle (mocked)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("evaluateLogsRequest calls evaluate endpoint", async () => {
    mockFetch(fixtureEvaluationResponse);
    const client = createLogsClient(testConfig());
    const result = await client.evaluateLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      date1: "2024-01-01",
      date2: "2024-01-07",
      source: "visits",
      fields: "ym:s:visitID,ym:s:date",
    });
    expect(result.log_request_evaluation.possible).toBe(true);
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("logrequests/evaluate");
  });

  it("createLogsRequest calls POST on logrequests", async () => {
    mockFetch(fixtureLogRequestResponse);
    const client = createLogsClient(testConfig());
    const result = await client.createLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      date1: "2024-01-01",
      date2: "2024-01-07",
      source: "visits",
      fields: "ym:s:visitID,ym:s:date,ym:s:clientID",
    });
    expect(result.log_request.request_id).toBe(FIXTURE_REQUEST_ID);
    const call = vi.mocked(fetch).mock.calls[0];
    expect((call?.[1] as RequestInit)?.method).toBe("POST");
    expect(call?.[0] as string).toContain(`/logrequests`);
  });

  it("listLogsRequests returns requests array", async () => {
    mockFetch(fixtureLogRequestsResponse);
    const client = createLogsClient(testConfig());
    const result = await client.listLogsRequests(FIXTURE_COUNTER_ID);
    expect(result.requests).toHaveLength(1);
    expect(result.requests[0]?.request_id).toBe(FIXTURE_REQUEST_ID);
  });

  it("getLogsRequest calls singular logrequest endpoint", async () => {
    mockFetch(fixtureLogRequestResponse);
    const client = createLogsClient(testConfig());
    const result = await client.getLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      request_id: FIXTURE_REQUEST_ID,
    });
    expect(result.log_request.status).toBe("processed");
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain(`/logrequest/${FIXTURE_REQUEST_ID}`);
  });

  it("downloadLogsPart calls part download endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: "OK",
        text: async () => fixtureTsvContent,
      }),
    );
    const client = createLogsClient(testConfig());
    const response = await client.downloadLogsPart({
      counter_id: FIXTURE_COUNTER_ID,
      request_id: FIXTURE_REQUEST_ID,
      part_number: 0,
    });
    const text = await response.text();
    expect(text).toContain("ym:s:visitID");
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("/part/0/download");
  });

  it("cancelLogsRequest POSTs to cancel endpoint", async () => {
    const cancelledRequest = {
      ...fixtureLogRequestResponse.log_request,
      status: "canceled" as const,
    };
    mockFetch({ log_request: cancelledRequest });
    const client = createLogsClient(testConfig());
    const result = await client.cancelLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      request_id: FIXTURE_REQUEST_ID,
    });
    expect(result.log_request.status).toBe("canceled");
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("/cancel");
  });

  it("cleanLogsRequest POSTs to clean endpoint", async () => {
    const cleanedRequest = {
      ...fixtureLogRequestResponse.log_request,
      status: "cleaned_by_user" as const,
    };
    mockFetch({ log_request: cleanedRequest });
    const client = createLogsClient(testConfig());
    const result = await client.cleanLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      request_id: FIXTURE_REQUEST_ID,
    });
    expect(result.log_request.status).toBe("cleaned_by_user");
    const url = vi.mocked(fetch).mock.calls[0]?.[0] as string;
    expect(url).toContain("/clean");
  });
});

describe("Logs API log_request.parts (documented response shape)", () => {
  afterEach(() => vi.unstubAllGlobals());

  const getRequest = (logRequest: Record<string, unknown>) => {
    mockFetch({ log_request: logRequest });
    return createLogsClient(testConfig()).getLogsRequest({
      counter_id: FIXTURE_COUNTER_ID,
      request_id: FIXTURE_REQUEST_ID,
    });
  };

  it("returns every part from log_request.parts with part_number and size", async () => {
    const result = await getRequest({
      ...fixtureLogRequestResponse.log_request,
      size: 3072,
      parts: [
        { part_number: 0, size: 2048 },
        { part_number: 1, size: 1024 },
      ],
    });
    expect(result.log_request.parts).toEqual([
      { part_number: 0, size: 2048 },
      { part_number: 1, size: 1024 },
    ]);
    expect(result.log_request.size).toBe(3072);
  });

  it("accepts a request that has no parts yet", async () => {
    const created: Record<string, unknown> = {
      ...fixtureLogRequestResponse.log_request,
      status: "created",
    };
    delete created.parts;
    delete created.size;
    const result = await getRequest(created);
    expect(result.log_request.status).toBe("created");
    expect(result.log_request.parts).toBeUndefined();
  });

  it("rejects parts whose part_number is not a number", async () => {
    await expect(
      getRequest({
        ...fixtureLogRequestResponse.log_request,
        parts: [{ part_number: "0", size: 1024 }],
      }),
    ).rejects.toThrow(/log_request\.parts\.0\.part_number/);
  });

  it("rejects parts without a size", async () => {
    await expect(
      getRequest({
        ...fixtureLogRequestResponse.log_request,
        parts: [{ part_number: 0 }],
      }),
    ).rejects.toThrow(/log_request\.parts\.0\.size/);
  });

  it("rejects parts that are not an array", async () => {
    await expect(
      getRequest({ ...fixtureLogRequestResponse.log_request, parts: { part_number: 0 } }),
    ).rejects.toThrow(/log_request\.parts/);
  });

  it("rejects a non-numeric request size", async () => {
    await expect(
      getRequest({ ...fixtureLogRequestResponse.log_request, size: "1024" }),
    ).rejects.toThrow(/log_request\.size/);
  });

  it("validates parts inside listLogsRequests too", async () => {
    mockFetch({
      requests: [
        { ...fixtureLogRequestResponse.log_request, parts: [{ part_number: 0, size: "x" }] },
      ],
    });
    await expect(
      createLogsClient(testConfig()).listLogsRequests(FIXTURE_COUNTER_ID),
    ).rejects.toThrow(/requests\.0\.parts\.0\.size/);
  });
});

import { describe, it, expect } from "vitest";
import { loadConfig } from "../../src/config/env.js";

describe("loadConfig", () => {
  it("loads valid config with required fields", () => {
    const config = loadConfig({ YANDEX_METRICA_TOKEN: "test_token_123" });
    expect(config.YANDEX_METRICA_TOKEN).toBe("test_token_123");
    expect(config.YANDEX_METRICA_BASE_URL).toBe("https://api-metrika.yandex.net");
    expect(config.YANDEX_METRICA_TIMEOUT_MS).toBe(30000);
    expect(config.LOG_LEVEL).toBe("info");
  });

  it("throws when YANDEX_METRICA_TOKEN is missing", () => {
    expect(() => loadConfig({})).toThrow(/YANDEX_METRICA_TOKEN/);
  });

  it("throws when YANDEX_METRICA_TOKEN is empty string", () => {
    expect(() => loadConfig({ YANDEX_METRICA_TOKEN: "" })).toThrow();
  });

  it("applies custom timeout", () => {
    const config = loadConfig({
      YANDEX_METRICA_TOKEN: "tok",
      YANDEX_METRICA_TIMEOUT_MS: "5000",
    });
    expect(config.YANDEX_METRICA_TIMEOUT_MS).toBe(5000);
  });

  it("validates base URL format", () => {
    expect(() =>
      loadConfig({ YANDEX_METRICA_TOKEN: "tok", YANDEX_METRICA_BASE_URL: "not-a-url" }),
    ).toThrow();
  });

  it("accepts custom base URL", () => {
    const config = loadConfig({
      YANDEX_METRICA_TOKEN: "tok",
      YANDEX_METRICA_BASE_URL: "http://localhost:9999",
    });
    expect(config.YANDEX_METRICA_BASE_URL).toBe("http://localhost:9999");
  });

  it("applies custom log level", () => {
    const config = loadConfig({ YANDEX_METRICA_TOKEN: "tok", LOG_LEVEL: "debug" });
    expect(config.LOG_LEVEL).toBe("debug");
  });

  it("rejects invalid log level", () => {
    expect(() => loadConfig({ YANDEX_METRICA_TOKEN: "tok", LOG_LEVEL: "verbose" })).toThrow();
  });
});

import { YandexApiError } from "../errors/apiError.js";
import { buildSearchParams } from "../utils/arrays.js";
import type { Config } from "../config/env.js";

export type Params = Record<string, string | number | boolean | undefined>;

const YANDEX_API_HOST = "api-metrika.yandex.net";

// Retryable HTTP status codes
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30_000;

interface YandexErrorBody {
  message?: string;
  code?: string;
  errors?: Array<{ error_type?: string; message?: string }>;
}

async function parseErrorBody(response: Response): Promise<YandexErrorBody> {
  try {
    const text = await response.text();
    return JSON.parse(text) as YandexErrorBody;
  } catch {
    return {};
  }
}

function buildErrorMessage(body: YandexErrorBody, fallback: string): string {
  if (body.message) return body.message;
  if (body.errors && body.errors.length > 0) {
    return body.errors.map((e) => e.message ?? e.error_type ?? "unknown").join("; ");
  }
  return fallback;
}

function parseRetryAfter(response: Response): number | undefined {
  try {
    const header = response.headers?.get("Retry-After");
    if (!header) return undefined;
    const seconds = parseInt(header, 10);
    return isNaN(seconds) ? undefined : seconds * 1000;
  } catch {
    return undefined;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  const jitter = Math.random() * 200;
  return Math.min(BASE_DELAY_MS * Math.pow(2, attempt) + jitter, MAX_DELAY_MS);
}

/**
 * Guards against SSRF: ensures the auth token is only sent to the official Yandex API host.
 * In test environments (NODE_ENV=test), this check is skipped to allow mock servers.
 */
function assertSafeHost(url: URL): void {
  if (process.env["NODE_ENV"] === "test") return;
  if (url.hostname !== YANDEX_API_HOST) {
    throw new Error(
      `Authorization blocked: refusing to send token to non-Yandex host '${url.hostname}'. ` +
        `YANDEX_METRICA_BASE_URL must point to ${YANDEX_API_HOST}.`,
    );
  }
}

export function createHttpClient(config: Config) {
  const baseHeaders: Record<string, string> = {
    Authorization: `OAuth ${config.YANDEX_METRICA_TOKEN}`,
    "User-Agent": config.YANDEX_METRICA_USER_AGENT,
    Accept: "application/json",
  };

  async function attemptRequest(method: "GET" | "POST", url: URL): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.YANDEX_METRICA_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: baseHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await parseErrorBody(response);
        const message = buildErrorMessage(body, `HTTP ${response.status} ${response.statusText}`);
        const retryAfter = parseRetryAfter(response);
        throw new YandexApiError(response.status, body.code, message, body.errors, retryAfter);
      }

      return response;
    } catch (err) {
      if (err instanceof YandexApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${config.YANDEX_METRICA_TIMEOUT_MS}ms`, {
          cause: err,
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function request(method: "GET" | "POST", path: string, params?: Params): Promise<Response> {
    const url = new URL(path, config.YANDEX_METRICA_BASE_URL);
    assertSafeHost(url);

    if (params) {
      const sp = buildSearchParams(params);
      sp.forEach((value, key) => url.searchParams.set(key, value));
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await attemptRequest(method, url);
      } catch (err) {
        lastError = err;

        // Only retry GET requests — POST may not be idempotent (e.g. createLogsRequest)
        if (
          method === "GET" &&
          err instanceof YandexApiError &&
          RETRYABLE_STATUSES.has(err.status)
        ) {
          if (attempt < MAX_RETRIES) {
            const delay = err.retryAfter ?? backoffDelay(attempt);
            await sleep(delay);
            continue;
          }
        }

        // Non-retryable or max retries reached
        throw err;
      }
    }

    throw lastError;
  }

  async function getJson<T>(path: string, params?: Params): Promise<T> {
    const response = await request("GET", path, params);
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}`);
    }
  }

  async function postJson<T>(path: string, params?: Params): Promise<T> {
    const response = await request("POST", path, params);
    const text = await response.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}`);
    }
  }

  async function postJsonBody<T>(path: string, body: unknown, params?: Params): Promise<T> {
    const url = new URL(path, config.YANDEX_METRICA_BASE_URL);
    assertSafeHost(url);

    if (params) {
      const sp = buildSearchParams(params);
      sp.forEach((value, key) => url.searchParams.set(key, value));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.YANDEX_METRICA_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          ...baseHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await parseErrorBody(response);
        const message = buildErrorMessage(
          errBody,
          `HTTP ${response.status} ${response.statusText}`,
        );
        const retryAfter = parseRetryAfter(response);
        throw new YandexApiError(
          response.status,
          errBody.code,
          message,
          errBody.errors,
          retryAfter,
        );
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(`Failed to parse JSON response: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      if (err instanceof YandexApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${config.YANDEX_METRICA_TIMEOUT_MS}ms`, {
          cause: err,
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function deleteRequest(path: string): Promise<void> {
    const url = new URL(path, config.YANDEX_METRICA_BASE_URL);
    assertSafeHost(url);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.YANDEX_METRICA_TIMEOUT_MS);

    try {
      const response = await fetch(url.toString(), {
        method: "DELETE",
        headers: baseHeaders,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errBody = await parseErrorBody(response);
        const message = buildErrorMessage(
          errBody,
          `HTTP ${response.status} ${response.statusText}`,
        );
        const retryAfter = parseRetryAfter(response);
        throw new YandexApiError(
          response.status,
          errBody.code,
          message,
          errBody.errors,
          retryAfter,
        );
      }
    } catch (err) {
      if (err instanceof YandexApiError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(`Request timed out after ${config.YANDEX_METRICA_TIMEOUT_MS}ms`, {
          cause: err,
        });
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function getRaw(path: string, params?: Params): Promise<Response> {
    return request("GET", path, params);
  }

  return { getJson, postJson, postJsonBody, deleteRequest, getRaw };
}

export type HttpClient = ReturnType<typeof createHttpClient>;

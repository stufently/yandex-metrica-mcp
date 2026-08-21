import { YandexApiError } from "./apiError.js";

export interface McpToolError {
  [x: string]: unknown;
  isError: true;
  content: [{ type: "text"; text: string }];
}

function formatApiError(err: YandexApiError): string {
  const parts: string[] = [];

  if (err.status === 401 || err.status === 403) {
    parts.push(
      `Authentication error (HTTP ${err.status}): ${err.message}. ` +
        `Check that YANDEX_METRICA_TOKEN is valid and has metrika:read scope.`,
    );
  } else if (err.status === 404) {
    parts.push(`Not found (HTTP 404): ${err.message}`);
  } else if (err.status === 429) {
    parts.push(`Rate limit exceeded (HTTP 429): ${err.message}. Wait before retrying.`);
  } else if (err.status >= 500) {
    parts.push(`Yandex API server error (HTTP ${err.status}): ${err.message}`);
  } else {
    parts.push(`Yandex API error (HTTP ${err.status}): ${err.message}`);
  }

  if (err.code) {
    parts.push(`Code: ${err.code}`);
  }

  if (err.details !== undefined) {
    try {
      parts.push(`Details: ${JSON.stringify(err.details)}`);
    } catch {
      // ignore serialization errors
    }
  }

  return parts.join(". ");
}

export function mapError(error: unknown): McpToolError {
  let text: string;

  if (error instanceof YandexApiError) {
    text = formatApiError(error);
  } else if (error instanceof Error) {
    if (error.name === "AbortError" || error.message.includes("timed out")) {
      text = `Request timed out: ${error.message}`;
    } else if (
      error.message.includes("fetch") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND")
    ) {
      text = `Network error: ${error.message}`;
    } else {
      text = `Error: ${error.message}`;
    }
  } else {
    text = `Unexpected error: ${String(error)}`;
  }

  return {
    isError: true,
    content: [{ type: "text", text }],
  };
}

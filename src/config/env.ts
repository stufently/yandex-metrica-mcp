import { z } from "zod";

/**
 * Value the Docker image ships in YANDEX_METRICA_TOKEN so the server can start and
 * answer `initialize` / `tools/list` without credentials (registry introspection,
 * smoke tests). A real `-e YANDEX_METRICA_TOKEN=...` overrides it. Tool calls refuse
 * to run with it instead of sending it to Yandex.
 */
export const PLACEHOLDER_TOKEN = "introspection-placeholder-not-a-key";

const envSchema = z.object({
  YANDEX_METRICA_TOKEN: z.string().min(1, "YANDEX_METRICA_TOKEN is required"),
  YANDEX_METRICA_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  YANDEX_METRICA_BASE_URL: z.string().url().default("https://api-metrika.yandex.net"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  YANDEX_METRICA_USER_AGENT: z.string().default("yandex-metrica-mcp/0.2.2"),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([k, v]) => `${k}: ${v?.join(", ")}`)
      .join("; ");
    throw new Error(`Invalid configuration: ${messages}`);
  }
  return result.data;
}

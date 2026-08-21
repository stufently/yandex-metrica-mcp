import { z } from "zod";

// Use passthrough() everywhere so extra API fields don't cause validation failures.
// Only the fields our tools actually use are required.

const counterSchema = z
  .object({
    id: z.number(),
    status: z.string(),
    owner_login: z.string(),
    name: z.string(),
    site: z.string().nullable().optional(),
    type: z.string(),
  })
  .passthrough();

export const countersResponseSchema = z
  .object({
    counters: z.array(counterSchema),
    rows: z.number(),
  })
  .passthrough();

export const counterResponseSchema = z
  .object({
    counter: counterSchema,
  })
  .passthrough();

const goalSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    type: z.string(),
  })
  .passthrough();

export const goalsResponseSchema = z
  .object({
    goals: z.array(goalSchema),
  })
  .passthrough();

const dimensionValueSchema = z
  .object({
    name: z.string().nullable(),
  })
  .passthrough();

const staticRowSchema = z
  .object({
    dimensions: z.array(dimensionValueSchema),
    metrics: z.array(z.number()),
  })
  .passthrough();

export const reportResponseSchema = z
  .object({
    query: z.object({}).passthrough(),
    data: z.array(staticRowSchema),
    total_rows: z.number(),
    sampled: z.boolean(),
  })
  .passthrough();

const comparisonRowSchema = z
  .object({
    dimensions: z.array(dimensionValueSchema),
    // comparison endpoint returns metrics as { a: number[], b: number[] }, not number[][]
    metrics: z.object({ a: z.array(z.number()), b: z.array(z.number()) }).passthrough(),
  })
  .passthrough();

export const comparisonResponseSchema = z
  .object({
    query: z.object({}).passthrough(),
    data: z.array(comparisonRowSchema),
    total_rows: z.number(),
  })
  .passthrough();

const logRequestPartSchema = z
  .object({
    part_number: z.number(),
    size: z.number(),
  })
  .passthrough();

const logRequestSchema = z
  .object({
    request_id: z.number(),
    counter_id: z.number(),
    source: z.enum(["hits", "visits"]),
    date1: z.string(),
    date2: z.string(),
    fields: z.array(z.string()),
    status: z.string(),
    log_request_parts: z.array(logRequestPartSchema).optional(),
  })
  .passthrough();

export const logRequestResponseSchema = z
  .object({
    log_request: logRequestSchema,
  })
  .passthrough();

export const logRequestsResponseSchema = z
  .object({
    requests: z.array(logRequestSchema),
  })
  .passthrough();

export const logRequestEvaluationResponseSchema = z
  .object({
    log_request_evaluation: z
      .object({
        possible: z.boolean(),
        max_possible_day_quantity: z.number(),
      })
      .passthrough(),
  })
  .passthrough();

/**
 * Validates an API response against a zod schema.
 * On failure, throws with a descriptive message including which fields are wrong.
 */
export function validateResponse<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Unexpected response format from ${context}: ${issues}`);
  }
  return result.data;
}

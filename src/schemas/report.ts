import { z } from "zod";
import { dateString } from "./common.js";

export const getReportSchema = z.object({
  counter_ids: z
    .array(z.number().int().positive())
    .min(1)
    .describe("One or more counter IDs to query"),
  metrics: z
    .array(z.string().min(1))
    .min(1)
    .max(20)
    .describe(
      "Metrics to include, e.g. ['ym:s:visits', 'ym:s:pageviews', 'ym:s:bounceRate']. Max 20.",
    ),
  dimensions: z
    .array(z.string().min(1))
    .optional()
    .describe("Dimensions for grouping, e.g. ['ym:s:date', 'ym:s:regionCityName']"),
  date1: dateString
    .optional()
    .describe("Start date (YYYY-MM-DD or 'today', 'yesterday', '7daysAgo'). Default: 7daysAgo"),
  date2: dateString.optional().describe("End date (YYYY-MM-DD or relative). Default: today"),
  filters: z
    .string()
    .optional()
    .describe("Filter expression, e.g. \"ym:s:trafficSourceName=='Organic Search'\""),
  sort: z
    .array(z.string())
    .optional()
    .describe("Sort fields. Prefix with '-' for descending, e.g. ['-ym:s:visits', 'ym:s:date']"),
  limit: z.number().int().min(1).max(100000).optional().describe("Rows to return (default 100)"),
  offset: z.number().int().min(1).optional().describe("Row offset for pagination (1-based)"),
  accuracy: z
    .enum(["low", "medium", "high", "full"])
    .optional()
    .describe("Sampling accuracy (default: medium)"),
  currency: z.string().length(3).optional().describe("Currency code (ISO 4217), e.g. 'RUB'"),
  attribution: z
    .enum([
      "first",
      "last",
      "lastsign",
      "last_yandex_direct_click",
      "cross_device_first",
      "cross_device_last",
      "cross_device_last_significant",
      "cross_device_last_yandex_direct_click",
      "automatic",
    ])
    .optional()
    .describe(
      "Attribution model for traffic source metrics. " +
        "'lastsign' = last significant source; 'automatic' = auto-attribution.",
    ),
  lang: z
    .enum(["ru", "en", "tr", "uk"])
    .optional()
    .describe("Language for dimension value names (default: ru)"),
  include_undefined: z
    .boolean()
    .optional()
    .describe("Include rows with undefined dimension values"),
  preset: z
    .string()
    .optional()
    .describe("Preset report name (e.g. 'sources_summary'). Overrides metrics/dimensions."),
  // Comparison period — uses /stat/v1/data/comparison endpoint when provided
  date1_b: dateString
    .optional()
    .describe(
      "Comparison segment B start date. When provided with date2_b, uses the comparison endpoint " +
        "(/stat/v1/data/comparison). date1/date2 become segment A. Each row returns two sets of metrics.",
    ),
  date2_b: dateString
    .optional()
    .describe("Comparison segment B end date. Must be provided together with date1_b."),
  filters_a: z
    .string()
    .optional()
    .describe("Segmentation filter for segment A only (comparison mode)"),
  filters_b: z
    .string()
    .optional()
    .describe("Segmentation filter for segment B only (comparison mode)"),
});

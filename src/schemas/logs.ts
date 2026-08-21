import { z } from "zod";
import { counterId, requestId, dateString } from "./common.js";

const logSource = z
  .enum(["hits", "visits"])
  .describe("'hits' for pageview-level data, 'visits' for session-level data");

export const evaluateLogsRequestSchema = z.object({
  counter_id: counterId,
  date1: dateString.describe("Start date YYYY-MM-DD"),
  date2: dateString.describe("End date YYYY-MM-DD (cannot be current day)"),
  source: logSource,
  fields: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Fields to export. For visits: ['ym:s:visitID','ym:s:date','ym:s:clientID',...]. " +
        "For hits: ['ym:pv:watchID','ym:pv:date','ym:pv:URL',...]",
    ),
});

export const createLogsRequestSchema = z.object({
  counter_id: counterId,
  date1: dateString.describe("Start date YYYY-MM-DD"),
  date2: dateString.describe("End date YYYY-MM-DD (cannot be current day)"),
  source: logSource,
  fields: z
    .array(z.string().min(1))
    .min(1)
    .describe("Fields to export. See Yandex Metrica Logs API documentation for full field lists."),
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
    .describe("Attribution model for traffic source fields. Default: lastsign."),
});

export const listLogsRequestsSchema = z.object({
  counter_id: counterId,
});

export const getLogsRequestSchema = z.object({
  counter_id: counterId,
  request_id: requestId,
});

export const downloadLogsPartSchema = z.object({
  counter_id: counterId,
  request_id: requestId,
  part_number: z.number().int().min(0).describe("Part number (0-based)"),
  mode: z
    .enum(["preview", "full"])
    .default("preview")
    .describe(
      "Output mode. 'preview' returns first ~50KB with metadata (safe default). " +
        "'full' returns entire content — may be very large for big exports.",
    ),
});

export const cancelLogsRequestSchema = z.object({
  counter_id: counterId,
  request_id: requestId,
});

export const cleanLogsRequestSchema = z.object({
  counter_id: counterId,
  request_id: requestId,
});

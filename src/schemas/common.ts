import { z } from "zod";

// YYYY-MM-DD or Yandex relative date aliases
export const dateString = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}$|^(today|yesterday|\d+daysAgo)$/,
    "Date must be YYYY-MM-DD or a relative alias like 'today', 'yesterday', '7daysAgo'",
  );

export const counterId = z.number().int().positive().describe("Yandex Metrica counter (tag) ID");

export const requestId = z.number().int().positive().describe("Logs API request ID");

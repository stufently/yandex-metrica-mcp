import { createHttpClient } from "./http.js";
import type { Config } from "../config/env.js";
import type {
  LogRequestResponse,
  LogRequestsResponse,
  LogRequestEvaluationResponse,
  LogSource,
} from "../types/api.js";
import {
  logRequestResponseSchema,
  logRequestsResponseSchema,
  logRequestEvaluationResponseSchema,
  validateResponse,
} from "../schemas/responses.js";

export interface LogsRequestParams {
  counter_id: number;
  date1: string;
  date2: string;
  source: LogSource;
  fields: string;
  attribution?: string | undefined;
}

export interface LogsEvaluateParams {
  counter_id: number;
  date1: string;
  date2: string;
  source: LogSource;
  fields: string;
}

export interface LogsRequestIdParams {
  counter_id: number;
  request_id: number;
}

export interface DownloadLogsPartParams {
  counter_id: number;
  request_id: number;
  part_number: number;
}

export function createLogsClient(config: Config) {
  const http = createHttpClient(config);

  const base = (counterId: number) => `/management/v1/counter/${counterId}/logrequests`;

  const req = (counterId: number, requestId: number) =>
    `/management/v1/counter/${counterId}/logrequest/${requestId}`;

  async function evaluateLogsRequest(
    params: LogsEvaluateParams,
  ): Promise<LogRequestEvaluationResponse> {
    const raw = await http.getJson<unknown>(`${base(params.counter_id)}/evaluate`, {
      date1: params.date1,
      date2: params.date2,
      source: params.source,
      fields: params.fields,
    });
    return validateResponse(
      logRequestEvaluationResponseSchema,
      raw,
      "evaluateLogsRequest",
    ) as unknown as LogRequestEvaluationResponse;
  }

  async function createLogsRequest(params: LogsRequestParams): Promise<LogRequestResponse> {
    const raw = await http.postJson<unknown>(base(params.counter_id), {
      date1: params.date1,
      date2: params.date2,
      source: params.source,
      fields: params.fields,
      attribution: params.attribution,
    });
    return validateResponse(
      logRequestResponseSchema,
      raw,
      "createLogsRequest",
    ) as unknown as LogRequestResponse;
  }

  async function listLogsRequests(counterId: number): Promise<LogRequestsResponse> {
    const raw = await http.getJson<unknown>(base(counterId));
    return validateResponse(
      logRequestsResponseSchema,
      raw,
      "listLogsRequests",
    ) as unknown as LogRequestsResponse;
  }

  async function getLogsRequest(params: LogsRequestIdParams): Promise<LogRequestResponse> {
    const raw = await http.getJson<unknown>(req(params.counter_id, params.request_id));
    return validateResponse(
      logRequestResponseSchema,
      raw,
      "getLogsRequest",
    ) as unknown as LogRequestResponse;
  }

  async function downloadLogsPart(params: DownloadLogsPartParams): Promise<Response> {
    return http.getRaw(
      `${req(params.counter_id, params.request_id)}/part/${params.part_number}/download`,
    );
  }

  async function cancelLogsRequest(params: LogsRequestIdParams): Promise<LogRequestResponse> {
    const raw = await http.postJson<unknown>(`${req(params.counter_id, params.request_id)}/cancel`);
    return validateResponse(
      logRequestResponseSchema,
      raw,
      "cancelLogsRequest",
    ) as unknown as LogRequestResponse;
  }

  async function cleanLogsRequest(params: LogsRequestIdParams): Promise<LogRequestResponse> {
    const raw = await http.postJson<unknown>(`${req(params.counter_id, params.request_id)}/clean`);
    return validateResponse(
      logRequestResponseSchema,
      raw,
      "cleanLogsRequest",
    ) as unknown as LogRequestResponse;
  }

  return {
    evaluateLogsRequest,
    createLogsRequest,
    listLogsRequests,
    getLogsRequest,
    downloadLogsPart,
    cancelLogsRequest,
    cleanLogsRequest,
  };
}

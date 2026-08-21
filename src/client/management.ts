import { createHttpClient } from "./http.js";
import type { Config } from "../config/env.js";
import type { CountersResponse, CounterResponse, GoalsResponse } from "../types/api.js";
import {
  countersResponseSchema,
  counterResponseSchema,
  goalsResponseSchema,
  validateResponse,
} from "../schemas/responses.js";

export interface ListCountersParams {
  page?: number | undefined;
  per_page?: number | undefined;
  status?: string | undefined;
  type?: string | undefined;
  search?: string | undefined;
  sort?: string | undefined;
}

export interface GetCounterParams {
  counter_id: number;
}

export interface ListGoalsParams {
  counter_id: number;
}

export interface CreateCounterParams {
  name: string;
  site: string;
  mirrors?: string[];
  time_zone_name?: string;
  gdpr_agreement_accepted?: boolean;
}

export interface DeleteCounterParams {
  counter_id: number;
}

export function createManagementClient(config: Config) {
  const http = createHttpClient(config);

  async function listCounters(params: ListCountersParams): Promise<CountersResponse> {
    const raw = await http.getJson<unknown>("/management/v1/counters", {
      page: params.page,
      per_page: params.per_page,
      status: params.status,
      type: params.type,
      search: params.search,
      sort: params.sort,
    });
    return validateResponse(
      countersResponseSchema,
      raw,
      "listCounters",
    ) as unknown as CountersResponse;
  }

  async function getCounter(params: GetCounterParams): Promise<CounterResponse> {
    const raw = await http.getJson<unknown>(`/management/v1/counter/${params.counter_id}`);
    return validateResponse(counterResponseSchema, raw, "getCounter") as unknown as CounterResponse;
  }

  async function listGoals(params: ListGoalsParams): Promise<GoalsResponse> {
    const raw = await http.getJson<unknown>(`/management/v1/counter/${params.counter_id}/goals`);
    return validateResponse(goalsResponseSchema, raw, "listGoals") as unknown as GoalsResponse;
  }

  async function createCounter(params: CreateCounterParams): Promise<CounterResponse> {
    const body = {
      counter: {
        name: params.name,
        site: params.site,
        ...(params.mirrors && { mirrors: params.mirrors }),
        ...(params.time_zone_name && { time_zone_name: params.time_zone_name }),
      },
    };
    const queryParams = params.gdpr_agreement_accepted ? { gdpr_agreement_accepted: 1 } : undefined;
    const raw = await http.postJsonBody<unknown>("/management/v1/counters", body, queryParams);
    return validateResponse(
      counterResponseSchema,
      raw,
      "createCounter",
    ) as unknown as CounterResponse;
  }

  async function deleteCounter(params: DeleteCounterParams): Promise<void> {
    await http.deleteRequest(`/management/v1/counter/${params.counter_id}`);
  }

  return { listCounters, getCounter, listGoals, createCounter, deleteCounter };
}

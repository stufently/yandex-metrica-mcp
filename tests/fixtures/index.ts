import type {
  Counter,
  CountersResponse,
  CounterResponse,
  GoalsResponse,
  ReportResponse,
  LogRequestResponse,
  LogRequestsResponse,
  LogRequestEvaluationResponse,
} from "../../src/types/api.js";

export const FIXTURE_COUNTER_ID = 12345678;
export const FIXTURE_REQUEST_ID = 99001;

export const fixtureCounter: Counter = {
  id: FIXTURE_COUNTER_ID,
  status: "Active",
  owner_login: "test_user",
  code_status: "CS_ERR_EMPTY_DNS",
  name: "Test Site",
  site: "example.com",
  type: "simple",
  favorite: 0,
  hide_address: false,
  time_zone_name: "Europe/Moscow",
  visit_threshold: 0,
  create_time: "2024-01-01T00:00:00.000Z",
};

export const fixtureCountersResponse: CountersResponse = {
  counters: [fixtureCounter],
  rows: 1,
};

export const fixtureCounterResponse: CounterResponse = {
  counter: fixtureCounter,
};

export const fixtureGoalsResponse: GoalsResponse = {
  goals: [
    { id: 1, name: "Purchase", type: "action" },
    {
      id: 2,
      name: "Registration",
      type: "url",
      conditions: [{ type: "contain", url: "/success" }],
    },
  ],
};

export const fixtureReportResponse: ReportResponse = {
  query: {
    ids: [FIXTURE_COUNTER_ID],
    metrics: ["ym:s:visits"],
    dimensions: ["ym:s:date"],
    sort: ["ym:s:date"],
    date1: "2024-01-01",
    date2: "2024-01-07",
    limit: 100,
    offset: 1,
    filters: "",
    accuracy: "medium",
    lang: "ru",
    attribution: "last",
    currency: "RUB",
    quantile: 50,
  },
  data: [
    { dimensions: [{ name: "2024-01-01" }], metrics: [150] },
    { dimensions: [{ name: "2024-01-02" }], metrics: [200] },
  ],
  total_rows: 7,
  total_rows_rounded: false,
  sampled: false,
  sample_share: 1,
  sample_size: 1000,
  sample_space: 1000,
  data_lag: 0,
  totals: [350],
  min: [150],
  max: [200],
};

export const fixtureLogRequest = {
  request_id: FIXTURE_REQUEST_ID,
  counter_id: FIXTURE_COUNTER_ID,
  source: "visits" as const,
  date1: "2024-01-01",
  date2: "2024-01-07",
  fields: ["ym:s:visitID", "ym:s:date", "ym:s:clientID"],
  status: "processed" as const,
  size: 1024,
  log_request_parts: [{ part_number: 0, size: 1024 }],
};

export const fixtureLogRequestResponse: LogRequestResponse = {
  log_request: fixtureLogRequest,
};

export const fixtureLogRequestsResponse: LogRequestsResponse = {
  requests: [fixtureLogRequest],
};

export const fixtureEvaluationResponse: LogRequestEvaluationResponse = {
  log_request_evaluation: {
    possible: true,
    max_possible_day_quantity: 30,
  },
};

export const fixtureComparisonResponse = {
  query: {
    ids: [FIXTURE_COUNTER_ID],
    metrics: ["ym:s:visits"],
    date1_a: "2024-01-01",
    date2_a: "2024-01-07",
    date1_b: "2023-01-01",
    date2_b: "2023-01-07",
    limit: 100,
    offset: 1,
  },
  data: [
    {
      dimensions: [{ name: "Organic Search" }],
      metrics: { a: [150], b: [120] },
    },
    {
      dimensions: [{ name: "Direct" }],
      metrics: { a: [80], b: [95] },
    },
  ],
  total_rows: 2,
  sampled: false,
};

export const fixtureTsvContent =
  "ym:s:visitID\tym:s:date\tym:s:clientID\n" + "111\t2024-01-01\tabc\n" + "222\t2024-01-02\tdef\n";

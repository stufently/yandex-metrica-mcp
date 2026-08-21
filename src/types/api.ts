// Yandex Metrica Management API types

export interface CounterPermission {
  user_login: string;
  user_role: string;
  created_at?: string;
}

export interface Counter {
  id: number;
  status: string;
  owner_login: string;
  code_status: string;
  name: string;
  site: string | null;
  type: string;
  favorite: number;
  hide_address: boolean;
  time_zone_name: string;
  visit_threshold: number;
  mirrors?: string[];
  webvisor?: {
    arch_enabled: boolean;
    arch_type: string;
    load_player_type: string;
    wv_forms: boolean;
  };
  create_time?: string;
}

export interface CountersResponse {
  counters: Counter[];
  rows: number;
}

export interface CounterResponse {
  counter: Counter;
}

export interface Goal {
  id: number;
  name: string;
  type: string;
  is_retargeting?: number;
  flag?: string;
  conditions?: Array<{
    type: string;
    url: string;
  }>;
  steps?: unknown[];
  col_name?: string;
  default_price?: number;
  currency?: string;
  converted_id?: number;
  status?: string;
}

export interface GoalsResponse {
  goals: Goal[];
}

// Reporting API types

// Request-parameter shapes live with their client, not here: see
// `GetReportParams` / `GetComparisonParams` in src/client/reporting.ts.

export interface DimensionValue {
  name: string | null;
  id?: string | null;
  favicon?: string | null;
  url?: string | null;
}

export interface StaticRow {
  dimensions: DimensionValue[];
  metrics: number[];
}

export interface DimensionMeta {
  name: string;
  group?: string;
  group_level?: number;
  title?: string;
}

export interface MetricMeta {
  name: string;
  title?: string;
}

export interface QueryMeta {
  ids: number[];
  metrics: string[];
  dimensions: string[];
  sort: string[];
  date1: string;
  date2: string;
  limit: number;
  offset: number;
  filters: string;
  accuracy: string;
  lang: string;
  attribution: string;
  currency: string;
  quantile: number;
}

export interface ReportResponse {
  query: QueryMeta;
  data: StaticRow[];
  total_rows: number;
  total_rows_rounded: boolean;
  sampled: boolean;
  sample_share: number;
  sample_size: number;
  sample_space: number;
  data_lag: number;
  totals: number[];
  min: number[];
  max: number[];
}

// Logs API types

export type LogRequestStatus =
  | "created"
  | "awaiting_retry"
  | "processed"
  | "canceled"
  | "cleaned_by_user"
  | "cleaned_automatically_as_too_old";

export type LogSource = "hits" | "visits";

export interface LogRequestPart {
  part_number: number;
  size: number;
}

export interface LogRequest {
  request_id: number;
  counter_id: number;
  source: LogSource;
  date1: string;
  date2: string;
  fields: string[];
  status: LogRequestStatus;
  size?: number;
  attribution?: string;
  log_request_parts?: LogRequestPart[];
}

export interface LogRequestResponse {
  log_request: LogRequest;
}

export interface LogRequestsResponse {
  requests: LogRequest[];
}

export interface LogRequestEvaluation {
  possible: boolean;
  max_possible_day_quantity: number;
}

export interface LogRequestEvaluationResponse {
  log_request_evaluation: LogRequestEvaluation;
}

// Counter creation types

export interface CreateCounterBody {
  name: string;
  site: string;
  mirrors?: string[];
  time_zone_name?: string;
}

export interface CreateCounterParams {
  gdpr_agreement_accepted?: number;
}

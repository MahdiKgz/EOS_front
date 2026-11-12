import { baseApi } from "@/shared/api/base-api";
export type MonitoringRange = "1h" | "24h" | "7d" | "30d";
export type MonitorSource = {
  role: "management" | "observability";
  method: string;
  host: string;
  port: number;
};
export type MonitoringReport = {
  config: {
    enabled: boolean;
    intervalSeconds: number;
    revision: string;
    nextRunAt: string | null;
    lastAttemptAt: string | null;
    lastSuccessAt: string | null;
    lastErrorCode: string | null;
    running: boolean;
  } | null;
  latest: {
    measurements: {
      key: string;
      value: number;
      unit: string;
      label: string;
      kind: "gauge" | "counter";
    }[];
    warnings: string[];
    source: MonitorSource;
    collectedAt: string;
  } | null;
  stale: boolean;
  series: {
    key: string;
    label: string;
    unit: string;
    points: { at: string; value: number; epoch: string }[];
  }[];
  history: {
    id: string;
    status: "success" | "failed";
    source: MonitorSource | null;
    startedAt: string;
    completedAt: string;
    errorCode: string | null;
    measurementCount: number;
    warnings: string[];
  }[];
  range: MonitoringRange;
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    deviceMonitoring: build.query<MonitoringReport, { id: string; range: MonitoringRange }>({
      query: ({ id, range }) => `devices/${id}/monitoring?range=${range}`,
      providesTags: (_result, _error, { id }) => [{ type: "Devices", id: `monitoring-${id}` }],
    }),
    configureMonitoring: build.mutation<
      MonitoringReport,
      { id: string; body: { enabled: boolean; intervalSeconds: number; revision?: string } }
    >({
      query: ({ id, body }) => ({ url: `devices/${id}/monitoring`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Devices", id: `monitoring-${id}` }],
    }),
    collectMonitoring: build.mutation<
      { collected: boolean; errorCode: string | null; measurementCount: number },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `devices/${id}/monitoring/collect`,
        method: "POST",
        body: {},
        timeout: 250000,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Devices", id: `monitoring-${id}` }],
    }),
  }),
});
export const {
  useDeviceMonitoringQuery,
  useConfigureMonitoringMutation,
  useCollectMonitoringMutation,
} = api;

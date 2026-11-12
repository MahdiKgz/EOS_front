import { baseApi } from "@/shared/api/base-api";
import type { DeviceCapabilities } from "./capability-api";
export type FortiTable = {
  key: string;
  title: string;
  columns: string[];
  rows: Record<string, string | number | boolean | null>[];
  sources: string[];
  state: string;
};
export type FortiDailyCheck = {
  collectedAt: string;
  status: string;
  coverage: "complete" | "partial";
  summary: string;
  sections: {
    key: string;
    title: string;
    status: string;
    coverage: "complete" | "partial" | "unavailable";
    summary: string;
    evidence: { label: string; value: string }[];
    findings: { title: string; severity: string; evidence: string; recommendedAction: string }[];
  }[];
};
export type FortiLogs = {
  state: string;
  limit: number;
  order: string;
  reportedTotal: number | null;
  rawLines: string[];
  entries: {
    date: string | null;
    time: string | null;
    timezone: string | null;
    eventTime: string | null;
    type: string | null;
    subtype: string | null;
    level: string | null;
    vdom: string | null;
    description: string | null;
    message: string | null;
    user: string | null;
    sourceIp: string | null;
    destinationIp: string | null;
    action: string | null;
    raw: string;
  }[];
};
export type FortiCollection = {
  dailyCheck?: FortiDailyCheck;
  logs?: FortiLogs;
  vendor: "fortigate";
  collectedAt: string;
  inventoryStatus: string;
  system: {
    model: string | null;
    version: string | null;
    hostname: string | null;
    serial: string | null;
    operationMode: string | null;
    haMode: string | null;
    license: string | null;
    vdomMode: string | null;
    currentVdom: string | null;
    systemTime: string | null;
  };
  health: {
    cpuUsagePercent: number | null;
    memoryUsagePercent: number | null;
    memoryTotalBytes: number | null;
    memoryUsedBytes: number | null;
    sessionCount: number | null;
    uptimeSeconds: number | null;
  };
  interfaceCounters: { name: string; rxBytes: number; txBytes: number }[];
  tables: FortiTable[];
  rawSections: { key: string; title: string; state: string; lines: string[] }[];
  commandEvidence: {
    commandId: string;
    state: string;
    lineCount: number;
    errorCode?: string;
    evidence: string[];
  }[];
  warnings: string[];
};
export type FortiCapabilities = Omit<DeviceCapabilities, "latest"> & {
  latest:
    | (Omit<NonNullable<DeviceCapabilities["latest"]>, "collection"> & {
        collection: FortiCollection | null;
      })
    | null;
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    fortigateCapabilities: build.query<FortiCapabilities, string>({
      query: (id) => `devices/${id}/capabilities`,
      providesTags: ["Devices"],
    }),
  }),
});
export const { useFortigateCapabilitiesQuery } = api;

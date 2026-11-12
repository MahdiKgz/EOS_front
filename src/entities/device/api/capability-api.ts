import { baseApi } from "@/shared/api/base-api";
export type CiscoSection = { state: string; entries?: Record<string, unknown>[] };
export type CiscoCollection = {
  platform: string;
  platformFamily: string;
  collectedAt: string;
  inventoryStatus: string;
  capabilityStatus: string;
  system: {
    hostname: string | null;
    model: string | null;
    iosVersion: string | null;
    serialNumber: string | null;
    imageName: string | null;
    uptime: string | null;
    bootImage: string | null;
    bootInformation: string | null;
    inventory: Record<string, unknown>[];
    clock: string[];
    license: string[];
  };
  interfaces: {
    state: string;
    summary: Record<string, unknown>[];
    switchports: Record<string, unknown>[];
    errors: string[];
  };
  interfaceCounters: { name: string; rxBytes: number | null; txBytes: number | null }[];
  health: {
    state: string;
    cpu: {
      fiveSeconds: number | null;
      oneMinute: number | null;
      fiveMinutes: number | null;
    } | null;
    memory: { name: string; totalBytes: number; usedBytes: number; freeBytes: number }[];
    flash: { freeBytes: number | null; summary: string[] };
  };
  network: Record<string, CiscoSection | Record<string, unknown>[]>;
  configuration: Record<string, CiscoSection | string>;
  securityServices: Record<string, CiscoSection>;
  capabilityProfile: { groups: Record<string, string> };
  commandEvidence: {
    commandId: string;
    state: string;
    lineCount: number;
    evidence: string[];
    errorCode?: string;
  }[];
  warnings: string[];
};
export type DeviceCapabilities = {
  companyId: string | null;
  latest: {
    detection: {
      vendor: string;
      platform: string;
      version: string | null;
      model: string | null;
      hostname: string | null;
      confidence: number;
      evidence: string[];
      supported: boolean;
    };
    collection: CiscoCollection | null;
    warnings: string[];
    collectedAt: string;
    source: { host: string; port: number };
  } | null;
  stale: boolean;
  ready: boolean;
  running: boolean;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  expiresAt: string | null;
  history: {
    id: string;
    actorName: string;
    status: string;
    platform: string | null;
    startedAt: string;
    completedAt: string;
    errorCode: string | null;
    commandCount: number;
  }[];
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    deviceCapabilities: build.query<DeviceCapabilities, string>({
      query: (id) => `devices/${id}/capabilities`,
      providesTags: ["Devices"],
    }),
    refreshDeviceCapabilities: build.mutation<
      { deviceId: string; collectedAt: string; supported: boolean; warnings: string[] },
      string
    >({
      query: (id) => ({
        url: `devices/${id}/capabilities/refresh`,
        method: "POST",
        body: {},
        timeout: 80000,
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const { useDeviceCapabilitiesQuery, useRefreshDeviceCapabilitiesMutation } = api;

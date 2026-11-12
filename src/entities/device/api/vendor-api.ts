import type { NetworkApiInventory } from "./network-inventory-types";
import { baseApi } from "@/shared/api/base-api";
export type ApiCredential = { id: string; name: string; username: string };
export type ApiCredentialInput = {
  name: string;
  username: string;
  password: string;
  caCertificate?: string;
  tlsFingerprint?: string;
};
export type EsxiInventory = {
  transport?: "ssh" | "api";
  interfaceCounters?: { name: string; rxBytes: number | null; txBytes: number | null }[];
  hostId: string;
  hostname: string;
  version: string;
  build: string;
  model: string;
  hardwareVendor: string;
  serialNumber: string;
  biosVersion: string;
  lockdownMode: string;
  connectionState: string;
  overallStatus: string;
  maintenanceMode: boolean | null;
  bootTime: string | null;
  cpuPercent: number | null;
  memoryPercent: number | null;
  cpuCores: number | null;
  memoryBytes: number | null;
  vmCount: number | null;
  vmsTruncated: boolean;
  datastoreCount: number | null;
  vms: {
    id: string;
    name: string;
    powerState: string;
    guest?: string;
    cpuCount: number | null;
    memoryMb: number | null;
  }[];
  datastores: {
    id: string;
    name: string;
    capacityBytes: number | null;
    freeBytes: number | null;
    accessible: boolean | null;
  }[];
  networks: string[];
  sensors: { name: string; state: string; reading: number | null; unit: string }[];
  services: {
    key: string;
    label: string;
    running: boolean | null;
    policy: string;
    required: boolean | null;
  }[];
  storageAdapters: { name: string; model: string; driver: string; status: string }[];
  storageDevices: {
    name: string;
    displayName: string;
    deviceType: string;
    operationalState: string;
  }[];
  firewallRulesets: {
    key: string;
    label: string;
    enabled: boolean | null;
    required: boolean | null;
  }[];
  physicalNics: { name: string; linkUp: boolean | null; speedMb: number | null }[];
  vmkernelNics: { name: string; ip: string }[];
  virtualSwitches: { name: string; ports: number | null }[];
  portGroups: { name: string; vlanId: number | null; vSwitch: string }[];
  dns: { hostName: string; domainName: string; servers: string[] };
  time: { ntpServers: string[]; lastSyncTime: string | null; protocol: string };
  coverage?: { key: string; status: "available" | "unavailable" }[];
  collectedAt: string;
};
export type ApiInventory = NetworkApiInventory | (EsxiInventory & { kind: "esxi" });

const vendorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    apiCredentials: build.query<ApiCredential[], void>({
      query: () => "devices/api-credentials",
      providesTags: ["Devices"],
    }),
    saveApiCredential: build.mutation<ApiCredential, { id?: string; body: ApiCredentialInput }>({
      query: ({ id, body }) => ({
        url: `devices/api-credentials${id ? `/${id}` : ""}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    deleteApiCredential: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `devices/api-credentials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Devices"],
    }),
    assignApiCredential: build.mutation<unknown, { id: string; credentialId: string }>({
      query: ({ id, credentialId }) => ({
        url: `devices/${id}/api-credential`,
        method: "PUT",
        body: { credentialId },
      }),
      invalidatesTags: ["Devices"],
    }),
    inspectNetworkApi: build.mutation<
      NetworkApiInventory,
      { id: string; kind: "mikrotik" | "sophos" }
    >({
      query: ({ id, kind }) => ({
        url: `devices/${id}/api-inventory`,
        method: "POST",
        body: { kind },
        timeout: 210000,
      }),
      invalidatesTags: ["Devices"],
    }),
    inspectEsxi: build.mutation<EsxiInventory, { id: string; transport: "api" | "ssh" }>({
      query: ({ id, transport }) => ({
        url: `devices/${id}/${transport === "ssh" ? "esxi-ssh-inventory" : "esxi-inventory"}`,
        method: "POST",
        body: {},
        timeout: transport === "ssh" ? 50000 : 210000,
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const {
  useApiCredentialsQuery,
  useSaveApiCredentialMutation,
  useDeleteApiCredentialMutation,
  useAssignApiCredentialMutation,
  useInspectEsxiMutation,
  useInspectNetworkApiMutation,
} = vendorApi;

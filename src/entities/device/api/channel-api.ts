import type { ApiInventory } from "./vendor-api";
import type { ChannelMethod } from "../model/channel-methods";
import { baseApi } from "@/shared/api/base-api";
export type SnmpCredential = {
  id: string;
  name: string;
  username: string;
  authProtocol: "SHA" | "SHA256";
};
export type SnmpCredentialInput = Omit<SnmpCredential, "id"> & {
  authPassword: string;
  privacyPassword: string;
};
export type ChannelInput = {
  revision?: string;
  method: ChannelMethod;
  credentialId: string;
  host?: string;
  port: number;
  priority: number;
};
export type DeviceChannels = {
  primary: {
    method: string;
    host: string;
    port: number;
    supported: boolean;
    credentialsConfigured?: boolean;
    status: string;
    priority: number;
    lastSuccessAt: string | null;
  };
  secondary: null | {
    method: ChannelMethod;
    host: string | null;
    port: number;
    priority: number;
    revision: string;
    credentialId: string | null;
    enabled: boolean;
    status: string;
    needsCredential: boolean;
    lastTestAt: string | null;
    lastSuccessAt: string | null;
    lastError: string | null;
    testing: boolean;
    telemetry: null | { sysName: string; uptimeSeconds: number; interfaceCount: number | null };
  };
  availableMethods: ChannelMethod[];
  preferred: "management" | "observability" | null;
  history: {
    id: string;
    method: string;
    connected: boolean;
    errorCode: string | null;
    checkedAt: string;
  }[];
};
const channelApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    saveSshCredential: b.mutation<
      import("../model/types").DeviceCredential,
      {
        id?: string;
        body: {
          name: string;
          username: string;
          hostKey: string;
          operation: "verify";
          password?: string;
          privateKey?: string;
        };
      }
    >({
      query: ({ id, body }) => ({
        url: `devices/credentials${id ? `/${id}` : ""}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    deleteSshCredential: b.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `devices/credentials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Devices"],
    }),
    snmpCredentials: b.query<SnmpCredential[], void>({
      query: () => "devices/snmp-credentials",
      providesTags: ["Devices"],
    }),
    saveSnmpCredential: b.mutation<SnmpCredential, { id?: string; body: SnmpCredentialInput }>({
      query: ({ id, body }) => ({
        url: `devices/snmp-credentials${id ? `/${id}` : ""}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    deleteSnmpCredential: b.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `devices/snmp-credentials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Devices"],
    }),
    deviceChannels: b.query<DeviceChannels, string>({
      query: (id) => `devices/${id}/connection-channels`,
      providesTags: ["Devices"],
    }),
    configureDeviceChannel: b.mutation<DeviceChannels, { id: string; body: ChannelInput }>({
      query: ({ id, body }) => ({ url: `devices/${id}/connection-channels`, method: "PUT", body }),
      invalidatesTags: ["Devices"],
    }),
    toggleDeviceChannel: b.mutation<
      DeviceChannels,
      { id: string; body: { enabled: boolean; revision: string } }
    >({
      query: ({ id, body }) => ({
        url: `devices/${id}/connection-channels/state`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    testDeviceChannel: b.mutation<
      {
        connected: boolean;
        errorCode?: string | null;
        inventory?: ApiInventory;
        revision?: string;
        checkedAt?: string;
      },
      { id: string; role: "primary" | "secondary" }
    >({
      query: ({ id, role }) => ({
        url: `devices/${id}/connection-channels/test-${role}`,
        timeout: 210000,
        method: "POST",
        body: {},
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const {
  useSaveSshCredentialMutation,
  useDeleteSshCredentialMutation,
  useSnmpCredentialsQuery,
  useSaveSnmpCredentialMutation,
  useDeleteSnmpCredentialMutation,
  useDeviceChannelsQuery,
  useConfigureDeviceChannelMutation,
  useToggleDeviceChannelMutation,
  useTestDeviceChannelMutation,
} = channelApi;

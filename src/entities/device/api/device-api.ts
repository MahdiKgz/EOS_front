import { baseApi } from "@/shared/api/base-api";
import type {
  Device,
  DeviceCheck,
  DeviceCompany,
  DeviceCredential,
  DeviceInput,
  DeviceList,
  DeviceListQuery,
} from "../model/types";
export const deviceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    deviceCompanies: builder.query<DeviceCompany[], void>({ query: () => "devices/companies" }),
    deviceCredentials: builder.query<DeviceCredential[], void>({
      query: () => "devices/credentials",
    }),
    devices: builder.query<DeviceList, DeviceListQuery>({
      query: (params) => ({ url: "devices", params }),
      providesTags: ["Devices"],
    }),
    device: builder.query<Device, string>({
      query: (id) => `devices/${id}`,
      providesTags: ["Devices"],
    }),
    deviceHistory: builder.query<DeviceCheck[], string>({
      query: (id) => `devices/${id}/history`,
      providesTags: ["Devices"],
    }),
    createDevice: builder.mutation<Device, DeviceInput>({
      query: (body) => ({ url: "devices", method: "POST", body }),
      invalidatesTags: ["Devices"],
    }),
    updateDevice: builder.mutation<Device, { id: string; body: DeviceInput }>({
      query: ({ id, body }) => ({ url: `devices/${id}`, method: "PUT", body }),
      invalidatesTags: ["Devices"],
    }),
    testDeviceConnection: builder.mutation<
      {
        reachable: boolean;
        status: "online" | "offline";
        latencyMs: number | null;
        checkedAt: string;
        lastSeenAt: string | null;
      },
      string
    >({
      query: (id) => ({ url: `devices/${id}/test-connection`, method: "POST" }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    archiveDevice: builder.mutation<{ message: string }, string>({
      query: (id) => ({ url: `devices/${id}`, method: "DELETE" }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const {
  useDevicesQuery,
  useDeviceCompaniesQuery,
  useDeviceCredentialsQuery,
  useDeviceQuery,
  useDeviceHistoryQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useArchiveDeviceMutation,
  useTestDeviceConnectionMutation,
} = deviceApi;

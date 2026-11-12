import { baseApi } from "@/shared/api/base-api";
export type DeviceSecret = {
  id: string;
  name: string;
  purpose: "admin_password" | "ipsec_psk";
  revision: string;
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    deviceSecrets: build.query<DeviceSecret[], void>({
      query: () => "devices/action-secrets",
      providesTags: ["Devices"],
    }),
    saveDeviceSecret: build.mutation<
      DeviceSecret,
      {
        id?: string;
        body: { name: string; purpose: DeviceSecret["purpose"]; value: string; revision?: string };
      }
    >({
      query: ({ id, body }) => ({
        url: `devices/action-secrets${id ? "/" + id : ""}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    deleteDeviceSecret: build.mutation<{ deleted: boolean }, { id: string; revision: string }>({
      query: ({ id, revision }) => ({
        url: `devices/action-secrets/${id}`,
        method: "DELETE",
        body: { revision },
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const { useDeviceSecretsQuery, useSaveDeviceSecretMutation, useDeleteDeviceSecretMutation } =
  api;

import { baseApi } from "@/shared/api/base-api";
import type { CiscoAccessOptions } from "../model/types";
export type EnableCredential = { id: string; name: string };
export type CiscoAccess = CiscoAccessOptions & {
  revision?: string;
  enableConfigured: boolean;
  needsOwnCredential: boolean;
  history: {
    id: string;
    actorName: string;
    action: string;
    compatibilityProfile: string;
    enableConfigured: boolean;
    occurredAt: string;
  }[];
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    ciscoEnableCredentials: build.query<EnableCredential[], void>({
      query: () => "devices/cisco-enable-credentials",
      providesTags: ["Devices"],
    }),
    saveCiscoEnableCredential: build.mutation<
      EnableCredential,
      { id?: string; body: { name: string; password: string } }
    >({
      query: ({ id, body }) => ({
        url: `devices/cisco-enable-credentials${id ? "/" + id : ""}`,
        method: id ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Devices"],
    }),
    deleteCiscoEnableCredential: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `devices/cisco-enable-credentials/${id}`, method: "DELETE" }),
      invalidatesTags: ["Devices"],
    }),
    ciscoAccess: build.query<CiscoAccess, string>({
      query: (id) => `devices/${id}/cisco-access`,
      providesTags: ["Devices"],
    }),
    saveCiscoAccess: build.mutation<
      CiscoAccess,
      { id: string; body: CiscoAccessOptions & { revision?: string } }
    >({
      query: ({ id, body }) => ({ url: `devices/${id}/cisco-access`, method: "PUT", body }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const {
  useCiscoEnableCredentialsQuery,
  useSaveCiscoEnableCredentialMutation,
  useDeleteCiscoEnableCredentialMutation,
  useCiscoAccessQuery,
  useSaveCiscoAccessMutation,
} = api;

import { baseApi } from "@/shared/api/base-api";
import type { DeviceInput } from "../model/types";
export type RegistrationDraftInput = {
  category: "network" | "recorder";
  companyId: string;
  values: Omit<DeviceInput, "tags"> & { tagsText: string };
};
export type RegistrationDraft = RegistrationDraftInput & { revision: string; expiresAt: number };
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    registrationDraft: build.query<{ draft: RegistrationDraft | null }, void>({
      query: () => "devices/registration-draft",
      keepUnusedDataFor: 0,
    }),
    saveRegistrationDraft: build.mutation<
      Pick<RegistrationDraft, "revision" | "expiresAt">,
      RegistrationDraftInput
    >({
      query: (body) => ({ url: "devices/registration-draft", method: "PUT", body }),
    }),
    deleteRegistrationDraft: build.mutation<{ deleted: boolean }, string>({
      query: (revision) => ({
        url: `devices/registration-draft?revision=${encodeURIComponent(revision)}`,
        method: "DELETE",
      }),
    }),
  }),
});
export const {
  useRegistrationDraftQuery,
  useSaveRegistrationDraftMutation,
  useDeleteRegistrationDraftMutation,
} = api;

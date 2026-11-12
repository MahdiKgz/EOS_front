import { baseApi } from "@/shared/api/base-api";
import type { DeviceInput, DeviceType } from "../model/types";
export type SupportState = "implemented" | "partial" | "planned" | "unsupported";
export type VendorDefinition = {
  key: string;
  title: string;
  description: string;
  state: SupportState;
  requirements: string[];
  platforms: { key: string; title: string; state: SupportState; description: string }[];
  capabilities: {
    key: string;
    title: string;
    mode: "read" | "mutate";
    state: SupportState;
    description: string;
  }[];
  registration: Pick<DeviceInput, "type" | "vendor" | "protocol" | "managementPort">;
};
export type VendorCatalog = {
  items: (VendorDefinition & { deviceCount: number })[];
  stats: Record<SupportState, number>;
  total: number;
};
export type VendorDetail = {
  vendor: VendorDefinition;
  stats: { total: number; online: number };
  devices: {
    items: {
      id: string;
      name: string;
      type: DeviceType;
      vendor: string;
      host: string;
      managementPort: number;
      protocol: string;
      status: "unknown" | "online" | "offline" | "error";
      lastSeenAt: string | null;
      updatedAt: string;
      companyId: string | null;
      companyName: string | null;
      verified: boolean;
      platform?: string | null;
      platformCollectedAt?: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
  };
};
export type VendorQuery = { companyId?: string; search?: string; state?: SupportState };
export type VendorDeviceQuery = {
  key: string;
  companyId?: string;
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    vendorCatalog: build.query<VendorCatalog, VendorQuery>({
      query: (params) => ({ url: "vendors", params }),
      providesTags: ["Devices"],
    }),
    vendorDetail: build.query<VendorDetail, VendorDeviceQuery>({
      query: ({ key, ...params }) => ({ url: `vendors/${encodeURIComponent(key)}`, params }),
      providesTags: ["Devices"],
    }),
  }),
});
export const { useVendorCatalogQuery, useVendorDetailQuery } = api;

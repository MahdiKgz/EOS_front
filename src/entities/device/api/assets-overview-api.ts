import { baseApi } from "@/shared/api/base-api";
import type { Device } from "../model/types";
export type AssetsFilter = "all" | "online" | "attention" | "unverified";
export type AssetsOverviewQuery = {
  companyId?: string;
  search?: string;
  filter: AssetsFilter;
  page: number;
  pageSize: number;
};
export type OverviewAsset = Pick<
  Device,
  | "id"
  | "name"
  | "vendor"
  | "type"
  | "host"
  | "location"
  | "managementPort"
  | "protocol"
  | "status"
  | "lastSeenAt"
  | "createdAt"
  | "companyId"
> & { companyName: string | null; verified: boolean };
export type AssetsOverview = {
  items: OverviewAsset[];
  total: number;
  page: number;
  pageSize: number;
  stats: { total: number; online: number; attention: number; unverified: number };
  analytics: {
    status: Record<Device["status"], number>;
    types: { key: Device["type"]; count: number }[];
    vendors: { key: string; count: number }[];
  };
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    assetsOverview: build.query<AssetsOverview, AssetsOverviewQuery>({
      query: (params) => ({ url: "devices/assets-overview", params }),
      providesTags: ["Devices"],
    }),
  }),
});
export const { useAssetsOverviewQuery } = api;

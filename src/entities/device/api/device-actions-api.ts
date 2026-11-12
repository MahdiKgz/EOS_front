import type { fortiObjectActionLabels } from "../model/fortigate-object-actions";
import { baseApi } from "@/shared/api/base-api";
export type FortiActionInput = {
  action:
    | "interface.alias"
    | "interface.role"
    | "interface.state"
    | "interface.ip"
    | "interface.vlan"
    | "interface.allowaccess"
    | keyof typeof fortiObjectActionLabels;
  name: string;
  value: string;
  vdom?: string;
  parent?: string;
  vlanId?: string;
  addressType?: string;
  endIp?: string;
  serviceProtocol?: string;
  udpPorts?: string;
  start?: string;
  end?: string;
  srcInterface?: string;
  dstInterface?: string;
  srcAddresses?: string;
  dstAddresses?: string;
  services?: string;
  schedule?: string;
  policyAction?: string;
  nat?: boolean;
  logTraffic?: string;
  policyStatus?: string;
  sourceCidr?: string;
  relativeTo?: string;
  position?: string;
  destinationCidr?: string;
  gateway?: string;
  primaryDns?: string;
  secondaryDns?: string;
  ntpServer?: string;
  targetVdom?: string;
  vdomShortName?: string;
  vdomDescription?: string;
  haMode?: string;
  haGroup?: string;
  haPriority?: string;
  sdwanZone?: string;
  sdwanMembers?: string;
  probeServer?: string;
  adminProfile?: string;
  accountVdoms?: string;
  adminSecretId?: string;
  intrazone?: string;
  externalIp?: string;
  mappedIp?: string;
  externalPort?: string;
  mappedPort?: string;
};
export type ActionPreview = {
  id: string;
  action: string;
  name: string;
  vdom: string | null;
  before: Record<string, string | null>;
  after: Record<string, string>;
  commands: string[];
  checks?: Record<string, string>;
  message: string;
  expiresAt: string;
};
export type ActionOutcome = {
  id: string;
  status: string;
  connectorInvoked: boolean;
  verified: boolean;
  targetId?: string;
};
const api = baseApi.injectEndpoints({
  endpoints: (build) => ({
    deviceActions: build.query<
      {
        companyId: string | null;
        items: {
          id: string;
          action: string;
          status: string;
          connectorInvoked: boolean;
          errorCode: string | null;
          createdAt: string;
          completedAt: string | null;
          canVerify: boolean;
          actorName: string | null;
          targetName: string | null;
          targetId?: string | null;
          vdom: string | null;
        }[];
      },
      { id: string; companyId?: string | null }
    >({ query: ({ id }) => `devices/${id}/actions`, providesTags: ["Devices"] }),
    previewDeviceAction: build.mutation<ActionPreview, { id: string; body: FortiActionInput }>({
      query: ({ id, body }) => ({
        url: `devices/${id}/actions/preview`,
        method: "POST",
        body,
        timeout: 180000,
      }),
      invalidatesTags: ["Devices"],
    }),
    verifyDeviceAction: build.mutation<ActionOutcome, { id: string; planId: string }>({
      query: ({ id, planId }) => ({
        url: `devices/${id}/actions/${planId}/verify`,
        method: "POST",
        body: {},
        timeout: 180000,
      }),
      invalidatesTags: ["Devices"],
    }),
    executeDeviceAction: build.mutation<ActionOutcome, { id: string; planId: string }>({
      query: ({ id, planId }) => ({
        url: `devices/${id}/actions/${planId}/execute`,
        method: "POST",
        body: { intent: "execute", confirmed: true },
        timeout: 180000,
      }),
      invalidatesTags: ["Devices"],
    }),
  }),
});
export const {
  useDeviceActionsQuery,
  usePreviewDeviceActionMutation,
  useExecuteDeviceActionMutation,
  useVerifyDeviceActionMutation,
} = api;

import { baseApi } from "@/shared/api/base-api";
import type { DeviceInput } from "../model/types";
export type RecorderConnectionInput = {
  mode?: "auto" | "onvif" | "appweb" | "dvrip" | "rtsp";
  username: string;
  password: string;
  https: boolean;
  rtspPath?: string;
  onvifPath?: string;
};
export type RecorderVerificationInput = Partial<RecorderConnectionInput> & {
  useSaved?: boolean;
  saveConnection?: boolean;
};
export type RecorderReport = {
  checkedAt: string;
  profiles?: {
    token: string;
    name: string;
    width: number | null;
    height: number | null;
    fps: number | null;
    encoding: string | null;
    audioEncoding: string | null;
  }[];
  configuredChannels?: number | null;
  channels:
    | {
        index: number;
        recording: boolean | null;
        signalPresent: boolean | null;
        bitrateBps: number | null;
      }[]
    | null;
  disks:
    | {
        id: string;
        capacityBytes: number | null;
        freeBytes: number | null;
        reportedState: string;
      }[]
    | null;
};
const recorderApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    verifyDraftConnection: build.mutation<
      {
        verified: true;
        checkedAt: string;
        identity?: Record<string, string>;
        verificationToken: string;
      },
      { device: DeviceInput; recorder?: RecorderConnectionInput; saveRecorderConnection?: boolean }
    >({
      query: (body) => ({ url: "devices/draft-connection", method: "POST", body, timeout: 210000 }),
    }),
    verifyRecorderConnection: build.mutation<
      { checkedAt: string },
      { id: string; body: RecorderVerificationInput }
    >({
      query: ({ id, body }) => ({ url: `devices/${id}/verify-recorder`, method: "POST", body }),
      invalidatesTags: ["Devices"],
    }),
    inspectRecorder: build.mutation<RecorderReport, string>({
      query: (id) => ({ url: `devices/${id}/inspect-recorder`, method: "POST", body: {} }),
    }),
    recorderSnapshot: build.mutation<{ jpeg: string }, { id: string; token: string }>({
      query: ({ id, token }) => ({
        url: `devices/${id}/recorder-snapshot`,
        method: "POST",
        body: { token },
      }),
    }),
    verifyRecorderStream: build.mutation<{ checkedAt: string }, { id: string; token: string }>({
      query: ({ id, token }) => ({
        url: `devices/${id}/verify-recorder-stream`,
        method: "POST",
        body: { token },
      }),
    }),
  }),
});
export const {
  useVerifyDraftConnectionMutation,
  useVerifyRecorderConnectionMutation,
  useInspectRecorderMutation,
  useRecorderSnapshotMutation,
  useVerifyRecorderStreamMutation,
} = recorderApi;

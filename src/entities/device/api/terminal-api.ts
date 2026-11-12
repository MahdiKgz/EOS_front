import { baseApi } from "@/shared/api/base-api";
export type TerminalInfo = {
  device: { id: string; name: string; host: string; port: number; vendor: string };
  supported: boolean;
  credentialsConfigured: boolean;
  username: string | null;
  fingerprint: string | null;
  activeSessions: number;
  events: {
    id: string;
    action: "requested" | "connected" | "closed";
    reason: string | null;
    actorName: string;
    occurredAt: string;
    durationMs: string | null;
    inputBytes: string | null;
    outputBytes: string | null;
  }[];
};
export type TerminalPreview = {
  previewId: string;
  expiresAt: string;
  device: TerminalInfo["device"];
  username: string;
  fingerprint: string;
};
export type TerminalRead = {
  id: string;
  state: "connecting" | "connected" | "closed";
  reason: string | null;
  data: string;
  cursor: number;
  truncated: boolean;
  hasMore: boolean;
};
const path = (deviceId: string) => `devices/${deviceId}/terminal`;
const terminalApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    terminalInfo: build.query<TerminalInfo, string>({
      query: (id) => path(id),
      keepUnusedDataFor: 0,
    }),
    previewTerminal: build.mutation<TerminalPreview, string>({
      query: (id) => ({ url: `${path(id)}/preview`, method: "POST", body: {} }),
    }),
    openTerminal: build.mutation<
      { id: string; state: string },
      { deviceId: string; previewId: string; cols: number; rows: number }
    >({
      query: ({ deviceId, ...body }) => ({
        url: `${path(deviceId)}/sessions`,
        method: "POST",
        body: { ...body, intent: "execute", confirmed: true },
      }),
    }),
    readTerminal: build.mutation<
      TerminalRead,
      { deviceId: string; sessionId: string; cursor: number }
    >({
      query: ({ deviceId, sessionId, cursor }) => ({
        url: `${path(deviceId)}/sessions/${sessionId}?cursor=${cursor}`,
        method: "GET",
      }),
    }),
    inputTerminal: build.mutation<
      { accepted: boolean; sequence: number },
      { deviceId: string; sessionId: string; sequence: number; data: string }
    >({
      query: ({ deviceId, sessionId, ...body }) => ({
        url: `${path(deviceId)}/sessions/${sessionId}/input`,
        method: "POST",
        body,
      }),
    }),
    resizeTerminal: build.mutation<
      { resized: boolean },
      { deviceId: string; sessionId: string; cols: number; rows: number }
    >({
      query: ({ deviceId, sessionId, ...body }) => ({
        url: `${path(deviceId)}/sessions/${sessionId}/resize`,
        method: "POST",
        body,
      }),
    }),
    closeTerminal: build.mutation<{ closed: boolean }, { deviceId: string; sessionId: string }>({
      query: ({ deviceId, sessionId }) => ({
        url: `${path(deviceId)}/sessions/${sessionId}/close`,
        method: "POST",
        body: {},
        keepalive: true,
      }),
    }),
  }),
});
export const {
  useTerminalInfoQuery,
  usePreviewTerminalMutation,
  useOpenTerminalMutation,
  useReadTerminalMutation,
  useInputTerminalMutation,
  useResizeTerminalMutation,
  useCloseTerminalMutation,
} = terminalApi;

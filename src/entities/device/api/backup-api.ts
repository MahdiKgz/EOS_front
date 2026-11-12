import { baseApi } from "@/shared/api/base-api";

export type BackupFile = {
  id: string;
  filename: string;
  sha256: string;
  byteLength: number;
  createdAt: string;
  origin: "collected" | "uploaded";
  deviceType: string;
};
export type BackupReview = BackupFile & {
  vendor: string;
  identity: { version: string; model: string; serial?: string };
  files: { path: string; bytes: number; sha256: string; kind: "file" | "directory" | "symlink" }[];
};
export type BackupCatalogFile = BackupFile & {
  deviceId: string;
  deviceName: string;
  host: string;
  companyId: string | null;
  companyName: string | null;
};
export type BackupCatalogQuery = {
  search?: string;
  companyId?: string;
  origin?: string;
  page: number;
};
export type RestorePreview = {
  id: string;
  filename: string;
  sha256: string;
  deviceName: string;
  host: string;
  expiresAt: string;
  vendor: "linux" | "cisco" | "mikrotik" | "fortigate";
  method: "etc_overlay" | "replace_running" | "import_merge" | "native_scp";
  connectorInvoked: false;
};
export type DeviceRestore = {
  id: string;
  filename: string;
  sha256: string;
  actorName: string;
  status: "ready" | "running" | "succeeded" | "failed";
  state: string;
  connectorInvoked: boolean;
  safetyBackupId: string | null;
  createdAt: string;
  expiresAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  interrupted: boolean;
  expired: boolean;
  vendor: RestorePreview["vendor"];
};
export type BackupEvent = {
  id: string;
  action: "created" | "failed" | "downloaded" | "file_deleted" | "history_cleared" | "uploaded";
  actorName: string;
  occurredAt: string;
  filename?: string | null;
  durationMs?: number | null;
  failureCode?: string | null;
  deletedCount?: number | null;
};
export type BackupActivity = BackupEvent & {
  deviceId: string;
  actorUsername: string | null;
  deviceName: string;
  host: string;
  vendor: string;
  companyName: string | null;
  byteLength: number | null;
  sha256: string | null;
  backupId: string | null;
};
export const backupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    backupActivity: builder.query<
      { items: BackupActivity[]; total: number; page: number; pageSize: number },
      { page: number; companyId?: string; event?: string; search?: string }
    >({
      query: (params) => ({ url: "devices/backup-activity", params }),
      providesTags: ["Devices"],
    }),
    verifyDeviceRestore: builder.mutation<
      { id: string; verified: true },
      { deviceId: string; planId: string }
    >({
      query: ({ deviceId, planId }) => ({
        url: `devices/${deviceId}/backup-restores/${planId}/verify`,
        method: "POST",
        body: {},
        timeout: 210000,
      }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    deviceRestores: builder.query<{ items: DeviceRestore[] }, string>({
      query: (id) => `devices/${id}/backup-restores`,
      providesTags: ["Devices"],
    }),
    previewDeviceRestore: builder.mutation<
      RestorePreview,
      { deviceId: string; artifactId: string }
    >({
      query: ({ deviceId, ...body }) => ({
        url: `devices/${deviceId}/backup-restore-preview`,
        method: "POST",
        body,
        timeout: 270000,
      }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    executeDeviceRestore: builder.mutation<
      { id: string; status: "running" },
      { deviceId: string; planId: string; sha256: string; fullEtc: boolean }
    >({
      query: ({ deviceId, planId, sha256, fullEtc }) => ({
        url: `devices/${deviceId}/backup-restores/${planId}/execute`,
        method: "POST",
        body: {
          intent: "execute",
          confirmation: "RESTORE BACKUP",
          ...(fullEtc ? { fullEtcConfirmation: "RESTORE FULL ETC" } : {}),
          sha256,
        },
      }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    backupCatalog: builder.query<
      {
        items: BackupCatalogFile[];
        total: number;
        deviceCount: number;
        totalBytes: string;
        page: number;
        pageSize: number;
      },
      BackupCatalogQuery
    >({
      query: (params) => ({ url: "devices/backups-catalog", params }),
      providesTags: ["Devices"],
    }),
    uploadDeviceBackup: builder.mutation<BackupFile, { deviceId: string; file: File }>({
      query: ({ deviceId, file }) => ({
        url: `devices/${deviceId}/backup-upload`,
        method: "POST",
        // fetchBaseQuery lets the browser derive binary Content-Type from the Blob.
        body: file.slice(0, file.size, "application/octet-stream"),
        headers: {
          "x-backup-filename": encodeURIComponent(file.name),
        },
        timeout: 90000,
      }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    reviewDeviceBackup: builder.query<BackupReview, { deviceId: string; id: string }>({
      query: ({ deviceId, id }) => `devices/${deviceId}/backups/${id}/review`,
      providesTags: ["Devices"],
      keepUnusedDataFor: 0,
    }),
    deviceBackups: builder.query<
      {
        profile: { key: string; extension: string; scope: string } | null;
        canRestore: boolean;
        canExecuteRestore: boolean;
        files: BackupFile[];
        events: BackupEvent[];
        totalEvents: number;
        page: number;
        pageSize: number;
      },
      { deviceId: string; event?: string; search?: string; page: number }
    >({
      query: ({ deviceId, ...params }) => ({ url: `devices/${deviceId}/backups`, params }),
      providesTags: ["Devices"],
    }),
    previewBackupHistory: builder.mutation<
      { count: number; selectionToken?: string },
      {
        deviceId?: string;
        companyId?: string;
        event?: string;
        search?: string;
        eventId?: string;
      }
    >({
      query: ({ deviceId, companyId, ...fields }) => ({
        url: deviceId
          ? `devices/${deviceId}/backup-history-preview`
          : "devices/backup-activity-preview",
        method: "POST",
        body: { ...fields, ...(!deviceId && companyId ? { companyId } : {}) },
      }),
    }),
    clearBackupHistory: builder.mutation<
      { deleted: number },
      { deviceId?: string; selectionToken: string }
    >({
      query: ({ deviceId, ...body }) => ({
        url: deviceId
          ? `devices/${deviceId}/backup-history-clear`
          : "devices/backup-activity-clear",
        method: "POST",
        body,
      }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    createDeviceBackup: builder.mutation<BackupFile, string>({
      query: (id) => ({ url: `devices/${id}/backups`, method: "POST", timeout: 90000 }),
      invalidatesTags: ["Devices"],
    }),
    downloadDeviceBackup: builder.mutation<
      { filename: string; sha256: string; content: string },
      { deviceId: string; id: string }
    >({
      query: ({ deviceId, id }) => `devices/${deviceId}/backups/${id}`,
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
    deleteDeviceBackup: builder.mutation<{ deleted: boolean }, { deviceId: string; id: string }>({
      query: ({ deviceId, id }) => ({ url: `devices/${deviceId}/backups/${id}`, method: "DELETE" }),
      invalidatesTags: (result) => (result ? ["Devices"] : []),
    }),
  }),
});
export const {
  useBackupActivityQuery,
  useVerifyDeviceRestoreMutation,
  useDeviceRestoresQuery,
  usePreviewDeviceRestoreMutation,
  useExecuteDeviceRestoreMutation,
  useBackupCatalogQuery,
  useUploadDeviceBackupMutation,
  useReviewDeviceBackupQuery,
  usePreviewBackupHistoryMutation,
  useClearBackupHistoryMutation,
  useDeviceBackupsQuery,
  useCreateDeviceBackupMutation,
  useDownloadDeviceBackupMutation,
  useDeleteDeviceBackupMutation,
} = backupApi;

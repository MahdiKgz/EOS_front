export * from "./model/types";
export { useAssetsOverviewQuery } from "./api/assets-overview-api";
export type {
  AssetsFilter,
  AssetsOverview,
  AssetsOverviewQuery,
  OverviewAsset,
} from "./api/assets-overview-api";
export {
  useTerminalInfoQuery,
  usePreviewTerminalMutation,
  useOpenTerminalMutation,
  useReadTerminalMutation,
  useInputTerminalMutation,
  useResizeTerminalMutation,
  useCloseTerminalMutation,
} from "./api/terminal-api";
export type { TerminalInfo, TerminalPreview, TerminalRead } from "./api/terminal-api";
export {
  useDevicesQuery,
  useDeviceCompaniesQuery,
  useDeviceCredentialsQuery,
  useDeviceQuery,
  useDeviceHistoryQuery,
  useDeviceInventoryEventsQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useArchiveDeviceMutation,
  useRestoreDeviceMutation,
  useTestDeviceConnectionMutation,
} from "./api/device-api";
export { DeviceIcon } from "./ui/device-icon";
export {
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
} from "./api/backup-api";
export type {
  BackupFile,
  BackupReview,
  BackupCatalogFile,
  BackupCatalogQuery,
  BackupActivity,
  RestorePreview,
  DeviceRestore,
} from "./api/backup-api";

export {
  useInspectRecorderMutation,
  useVerifyDraftConnectionMutation,
  useVerifyRecorderConnectionMutation,
  useRecorderSnapshotMutation,
  useVerifyRecorderStreamMutation,
} from "./api/recorder-api";
export type { RecorderReport } from "./api/recorder-api";

export type { RecorderConnectionInput, RecorderVerificationInput } from "./api/recorder-api";

export {
  useRegistrationDraftQuery,
  useSaveRegistrationDraftMutation,
  useDeleteRegistrationDraftMutation,
} from "./api/registration-draft-api";

export {
  useSaveSshCredentialMutation,
  useDeleteSshCredentialMutation,
  useSnmpCredentialsQuery,
  useSaveSnmpCredentialMutation,
  useDeleteSnmpCredentialMutation,
  useDeviceChannelsQuery,
  useConfigureDeviceChannelMutation,
  useToggleDeviceChannelMutation,
  useTestDeviceChannelMutation,
} from "./api/channel-api";
export type {
  SnmpCredential,
  SnmpCredentialInput,
  DeviceChannels,
  ChannelInput,
} from "./api/channel-api";
export {
  useApiCredentialsQuery,
  useSaveApiCredentialMutation,
  useDeleteApiCredentialMutation,
  useAssignApiCredentialMutation,
  useInspectEsxiMutation,
  useInspectNetworkApiMutation,
} from "./api/vendor-api";
export type { ApiCredential, ApiCredentialInput, EsxiInventory } from "./api/vendor-api";

export type {
  NetworkApiInventory,
  MikroTikInventory,
  SophosInventory,
} from "./api/network-inventory-types";

export { channelMethods } from "./model/channel-methods";
export type { ChannelMethod } from "./model/channel-methods";
export type { ApiInventory } from "./api/vendor-api";
export {
  useDeviceMonitoringQuery,
  useConfigureMonitoringMutation,
  useCollectMonitoringMutation,
} from "./api/monitoring-api";
export type { MonitoringRange, MonitoringReport, MonitorSource } from "./api/monitoring-api";
export { useVendorCatalogQuery, useVendorDetailQuery } from "./api/vendor-catalog-api";
export type {
  VendorDefinition,
  VendorCatalog,
  VendorDetail,
  VendorQuery,
  VendorDeviceQuery,
  SupportState,
} from "./api/vendor-catalog-api";
export {
  useDeviceCapabilitiesQuery,
  useRefreshDeviceCapabilitiesMutation,
} from "./api/capability-api";
export type { DeviceCapabilities, CiscoCollection, CiscoSection } from "./api/capability-api";

export {
  useCiscoEnableCredentialsQuery,
  useSaveCiscoEnableCredentialMutation,
  useDeleteCiscoEnableCredentialMutation,
  useCiscoAccessQuery,
  useSaveCiscoAccessMutation,
} from "./api/cisco-access-api";
export type { EnableCredential, CiscoAccess } from "./api/cisco-access-api";

export { useFortigateCapabilitiesQuery } from "./api/fortigate-api";
export type {
  FortiCapabilities,
  FortiCollection,
  FortiTable,
  FortiDailyCheck,
  FortiLogs,
} from "./api/fortigate-api";

export {
  useDeviceActionsQuery,
  usePreviewDeviceActionMutation,
  useExecuteDeviceActionMutation,
  useVerifyDeviceActionMutation,
} from "./api/device-actions-api";
export type { FortiActionInput, ActionPreview, ActionOutcome } from "./api/device-actions-api";

export {
  isFortiPolicyCreate,
  fortiObjectActionLabels,
  fortiActionResources,
  fortiResourceTables,
} from "./model/fortigate-object-actions";
export {
  useDeviceSecretsQuery,
  useSaveDeviceSecretMutation,
  useDeleteDeviceSecretMutation,
} from "./api/device-secret-api";
export type { DeviceSecret } from "./api/device-secret-api";

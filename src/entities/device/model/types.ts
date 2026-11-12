export const deviceTypeLabels = {
  linux_edge: "Linux",
  esxi: "VMware ESXi",
  mikrotik: "MikroTik",
  fortigate: "FortiGate",
  cisco: "Cisco",
  pfsense: "pfSense",
  generic_syslog_source: "منبع Syslog",
  generic_firewall: "سایر تجهیزات شبکه",
  nvr: "NVR",
  dvr: "DVR",
  camera: "دوربین IP",
} as const;
export const statusLabels = {
  unknown: "بررسی‌نشده",
  online: "آنلاین",
  offline: "آفلاین",
  error: "خطا",
} as const;
export const environmentLabels = {
  production: "عملیاتی",
  staging: "پیش‌تولید",
  lab: "آزمایشگاه",
} as const;
export type DeviceType = keyof typeof deviceTypeLabels;
export type DeviceCompany = { id: string; name: string };
export type DeviceCredential = { id: string; name: string; username: string };
export type CiscoAccessOptions = {
  compatibilityProfile: "modern" | "legacy_cisco";
  enableCredentialId?: string | null;
};
export type DeviceInput = {
  ciscoProfile?: CiscoAccessOptions;
  apiCredentialId?: string | null;
  companyId?: string | null;
  credentialId?: string | null;
  accessRoute?: "direct";

  name: string;
  vendor: string;
  type: DeviceType;
  host: string;
  location?: string | null;
  managementPort: number;
  protocol: "ssh" | "api" | "syslog" | "agent";
  environment: keyof typeof environmentLabels;
  tags: string[];
};
export type Device = DeviceInput & {
  id: string;
  status: keyof typeof statusLabels;
  lastSeenAt: string | null;
  verification?: { checkedAt: string; identity?: Record<string, string> } | null;
  createdAt: string;
  updatedAt: string;
};
export type DeviceListQuery = {
  companyId?: string;
  inventory?: "archived";
  search?: string;
  type?: string;
  status?: string;
  environment?: string;
  category?: string;
  sort?: string;
  direction?: string;
  page: number;
  pageSize: number;
};
export type DeviceStats = { total: number; online: number; needsReview: number; unknown: number };
export type DeviceList = {
  items: Device[];
  total: number;
  page: number;
  pageSize: number;
  stats: DeviceStats;
};

export type DeviceCheck = {
  id: number;
  host: string;
  status: "online" | "offline";
  latencyMs: number | null;
  checkedAt: string;
};

export function deviceApiKind(
  device: Pick<DeviceInput, "type" | "vendor" | "protocol">,
): "esxi" | "mikrotik" | "sophos" | null {
  if (device.protocol !== "api") return null;
  if (device.type === "esxi") return "esxi";
  if (device.type === "mikrotik") return "mikrotik";
  if (device.type === "generic_firewall" && /^sophos(?:[ _-]firewall)?$/i.test(device.vendor))
    return "sophos";
  return null;
}

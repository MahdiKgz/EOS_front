export type InventoryRow = Record<string, string | number | boolean | null>;
export type MikroTikInventory = {
  kind: "mikrotik";
  identity: string;
  routerosVersion: string;
  architecture: string;
  uptime: string;
  cpuLoad: number | null;
  cpuCount: number | null;
  memoryFree: number | null;
  memoryTotal: number | null;
  storageFree: number | null;
  storageTotal: number | null;
  sections: Record<string, InventoryRow[]>;
  interfaceCounters: { name: string; rxBytes: number; txBytes: number }[];
  warnings: { section: string; code: string }[];
  collectedAt: string;
};

export type SophosInterface = {
  name: string;
  hardware: string;
  zone?: string;
  ipAddresses: string[];
  netmask?: string;
  macAddress?: string;
  speed?: string;
  operationalStatus: "up" | "down" | "unknown";
  administrativeStatus: "up" | "down" | "unknown";
};

export type SophosInventory = {
  kind: "sophos";
  product: "Sophos Firewall";
  apiVersion?: string;
  interfaces: SophosInterface[];
  zones: string[];
  gateways: string[];
  firewallRules: Array<{
    name: string;
    status: "enabled" | "disabled" | "unknown";
    action?: string;
    sourceZones: string[];
    destinationZones: string[];
    services: string[];
  }>;
  ipHosts: Array<{
    name: string;
    address?: string;
    hostType?: string;
    netmask?: string;
    ipFamily?: string;
  }>;
  services: Array<{ name: string; protocol?: string; ports: string[] }>;
  vpnConnections: Array<{
    name: string;
    status?: string;
    runtimeState?: "unknown";
    connectionType?: string;
    profile?: string;
    wanInterface?: string;
    remoteGateway?: string;
    localSubnet?: string;
    remoteNetworks?: string[];
    localId?: string;
    remoteId?: string;
    startupMode?: string;
    authenticationType?: string;
  }>;
  vpnProfiles?: Array<{
    name: string;
    keyingMethod?: string;
    ikeVersion?: string;
    phase1Encryption: string[];
    phase2Encryption: string[];
    phase1Authentication: string[];
    phase2Authentication: string[];
    dhGroups: string[];
  }>;
  collectionWarnings?: string[];
  collectedModules?: string[];
  collectedAt: string;
};
export type NetworkApiInventory = MikroTikInventory | SophosInventory;

export const channelMethods = {
  ssh: { label: "SSH خواندنی ESXi", port: 22 },
  snmpv3: { label: "SNMPv3", port: 161 },
  soap_api: { label: "SOAP API (ESXi)", port: 443 },
  rest_api: { label: "REST API (MikroTik)", port: 443 },
} as const;
export type ChannelMethod = keyof typeof channelMethods;

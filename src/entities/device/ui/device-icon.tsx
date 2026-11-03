import { Camera, Network, Router, Server, Shield, ShieldCheck, Wifi } from "lucide-react";
import styles from "./device-icon.module.css";
export function DeviceIcon({ vendor, type }: { vendor?: string; type?: string }) {
  const name = vendor?.toLowerCase() ?? type ?? "";
  const key = name.includes("mikrotik")
    ? "mikrotik"
    : name.includes("forti")
      ? "fortigate"
      : name.includes("cisco")
        ? "cisco"
        : name.includes("sophos")
          ? "sophos"
          : ["nvr", "dvr"].includes(type ?? "")
            ? "recorder"
            : name.includes("linux") || name.includes("vmware") || type === "esxi"
              ? "server"
              : "generic";
  const Icon = {
    mikrotik: Wifi,
    fortigate: Shield,
    cisco: Router,
    sophos: ShieldCheck,
    recorder: Camera,
    server: Server,
    generic: Network,
  }[key];
  return (
    <span className={styles.icon} data-vendor={key}>
      <Icon aria-hidden="true" />
    </span>
  );
}

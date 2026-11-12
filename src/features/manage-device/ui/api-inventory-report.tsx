import type { ApiInventory } from "@/entities/device";
import { EsxiReport } from "./esxi-connection";
import { MikroTikReport, SophosReport } from "./network-api-connection";
export function ApiInventoryReport({ inventory }: { inventory: ApiInventory }) {
  if (inventory.kind === "esxi") return <EsxiReport report={inventory} />;
  if (inventory.kind === "mikrotik") return <MikroTikReport report={inventory} />;
  return <SophosReport report={inventory} />;
}

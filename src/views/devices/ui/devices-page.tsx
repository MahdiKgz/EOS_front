import { requireUser } from "@/entities/user/server";
import { DevicesWorkspace } from "./devices-workspace";
import { AssetsOverviewWorkspace } from "./assets-overview-workspace";
import type { User } from "@/entities/user";
export function RecorderInventoryPage({ user }: { user: User }) {
  return <DevicesWorkspace user={user} recorderInventory />;
}
export async function DevicesPage() {
  const user = await requireUser();
  return <DevicesWorkspace user={user} />;
}
export async function AssetsOverviewPage() {
  const user = await requireUser();
  return <AssetsOverviewWorkspace userId={user.id} />;
}

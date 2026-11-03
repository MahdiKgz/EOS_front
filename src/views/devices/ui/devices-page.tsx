import { requireUser } from "@/entities/user/server";
import { DevicesWorkspace } from "./devices-workspace";
export async function DevicesPage() {
  const user = await requireUser();
  return <DevicesWorkspace user={user} />;
}
export async function AssetsOverviewPage() {
  const user = await requireUser();
  return <DevicesWorkspace user={user} overview />;
}

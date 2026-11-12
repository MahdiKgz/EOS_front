import { requireUser } from "@/entities/user/server";
import { RecorderInventoryPage } from "@/views/devices";
export default async function CamerasPage() {
  const user = await requireUser();
  return <RecorderInventoryPage user={user} />;
}

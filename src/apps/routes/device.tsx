import { notFound } from "next/navigation";
import { requireUser } from "@/entities/user/server";
import { DeviceWorkspace } from "@/views/devices";

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) notFound();
  const user = await requireUser();
  return <DeviceWorkspace id={id} canWrite={user.role !== "co_employee"} />;
}

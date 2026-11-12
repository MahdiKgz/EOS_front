import { notFound } from "next/navigation";
import { requireUser } from "@/entities/user/server";
import { DeviceTerminal } from "@/features/manage-device";
export default async function DeviceTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) notFound();
  const user = await requireUser();
  if (user.role === "co_employee")
    return <main className="p-6 text-sm">دسترسی به ترمینال برای نقش شما فعال نیست.</main>;
  return <DeviceTerminal id={id} />;
}

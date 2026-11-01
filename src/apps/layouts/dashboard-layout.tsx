import { requireUser } from "@/entities/user/server";
import { DashboardShell } from "@/widgets/dashboard-shell";
import { iranYekan } from "@/shared/config/fonts";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className={iranYekan.variable}>
      <DashboardShell user={user}>{children}</DashboardShell>
    </div>
  );
}

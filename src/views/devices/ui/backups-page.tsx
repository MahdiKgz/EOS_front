import { requireUser } from "@/entities/user/server";
import { BackupsWorkspace } from "./backups-workspace";

export async function BackupsPage() {
  const user = await requireUser();
  if (user.role === "co_employee")
    return (
      <main className="p-6 text-sm text-muted-foreground">
        دسترسی به مخزن بک‌آپ برای نقش شما فعال نیست.
      </main>
    );
  return <BackupsWorkspace />;
}

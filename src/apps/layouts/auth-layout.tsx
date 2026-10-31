import { redirect } from "next/navigation";
import { getCurrentUser } from "@/entities/user/server";
import { AuthShell } from "@/widgets/auth-shell";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (await getCurrentUser()) redirect("/dashboard");
  return <AuthShell>{children}</AuthShell>;
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/shared/auth/config";
import { backendRequest } from "@/shared/auth/backend";
import type { User } from "../model/types";

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const response = await backendRequest("/auth/me", { token });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Session service unavailable");
  const data = await response.json() as { user: User };
  return data.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

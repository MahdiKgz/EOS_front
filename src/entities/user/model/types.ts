export type UserRole = "pl_admin" | "co_admin" | "co_employee";

export const userRoleLabels: Record<UserRole, string> = {
  pl_admin: "ادمین سامانه",
  co_admin: "ادمین شرکت",
  co_employee: "کارمند شرکت",
};

export type User = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  allowedSections: string[];
  workspaceOwnerId: string | null;
  createdAt: string;
  updatedAt: string;
};

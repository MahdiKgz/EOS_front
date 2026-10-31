import { requireUser, userRoleLabels } from "@/entities/user/server";
export async function DashboardPage() {
  const user = await requireUser();
  return <>

    <main className="mx-auto max-w-4xl px-6 py-14"><p className="mb-3 text-sm text-primary">حساب کاربری</p><h1 className="text-2xl font-bold leading-loose">{user.displayName}، خوش آمدید</h1><p className="mt-4 text-sm leading-8 text-muted-foreground">به حساب کاربری خود وارد شده‌اید.</p><dl className="mt-8 grid gap-6 rounded-xl border bg-card p-6 sm:grid-cols-2"><div><dt className="mb-2 text-sm text-muted-foreground">نام کاربری</dt><dd><bdi>{user.username}</bdi></dd></div><div><dt className="mb-2 text-sm text-muted-foreground">نقش</dt><dd>{userRoleLabels[user.role]}</dd></div>{user.email && <div><dt className="mb-2 text-sm text-muted-foreground">ایمیل</dt><dd><bdi>{user.email}</bdi></dd></div>}</dl></main>
  </>;
}

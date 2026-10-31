import { CheckApiForm } from "@/features/check-api";
export function HomePage() {
  return <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
    <header className="space-y-4"><p dir="ltr" className="text-right text-sm font-semibold tracking-widest text-primary">EOSNET / DEVELOPMENT</p><h1 className="text-3xl font-bold">زیرساخت بازنویسی EOSNet</h1><p className="leading-8 text-muted-foreground">پایه پروژه آماده است. قابلیت‌های سامانه در مراحل بعد اضافه می‌شوند.</p></header>
    <ul dir="ltr" className="flex flex-wrap gap-2 text-sm">{["Next.js 16", "TypeScript", "Feature-Sliced Design", "Tailwind CSS", "shadcn/ui", "React Hook Form"].map(item => <li key={item} className="rounded-md border px-3 py-2">{item}</li>)}</ul>
    <section aria-labelledby="connection-title" className="rounded-xl border bg-white p-6 shadow-sm"><h2 id="connection-title" className="mb-6 text-lg font-semibold">بررسی اتصال زیرساخت</h2><CheckApiForm /></section>
  </main>;
}

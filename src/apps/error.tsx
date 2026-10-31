"use client";
import { Button } from "@/shared/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return <main dir="rtl" className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-6 text-center"><h1 className="text-xl font-semibold">ارتباط با سامانه برقرار نشد</h1><p className="text-sm leading-8 text-muted-foreground">کمی بعد دوباره تلاش کنید.</p><Button onClick={reset}>تلاش دوباره</Button></main>;
}

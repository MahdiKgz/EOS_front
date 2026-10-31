import Link from "next/link";
import { RegisterForm } from "@/features/auth-forms";
import { AuthPageFrame } from "./auth-page-frame";

export function RegisterPage() {
  return <AuthPageFrame eyebrow="ایجاد حساب کاربری" title="ثبت نام در سامانه" description="برای ساخت حساب، اطلاعات زیر را وارد کنید." footer={<p>قبلاً ثبت نام کرده‌اید؟ <Link href="/login">وارد شوید</Link></p>}><RegisterForm /></AuthPageFrame>;
}

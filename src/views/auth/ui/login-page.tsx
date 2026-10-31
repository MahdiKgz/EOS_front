import Link from "next/link";
import { LoginForm } from "@/features/auth-forms";
import { AuthPageFrame } from "./auth-page-frame";

export function LoginPage() {
  return <AuthPageFrame eyebrow="خوش آمدید" title="ورود به سامانه" description="برای دسترسی به حساب خود، نام کاربری و رمز عبور را وارد کنید." footer={<p>حساب کاربری ندارید؟ <Link href="/register">ثبت نام کنید</Link></p>}><LoginForm /></AuthPageFrame>;
}

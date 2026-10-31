import Link from "next/link";
import { ForgetPasswordForm } from "@/features/auth-forms";
import { AuthPageFrame } from "./auth-page-frame";

export function ForgetPasswordPage() {
  return <AuthPageFrame eyebrow="بازیابی حساب" title="فراموشی رمز عبور" description="ایمیلی را که با آن ثبت نام کرده‌اید، وارد کنید." footer={<p>رمز عبور را به خاطر آوردید؟ <Link href="/login">بازگشت به ورود</Link></p>}><ForgetPasswordForm /></AuthPageFrame>;
}

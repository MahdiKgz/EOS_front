import Link from "next/link";
import { ResetPasswordForm } from "@/features/auth-forms";
import { AuthPageFrame } from "./auth-page-frame";
export async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
  return (
    <AuthPageFrame
      eyebrow="بازیابی حساب"
      title="تعیین رمز عبور جدید"
      description={
        valid
          ? "رمز جدید خود را وارد کنید."
          : "لینک بازیابی معتبر نیست. دوباره درخواست بازیابی ثبت کنید."
      }
      footer={
        <p>
          <Link href={valid ? "/login" : "/forget-password"}>
            {valid ? "بازگشت به ورود" : "درخواست لینک جدید"}
          </Link>
        </p>
      }
    >
      {valid ? <ResetPasswordForm token={token} /> : null}
    </AuthPageFrame>
  );
}

import { z } from "zod";

const username = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,63}$/,
    "نام کاربری باید ۳ تا ۶۴ کاراکتر انگلیسی، عدد، نقطه، خط تیره یا زیرخط باشد.",
  );
const email = z
  .string()
  .trim()
  .min(1, "ایمیل را وارد کنید.")
  .max(160)
  .pipe(z.email("ایمیل معتبر وارد کنید."));
const password = z
  .string()
  .min(1, "رمز عبور را وارد کنید.")
  .max(128, "رمز عبور بیش از حد طولانی است.");
const newPassword = password
  .min(12, "رمز عبور باید حداقل ۱۲ کاراکتر باشد.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "رمز عبور بیش از حد طولانی است؛ رمز کوتاه‌تری انتخاب کنید.",
  )
  .refine(
    (value) =>
      !["123456789012", "admin12345678", "password1234", "qwerty123456", "letmein123456"].includes(
        value.toLowerCase(),
      ),
    "رمز عبور رایج قابل استفاده نیست.",
  );
export const loginSchema = z.object({ username, password });
export const registerSchema = z
  .object({
    username,
    displayName: z
      .string()
      .trim()
      .min(2, "نام و نام خانوادگی را وارد کنید.")
      .max(80, "نام بیش از حد طولانی است."),
    email: z.union([z.literal(""), email]),
    phone: z
      .string()
      .trim()
      .refine(
        (value) => value === "" || /^\+?[0-9]{7,20}$/.test(value),
        "شماره تلفن معتبر وارد کنید.",
      ),
    password: newPassword,
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "تکرار رمز عبور یکسان نیست.",
    path: ["confirmPassword"],
  })
  .refine((values) => !values.password.toLowerCase().includes(values.username.toLowerCase()), {
    message: "رمز عبور نباید شامل نام کاربری باشد.",
    path: ["password"],
  });
export const forgetPasswordSchema = z.object({ email });
export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, "تکرار رمز عبور را وارد کنید."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "تکرار رمز عبور یکسان نیست.",
    path: ["confirmPassword"],
  });
export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgetPasswordValues = z.infer<typeof forgetPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

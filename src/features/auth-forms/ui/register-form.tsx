"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useRegisterMutation } from "@/entities/user";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { SubmitButton } from "@/shared/ui/submit-button";
import { registerSchema, type RegisterValues } from "../model/schema";
import { FormField, FormMessage } from "./form-field";
import styles from "./auth-forms.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [createAccount, { isLoading }] = useRegisterMutation();
  const locked = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isValid } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), mode: "onChange", defaultValues: { username: "", displayName: "", email: "", phone: "", password: "", confirmPassword: "" } });
  const pending = isLoading || isSubmitting || redirecting;
  async function submit(values: RegisterValues) {
    if (locked.current) return;
    locked.current = true; clearErrors("root");
    try {
      await createAccount({ username: values.username, displayName: values.displayName, email: values.email || undefined, phone: values.phone || undefined, password: values.password }).unwrap();
      setRedirecting(true); toast.success("حساب کاربری شما ایجاد شد."); router.replace("/dashboard"); router.refresh();
    } catch (error) { const message = apiErrorMessage(error); setError("root.server", { message }); toast.error(message); }
    finally { locked.current = false; }
  }
  return <form className={styles.form} onSubmit={event => { void handleSubmit(submit)(event); }} noValidate aria-busy={pending}>
    <fieldset className={styles.fields} disabled={pending}>
      <FormField id="register-name" label="نام و نام خانوادگی" error={errors.displayName?.message}>
        <Input id="register-name" autoComplete="name" maxLength={80} className="h-11" aria-invalid={!!errors.displayName} aria-describedby={errors.displayName ? "register-name-error" : undefined} {...register("displayName")} />
      </FormField>
      <FormField id="register-username" label="نام کاربری" error={errors.username?.message}>
        <Input id="register-username" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={64} placeholder="username" className="h-11" aria-invalid={!!errors.username} aria-describedby={errors.username ? "register-username-error" : undefined} {...register("username")} />
      </FormField>
      <FormField id="register-email" label="ایمیل (اختیاری)" error={errors.email?.message}>
        <Input id="register-email" type="email" dir="ltr" inputMode="email" autoComplete="email" maxLength={160} placeholder="name@example.com" className="h-11" aria-invalid={!!errors.email} aria-describedby={errors.email ? "register-email-error" : "register-email-hint"} {...register("email")} />
        <p id="register-email-hint" className={styles.hint}>برای بازیابی رمز عبور، ایمیل خود را ثبت کنید.</p>
      </FormField>
      <FormField id="register-phone" label="شماره تلفن (اختیاری)" error={errors.phone?.message}>
        <Input id="register-phone" type="tel" dir="ltr" inputMode="tel" autoComplete="tel" maxLength={21} className="h-11" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "register-phone-error" : undefined} {...register("phone")} />
      </FormField>
      <FormField id="register-password" label="رمز عبور" error={errors.password?.message}>
        <PasswordInput id="register-password" autoComplete="new-password" maxLength={128} placeholder="حداقل ۱۲ کاراکتر" aria-invalid={!!errors.password} aria-describedby={errors.password ? "register-password-error" : "register-password-hint"} {...register("password")} />
        <p id="register-password-hint" className={styles.hint}>حداقل ۱۲ کاراکتر، بدون نام کاربری.</p>
      </FormField>
      <FormField id="register-confirm" label="تکرار رمز عبور" error={errors.confirmPassword?.message}>
        <PasswordInput id="register-confirm" autoComplete="new-password" maxLength={128} aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "register-confirm-error" : undefined} {...register("confirmPassword")} />
      </FormField>
      <SubmitButton pending={pending} disabled={!isValid} pendingLabel="در حال ایجاد حساب…">ایجاد حساب کاربری</SubmitButton>
    </fieldset>
    <FormMessage message={errors.root?.server?.message} error />
  </form>;
}

"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useLoginMutation } from "@/entities/user";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { SubmitButton } from "@/shared/ui/submit-button";
import { loginSchema, type LoginValues } from "../model/schema";
import { FormField, FormMessage } from "./form-field";
import styles from "./auth-forms.module.css";

export function LoginForm() {
  const router = useRouter();
  const [login, { isLoading }] = useLoginMutation();
  const locked = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isValid } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: "onChange", defaultValues: { username: "", password: "" } });
  const pending = isLoading || isSubmitting || redirecting;
  async function submit(values: LoginValues) {
    if (locked.current) return;
    locked.current = true; clearErrors("root");
    try {
      await login(values).unwrap();
      setRedirecting(true); toast.success("با موفقیت وارد شدید."); router.replace("/dashboard"); router.refresh();
    } catch (error) { const message = apiErrorMessage(error); setError("root.server", { message }); toast.error(message); }
    finally { locked.current = false; }
  }
  return <form className={styles.form} onSubmit={event => { void handleSubmit(submit)(event); }} noValidate aria-busy={pending}>
    <fieldset className={styles.fields} disabled={pending}>
      <FormField id="login-username" label="نام کاربری" error={errors.username?.message}>
        <Input id="login-username" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="username" className="h-11" maxLength={64} aria-invalid={!!errors.username} aria-describedby={errors.username ? "login-username-error" : undefined} {...register("username")} />
      </FormField>
      <FormField id="login-password" label="رمز عبور" error={errors.password?.message} action={<Link href="/forget-password" aria-disabled={pending} tabIndex={pending ? -1 : undefined} onClick={event => { if (pending) event.preventDefault(); }}>فراموشی رمز عبور</Link>}>
        <PasswordInput id="login-password" autoComplete="current-password" maxLength={128} placeholder="رمز عبور خود را وارد کنید" aria-invalid={!!errors.password} aria-describedby={errors.password ? "login-password-error" : undefined} {...register("password")} />
      </FormField>
      <SubmitButton pending={pending} disabled={!isValid} pendingLabel="در حال ورود…">ورود به سامانه</SubmitButton>
    </fieldset>
    <FormMessage message={errors.root?.server?.message} error />
  </form>;
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "@/entities/user";
import { apiErrorMessage } from "@/shared/api/error-message";
import { PasswordInput } from "@/shared/ui/password-input";
import { SubmitButton } from "@/shared/ui/submit-button";
import { resetPasswordSchema, type ResetPasswordValues } from "../model/schema";
import { FormField, FormMessage } from "./form-field";
import styles from "./auth-forms.module.css";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const locked = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors, isSubmitting, isValid } } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), mode: "onChange", defaultValues: { password: "", confirmPassword: "" } });
  const pending = isLoading || isSubmitting || redirecting;
  async function submit(values: ResetPasswordValues) {
    if (locked.current) return;
    locked.current = true; clearErrors("root");
    try { const result = await resetPassword({ token, password: values.password }).unwrap(); setRedirecting(true); toast.success(result.message); router.replace("/login"); router.refresh(); }
    catch (error) { const message = apiErrorMessage(error); setError("root.server", { message }); toast.error(message); }
    finally { locked.current = false; }
  }
  return <form className={styles.form} onSubmit={event => { void handleSubmit(submit)(event); }} noValidate aria-busy={pending}>
    <fieldset className={styles.fields} disabled={pending}>
      <FormField id="reset-password" label="رمز عبور جدید" error={errors.password?.message}>
        <PasswordInput id="reset-password" autoComplete="new-password" maxLength={128} placeholder="حداقل ۱۲ کاراکتر" aria-invalid={!!errors.password} aria-describedby={errors.password ? "reset-password-error" : undefined} {...register("password")} />
      </FormField>
      <FormField id="reset-confirm" label="تکرار رمز عبور" error={errors.confirmPassword?.message}>
        <PasswordInput id="reset-confirm" autoComplete="new-password" maxLength={128} aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined} {...register("confirmPassword")} />
      </FormField>
      <SubmitButton pending={pending} disabled={!isValid} pendingLabel="در حال تغییر رمز…">ذخیره رمز جدید</SubmitButton>
    </fieldset>
    <FormMessage message={errors.root?.server?.message} error />
  </form>;
}

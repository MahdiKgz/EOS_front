"use client";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useForgetPasswordMutation } from "@/entities/user";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Input } from "@/shared/ui/input";
import { SubmitButton } from "@/shared/ui/submit-button";
import { forgetPasswordSchema, type ForgetPasswordValues } from "../model/schema";
import { FormField, FormMessage } from "./form-field";
import styles from "./auth-forms.module.css";

export function ForgetPasswordForm() {
  const [requestReset, { isLoading }] = useForgetPasswordMutation();
  const locked = useRef(false);
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgetPasswordValues>({
    resolver: zodResolver(forgetPasswordSchema),
    mode: "onChange",
    defaultValues: { email: "" },
  });
  const pending = isLoading || isSubmitting;
  async function submit(values: ForgetPasswordValues) {
    if (locked.current) return;
    locked.current = true;
    clearErrors("root");
    setSuccess("");
    try {
      const result = await requestReset(values).unwrap();
      setSuccess(result.message);
      toast.success(result.message);
    } catch (error) {
      const message = apiErrorMessage(error);
      setError("root.server", { message });
      toast.error(message);
    } finally {
      locked.current = false;
    }
  }
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      onChange={() => setSuccess("")}
      noValidate
      aria-busy={pending}
    >
      <fieldset className={styles.fields} disabled={pending}>
        <FormField id="forget-email" label="ایمیل حساب کاربری" error={errors.email?.message}>
          <Input
            id="forget-email"
            type="email"
            dir="ltr"
            inputMode="email"
            autoComplete="email"
            maxLength={160}
            placeholder="name@example.com"
            className="h-11"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "forget-email-error" : undefined}
            {...register("email")}
          />
        </FormField>
        <SubmitButton
          pending={pending}
          disabled={!isValid || !!success}
          pendingLabel="در حال ارسال درخواست…"
        >
          بازیابی رمز عبور
        </SubmitButton>
      </fieldset>
      <FormMessage message={errors.root?.server?.message} error />
      <FormMessage message={success} />
    </form>
  );
}

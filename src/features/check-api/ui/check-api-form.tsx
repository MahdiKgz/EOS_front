"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { env } from "@/shared/config/env";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { checkApiSchema, type CheckApiValues } from "../model/schema";
export function CheckApiForm() {
  const [result, setResult] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckApiValues>({
    resolver: zodResolver(checkApiSchema),
    defaultValues: { url: env.apiUrl },
  });
  async function onSubmit({ url }: CheckApiValues) {
    setResult("");
    try {
      const response = await fetch(`${url.replace(/\/$/, "")}/health`, {
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Health check failed");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("status" in data) || data.status !== "ok")
        throw new Error("Unexpected health response");
      setResult("اتصال به API و دیتابیس برقرار است.");
    } catch {
      setResult("اتصال برقرار نشد؛ اجرای بک‌اند، دیتابیس و آدرس API را بررسی کنید.");
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <label htmlFor="api-url" className="block text-sm font-medium">
        آدرس پایه API
      </label>
      <Input
        id="api-url"
        dir="ltr"
        type="url"
        aria-invalid={!!errors.url}
        aria-describedby={errors.url ? "url-error" : undefined}
        {...register("url")}
      />
      {errors.url && (
        <p id="url-error" role="alert" className="text-sm text-destructive">
          {errors.url.message}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "در حال بررسی…" : "بررسی اتصال"}
      </Button>
      <p role="status" aria-live="polite" className="text-sm leading-7">
        {result}
      </p>
    </form>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { LoaderCircle, RotateCcw } from "lucide-react";
import {
  type BackupFile,
  usePreviewDeviceRestoreMutation,
  useExecuteDeviceRestoreMutation,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";

export function RestoreBackupDialog({
  deviceId,
  file,
  onClose,
}: {
  deviceId: string;
  file: BackupFile;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [preview, preparing] = usePreviewDeviceRestoreMutation();
  const [execute, executing] = useExecuteDeviceRestoreMutation();
  const { register, handleSubmit, control, setValue } = useForm<{ confirmed: boolean }>({
    defaultValues: { confirmed: false },
  });
  const confirmed = useWatch({ control, name: "confirmed" });
  const [expiredPlan, setExpiredPlan] = useState<string>();
  const expired = !!preparing.data && expiredPlan === preparing.data.id;
  const lock = useRef(false);
  useEffect(() => {
    const request = preview({ deviceId, artifactId: file.id });
    return () => {
      request.abort();
    };
  }, [preview, deviceId, file.id]);
  useEffect(() => {
    const plan = preparing.data;
    if (!plan) return;
    const timer = setTimeout(
      () => setExpiredPlan(plan.id),
      Math.max(0, Date.parse(plan.expiresAt) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [preparing.data]);
  function reviewAgain() {
    setValue("confirmed", false);
    void preview({ deviceId, artifactId: file.id });
  }
  async function submit({ confirmed: accepted }: { confirmed: boolean }) {
    if (lock.current || !open || expired || !preparing.data || !accepted || preparing.isLoading)
      return;
    lock.current = true;
    try {
      await execute({
        deviceId,
        planId: preparing.data.id,
        sha256: preparing.data.sha256,
        fullEtc: preparing.data.vendor === "linux",
      }).unwrap();
      toast.success("بازیابی شروع شد. پیش از اعمال، بک‌آپ ایمنی گرفته می‌شود.");
      setOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
    }
  }
  return (
    <AnimatedDialog
      open={open}
      title="بازیابی تنظیمات تجهیز"
      description={file.filename}
      busy={executing.isLoading}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            type="submit"
            form="device-restore-form"
            variant="destructive"
            disabled={
              !open ||
              !confirmed ||
              expired ||
              !preparing.data ||
              preparing.isLoading ||
              !!preparing.error ||
              executing.isLoading
            }
          >
            {executing.isLoading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            {executing.isLoading ? "در حال شروع…" : "تأیید و شروع بازیابی"}
          </Button>
          <Button variant="outline" disabled={executing.isLoading} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      {preparing.isLoading ? (
        <p role="status" className="flex gap-2 text-sm">
          <LoaderCircle size={16} className="animate-spin" />
          در حال بررسی فایل و پیش‌نیازهای تجهیز؛ تنظیماتی تغییر نمی‌کند…
        </p>
      ) : preparing.error ? (
        <div role="alert" className="grid gap-3 text-sm">
          <p>{apiErrorMessage(preparing.error)}</p>
          <Button variant="outline" onClick={reviewAgain}>
            بررسی دوباره
          </Button>
        </div>
      ) : (
        preparing.data && (
          <form
            id="device-restore-form"
            className="grid gap-4 text-sm"
            onSubmit={(event) => void handleSubmit(submit)(event)}
          >
            <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3">
              <dt className="text-muted-foreground">تجهیز مقصد</dt>
              <dd>{preparing.data.deviceName}</dd>
              <dt className="text-muted-foreground">آدرس</dt>
              <dd>
                <bdi>{preparing.data.host}</bdi>
              </dd>
              <dt className="text-muted-foreground">اعتبار پیش‌نمایش</dt>
              <dd>
                {new Date(preparing.data.expiresAt).toLocaleTimeString("fa-IR", {
                  timeZone: "Asia/Tehran",
                })}
              </dd>
            </dl>
            <bdi className="break-all font-mono text-xs text-muted-foreground">
              SHA-256 {preparing.data.sha256}
            </bdi>
            <p className="leading-7 text-muted-foreground">
              پیش از بازیابی، نسخهٔ ایمنی از تنظیمات فعلی ذخیره می‌شود.{" "}
              {
                {
                  linux:
                    "فایل‌های آرشیو روی /etc اعمال و صحت آن‌ها بررسی می‌شود. دیتابیس و دیسک کامل بازیابی نمی‌شوند؛ سرویس‌ها خودکار راه‌اندازی مجدد نمی‌شوند.",
                  cisco:
                    "تنظیمات running-config جایگزین می‌شود. پس از خواندن دوباره و تأیید محتوا، زمان‌سنج بازگشت Cisco تأیید می‌شود.",
                  mikrotik:
                    "فایل ابتدا با dry-run بررسی و سپس با تنظیمات فعلی ادغام می‌شود. این عملیات تنظیمات قبلی را پاک نمی‌کند؛ نتیجه دوباره خوانده و بررسی می‌شود.",
                  fortigate:
                    "فایل به روش بومی SCP ارسال می‌شود. دریافت فایل به‌تنهایی تأیید بازیابی نیست؛ پس از آماده شدن تجهیز، نتیجه را از همین صفحه بررسی کنید.",
                }[preparing.data.vendor]
              }
            </p>
            <label className="flex items-start gap-2 rounded-lg border p-3 leading-7">
              <input
                type="checkbox"
                className="mt-2 accent-primary"
                disabled={executing.isLoading}
                {...register("confirmed", { required: true })}
              />
              {preparing.data.vendor === "linux"
                ? "بازیابی فایل‌های /etc این تجهیز با فایل انتخاب‌شده را تأیید می‌کنم."
                : "بازیابی تنظیمات این تجهیز با فایل انتخاب‌شده را تأیید می‌کنم."}
            </label>
            {expired && (
              <p role="alert" className="text-destructive">
                اعتبار پیش‌نمایش تمام شده است. دوباره بررسی کنید.
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={executing.isLoading}
              onClick={reviewAgain}
            >
              بررسی دوباره
            </Button>
          </form>
        )
      )}
    </AnimatedDialog>
  );
}

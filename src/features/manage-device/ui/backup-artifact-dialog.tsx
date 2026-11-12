"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FileSearch, LoaderCircle, Upload } from "lucide-react";
import {
  type BackupFile,
  useReviewDeviceBackupQuery,
  useUploadDeviceBackupMutation,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

export function UploadBackupDialog({
  deviceId,
  extension,
  onClose,
}: {
  deviceId: string;
  extension: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [upload, { isLoading }] = useUploadDeviceBackupMutation();
  const lock = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ file: FileList }>();
  async function submit({ file }: { file: FileList }) {
    if (lock.current) return;
    lock.current = true;
    try {
      await upload({ deviceId, file: file[0] }).unwrap();
      toast.success("فایل اعتبارسنجی و در مخزن بک‌آپ ذخیره شد.");
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
      title="افزودن فایل بک‌آپ"
      description="فایل تنظیمات همین تجهیز را انتخاب کنید. پس از بررسی قالب و محتوا، به‌صورت رمزنگاری‌شده ذخیره می‌شود."
      busy={isLoading}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="backup-upload-form" disabled={isLoading || !open}>
            {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
            {isLoading ? "در حال ارسال…" : "ارسال فایل"}
          </Button>
          <Button variant="outline" disabled={isLoading} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      <form
        id="backup-upload-form"
        onSubmit={(event) => void handleSubmit(submit)(event)}
        className="grid gap-3"
      >
        <label className="grid gap-2 text-sm">
          فایل بک‌آپ
          <Input
            type="file"
            accept={`.${extension}`}
            disabled={isLoading}
            aria-invalid={!!errors.file}
            aria-describedby="backup-file-help"
            {...register("file", {
              validate: {
                required: (files) => !!files?.[0] || "فایل بک‌آپ را انتخاب کنید.",
                size: (files) =>
                  !files?.[0] ||
                  (files[0].size > 0 && files[0].size <= 20 * 1024 * 1024) ||
                  "فایل باید خالی نباشد و حداکثر ۲۰ مگابایت باشد.",
              },
            })}
          />
        </label>
        <p id="backup-file-help" className="text-sm text-muted-foreground">
          قالب مورد انتظار: <bdi>{extension}</bdi> · حداکثر ۲۰ مگابایت. ارسال فایل، تنظیمات تجهیز را
          تغییر نمی‌دهد.
        </p>
        {errors.file && (
          <p role="alert" className="text-sm text-destructive">
            {errors.file.message}
          </p>
        )}
      </form>
    </AnimatedDialog>
  );
}

export function ReviewBackupDialog({
  deviceId,
  file,
  onClose,
}: {
  deviceId: string;
  file: BackupFile;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [visible, setVisible] = useState(50);
  const {
    currentData: data,
    isFetching,
    error,
    refetch,
  } = useReviewDeviceBackupQuery({ deviceId, id: file.id }, { skip: !open });
  return (
    <AnimatedDialog
      open={open}
      title="بررسی فایل بک‌آپ"
      description={file.filename}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <Button variant="outline" onClick={() => setOpen(false)}>
          بستن
        </Button>
      }
    >
      {isFetching ? (
        <p role="status" className="flex items-center gap-2 text-sm">
          <LoaderCircle className="animate-spin" size={16} />
          در حال بررسی فایل…
        </p>
      ) : error ? (
        <div role="alert" className="grid gap-3">
          <p>{apiErrorMessage(error)}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : (
        data && (
          <div className="grid gap-4 text-sm">
            <p className="flex items-center gap-2">
              <FileSearch size={18} className="text-primary" />
              قالب و صحت فایل بررسی شد.
            </p>
            <dl className="grid grid-cols-2 gap-3 rounded-lg border p-3">
              <dt className="text-muted-foreground">منبع</dt>
              <dd>{data.origin === "uploaded" ? "آپلود کاربر" : "دریافت از تجهیز"}</dd>
              <dt className="text-muted-foreground">اندازه</dt>
              <dd>{data.byteLength.toLocaleString("fa-IR")} بایت</dd>
              {!!data.identity.version && (
                <>
                  <dt className="text-muted-foreground">نسخه</dt>
                  <dd className="break-all">
                    <bdi>{data.identity.version}</bdi>
                  </dd>
                </>
              )}
              {!!data.identity.model && (
                <>
                  <dt className="text-muted-foreground">مدل</dt>
                  <dd className="break-all">
                    <bdi>{data.identity.model}</bdi>
                  </dd>
                </>
              )}
              {!!data.identity.serial && (
                <>
                  <dt className="text-muted-foreground">سریال</dt>
                  <dd className="break-all">
                    <bdi>{data.identity.serial}</bdi>
                  </dd>
                </>
              )}
            </dl>
            <bdi className="break-all font-mono text-xs text-muted-foreground">
              SHA-256 {data.sha256}
            </bdi>
            {data.vendor === "linux" && (
              <>
                <h3 className="font-semibold">
                  محتوای آرشیو /etc · {data.files.length.toLocaleString("fa-IR")} مسیر
                </h3>
                <ul className="grid gap-2">
                  {data.files.slice(0, visible).map((entry) => (
                    <li key={entry.path} className="grid gap-1 rounded-md border p-2">
                      <bdi className="break-all font-mono text-xs">{entry.path}</bdi>
                      <span className="text-xs text-muted-foreground">
                        {{ file: "فایل", directory: "پوشه", symlink: "پیوند" }[entry.kind]} ·{" "}
                        {entry.bytes.toLocaleString("fa-IR")} بایت
                      </span>
                    </li>
                  ))}
                </ul>
                {visible < data.files.length && (
                  <Button variant="outline" onClick={() => setVisible((count) => count + 50)}>
                    نمایش ۵۰ مسیر بعدی
                  </Button>
                )}
              </>
            )}
            <p className="text-muted-foreground">
              محتوای محرمانهٔ تنظیمات در این پیش‌نمایش نمایش داده نمی‌شود.
            </p>
          </div>
        )
      )}
    </AnimatedDialog>
  );
}

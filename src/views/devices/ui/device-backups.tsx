"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Archive,
  Download,
  FileSearch,
  LoaderCircle,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type BackupFile,
  useDeviceBackupsQuery,
  useCreateDeviceBackupMutation,
  useDownloadDeviceBackupMutation,
  useDeleteDeviceBackupMutation,
  useDeviceRestoresQuery,
  useVerifyDeviceRestoreMutation,
} from "@/entities/device";
import {
  ClearBackupHistoryDialog,
  UploadBackupDialog,
  ReviewBackupDialog,
  RestoreBackupDialog,
  saveVerifiedBackup,
  type BackupHistorySelection,
} from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
const timestamp = (value: string) =>
  new Date(value).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
const number = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });

function DeleteBackupDialog({
  file,
  deviceId,
  onClose,
}: {
  file: BackupFile;
  deviceId: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [remove, { isLoading }] = useDeleteDeviceBackupMutation();
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    try {
      await remove({ deviceId, id: file.id }).unwrap();
      toast.success("فایل بک‌آپ حذف شد.");
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
      title="حذف فایل بک‌آپ"
      description={`فایل «${file.filename}» برای همیشه حذف می‌شود. سابقهٔ عملیات باقی می‌ماند.`}
      busy={isLoading}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="destructive" disabled={isLoading || !open} onClick={() => void submit()}>
            {isLoading ? "در حال حذف…" : "حذف فایل"}
          </Button>
          <Button variant="outline" disabled={isLoading} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      {null}
    </AnimatedDialog>
  );
}

export function DeviceBackups({ id, protocol }: { id: string; protocol: string }) {
  const [filters, setFilters] = useState({ search: "", event: "", page: 1 });
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((current) =>
          current.search === search.trim()
            ? current
            : { ...current, search: search.trim(), page: 1 },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const { data, currentData, error, isLoading, isFetching, refetch } = useDeviceBackupsQuery({
    deviceId: id,
    page: filters.page,
    search: filters.search || undefined,
    event: filters.event || undefined,
  });
  const [create, creating] = useCreateDeviceBackupMutation();
  const [download, downloading] = useDownloadDeviceBackupMutation();
  const [clearingSelection, setClearingSelection] = useState<BackupHistorySelection>();
  const [removing, setRemoving] = useState<BackupFile>();
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState<BackupFile>();
  const [restoring, setRestoring] = useState<BackupFile>();
  const [verifyRestore, verifyingRestore] = useVerifyDeviceRestoreMutation();
  const restores = useDeviceRestoresQuery(id);
  const { data: restoreData, isFetching: fetchingRestores, refetch: refetchRestores } = restores;
  const runningRestore = restoreData?.items.some(
    (plan) => plan.status === "running" && !plan.interrupted,
  );
  const safetyBackups =
    restoreData?.items
      .map((plan) => plan.safetyBackupId)
      .filter(Boolean)
      .join(",") ?? "";
  useEffect(() => {
    if (safetyBackups) void refetch();
  }, [safetyBackups, refetch]);
  useEffect(() => {
    if (runningRestore && !fetchingRestores) {
      const timer = setTimeout(() => void refetchRestores(), 2000);
      return () => clearTimeout(timer);
    }
  }, [runningRestore, fetchingRestores, refetchRestores]);
  const lock = useRef(false);
  const busy =
    creating.isLoading ||
    downloading.isLoading ||
    !!removing ||
    !!clearingSelection ||
    uploading ||
    !!reviewing ||
    !!restoring ||
    !!runningRestore ||
    verifyingRestore.isLoading;
  async function verifyResult(planId: string) {
    if (lock.current) return;
    lock.current = true;
    try {
      await verifyRestore({ deviceId: id, planId }).unwrap();
      toast.success("نتیجهٔ بازیابی تأیید شد.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
    }
  }
  async function collect() {
    if (lock.current) return;
    lock.current = true;
    try {
      await create(id).unwrap();
      toast.success("بک‌آپ دریافت و ذخیره شد.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
    }
  }
  async function save(file: BackupFile) {
    if (lock.current) return;
    lock.current = true;
    try {
      const result = await download({ deviceId: id, id: file.id }).unwrap();
      await saveVerifiedBackup(result, file.sha256);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === "checksum"
          ? "صحت فایل تأیید نشد."
          : apiErrorMessage(error),
      );
    } finally {
      lock.current = false;
    }
  }
  return (
    <section id="device-backups" className="grid scroll-mt-24 gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">بک‌آپ تنظیمات</h2>
        <div className="flex flex-wrap gap-2">
          {data?.canRestore && (
            <Button
              variant="outline"
              disabled={busy || isLoading || !!error}
              onClick={() => setUploading(true)}
            >
              <Upload size={16} />
              افزودن فایل
            </Button>
          )}
          <Button
            disabled={!data?.profile || protocol !== "ssh" || busy || isLoading || !!error}
            onClick={() => void collect()}
          >
            {creating.isLoading ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : (
              <Archive size={16} />
            )}
            {creating.isLoading ? "در حال دریافت بک‌آپ…" : "گرفتن بک‌آپ"}
          </Button>
        </div>
      </div>
      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-2">
          <p>{apiErrorMessage(error)}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : isLoading ? (
        <p role="status">در حال دریافت بک‌آپ‌ها…</p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {data?.profile?.scope ?? "کانکتور بک‌آپ برای این نوع تجهیز آماده نیست."}
          </p>
          {protocol !== "ssh" && (
            <p className="text-sm text-muted-foreground">
              برای گرفتن بک‌آپ، اتصال SSH تجهیز را تنظیم کنید.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            فایل دریافتی ممکن است تنظیمات محرمانه داشته باشد. آن را در محل امن نگه دارید.
          </p>
          <h3 className="text-sm font-semibold">فایل‌های ذخیره‌شده</h3>
          {data?.files.length ? (
            <ul className="grid gap-3">
              {data.files.map((file) => (
                <li key={file.id} className="grid gap-2 rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <bdi className="break-all">{file.filename}</bdi>
                    <span className="text-xs text-muted-foreground">
                      {file.origin === "uploaded" ? "آپلود کاربر" : "دریافت از تجهیز"}
                    </span>
                    <span>
                      {timestamp(file.createdAt)} ·{" "}
                      {file.byteLength < 1024
                        ? `${number(file.byteLength)} بایت`
                        : `${number(file.byteLength / 1024)} کیلوبایت`}
                    </span>
                  </div>
                  <bdi className="break-all font-mono text-xs text-muted-foreground">
                    SHA-256 {file.sha256}
                  </bdi>
                  <div className="flex flex-wrap gap-2">
                    {data.canRestore && (
                      <Button variant="outline" disabled={busy} onClick={() => setReviewing(file)}>
                        <FileSearch size={16} />
                        بررسی فایل
                      </Button>
                    )}
                    {data.canExecuteRestore &&
                      ["linux_edge", "cisco", "mikrotik", "fortigate"].includes(
                        file.deviceType,
                      ) && (
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => setRestoring(file)}
                        >
                          <RotateCcw size={16} />
                          بازیابی
                        </Button>
                      )}
                    <Button variant="outline" disabled={busy} onClick={() => void save(file)}>
                      <Download size={16} />
                      دریافت فایل
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => setRemoving(file)}>
                      <Trash2 size={16} />
                      حذف فایل
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">فایل بک‌آپی ذخیره نشده است.</p>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">تاریخچهٔ عملیات بک‌آپ</h3>
            <Button
              variant="outline"
              disabled={busy || isFetching || !currentData?.totalEvents}
              onClick={() =>
                setClearingSelection({
                  deviceId: id,
                  search: filters.search || undefined,
                  event: filters.event || undefined,
                })
              }
            >
              پاک‌کردن تاریخچهٔ انتخاب‌شده
            </Button>
          </div>
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              جست‌وجوی سابقه
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={120}
                placeholder="نام کاربر یا فایل بک‌آپ…"
              />
            </label>
            <Select
              label="نوع رویداد"
              value={filters.event}
              onValueChange={(event) => setFilters((current) => ({ ...current, event, page: 1 }))}
              options={[
                { value: "", label: "همهٔ رویدادها" },
                { value: "created", label: "ایجاد بک‌آپ" },
                { value: "failed", label: "دریافت ناموفق" },
                { value: "downloaded", label: "دریافت فایل" },
                { value: "file_deleted", label: "حذف فایل" },
                { value: "uploaded", label: "آپلود فایل" },
              ]}
            />
          </div>
          {isFetching && (
            <p role="status" className="text-sm text-muted-foreground">
              در حال دریافت تاریخچه…
            </p>
          )}
          {currentData?.events.length ? (
            <ul className="grid gap-2 text-sm">
              {currentData.events.map((event) => (
                <li key={event.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
                  <span>
                    {
                      {
                        created: "ایجاد بک‌آپ",
                        failed: "دریافت ناموفق",
                        downloaded: "دریافت فایل",
                        file_deleted: "حذف فایل",
                        history_cleared: "پاک‌سازی تاریخچه",
                        uploaded: "آپلود فایل",
                      }[event.action]
                    }{" "}
                    · {event.actorName}
                  </span>
                  <time dateTime={event.occurredAt}>{timestamp(event.occurredAt)}</time>
                  {event.action !== "history_cleared" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => setClearingSelection({ deviceId: id, eventId: event.id })}
                    >
                      حذف سابقه
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            !isFetching && (
              <p className="text-sm text-muted-foreground">
                {filters.search || filters.event
                  ? "سابقه‌ای با این مشخصات پیدا نشد."
                  : "عملیاتی ثبت نشده است."}
              </p>
            )
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              {number(currentData?.totalEvents ?? data?.totalEvents ?? 0)} رویداد · صفحهٔ{" "}
              {number(filters.page)}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={isFetching || filters.page <= 1}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                قبلی
              </Button>
              <Button
                variant="outline"
                disabled={isFetching || filters.page * 20 >= (currentData?.totalEvents ?? 0)}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                بعدی
              </Button>
            </div>
          </div>
        </>
      )}
      {restores.error ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <p>{apiErrorMessage(restores.error)}</p>
          <Button
            variant="outline"
            disabled={fetchingRestores}
            onClick={() => void refetchRestores()}
          >
            دریافت دوبارهٔ بازیابی‌ها
          </Button>
        </div>
      ) : (
        !!restoreData?.items.length && (
          <div className="grid gap-3">
            <h3 className="text-sm font-semibold">بازیابی‌های تنظیمات</h3>
            <ul className="grid gap-2 text-sm">
              {restoreData.items.map((plan) => (
                <li key={plan.id} className="grid gap-2 rounded-md border p-3">
                  <div className="flex flex-wrap justify-between gap-2">
                    <bdi className="break-all">{plan.filename}</bdi>
                    <span>
                      {plan.actorName} · {timestamp(plan.createdAt)}
                    </span>
                  </div>
                  <p role={plan.status === "running" ? "status" : undefined}>
                    {plan.interrupted
                      ? "اجرای قبلی نتیجهٔ قطعی ندارد؛ پیش از اقدام جدید وضعیت تجهیز را بررسی کنید. اجرای خودکار تکرار نمی‌شود."
                      : plan.expired
                        ? "پیش‌نمایش منقضی شده است. برای اجرا دوباره بررسی کنید."
                        : ({
                            preview_ready: "پیش‌نمایش آماده؛ هنوز اجرایی انجام نشده است.",
                            taking_safety_backup: "در حال دریافت بک‌آپ ایمنی…",
                            applying: "در حال اعمال و بررسی فایل‌ها…",
                            files_verified_activation_required:
                              "فایل‌های /etc بازیابی و تأیید شدند. راه‌اندازی مجدد سرویس‌های مرتبط با شماست.",
                            failed_before_apply:
                              "عملیات پیش از اعمال فایل متوقف شد. پس از رفع مشکل، پیش‌نمایش جدید بسازید.",
                            needs_review:
                              "نتیجهٔ اعمال فایل قطعی نیست. وضعیت تجهیز و بک‌آپ ایمنی را بررسی کنید.",
                            awaiting_verification:
                              "فایل تحویل گرفته شد؛ پس از آماده شدن تجهیز، نتیجه را بررسی کنید.",
                            applied_merge_needs_review:
                              "فایل وارد شد، اما تنظیمات فعلی هنوز با فایل تطابق کامل ندارد. نتیجه را بررسی کنید.",
                            configuration_verified:
                              "تنظیمات بازیابی‌شده با فایل تطابق دارد و تأیید شد.",
                            running_configuration_verified:
                              "تنظیمات جاری Cisco جایگزین و تأیید شد.",
                          }[plan.state] ?? "در حال بررسی وضعیت…")}
                  </p>
                  {plan.safetyBackupId && (
                    <p className="text-xs text-muted-foreground">
                      {data?.files.some((file) => file.id === plan.safetyBackupId)
                        ? "بک‌آپ ایمنی در فایل‌های ذخیره‌شدهٔ همین تجهیز قرار دارد."
                        : "فایل بک‌آپ ایمنی در فهرست فعلی دیده نمی‌شود."}
                    </p>
                  )}
                  {plan.connectorInvoked &&
                    (plan.interrupted ||
                      (plan.status === "failed" &&
                        [
                          "awaiting_verification",
                          "applied_merge_needs_review",
                          "needs_review",
                        ].includes(plan.state))) && (
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => void verifyResult(plan.id)}
                      >
                        {verifyingRestore.isLoading &&
                        verifyingRestore.originalArgs?.planId === plan.id ? (
                          <LoaderCircle size={16} className="animate-spin" />
                        ) : (
                          <RotateCcw size={16} />
                        )}
                        بررسی نتیجهٔ بازیابی
                      </Button>
                    )}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
      {clearingSelection && (
        <ClearBackupHistoryDialog
          selection={clearingSelection}
          onClose={() => setClearingSelection(undefined)}
          onCleared={() => setFilters((current) => ({ ...current, page: 1 }))}
        />
      )}
      {removing && (
        <DeleteBackupDialog file={removing} deviceId={id} onClose={() => setRemoving(undefined)} />
      )}
      {uploading && data?.profile && (
        <UploadBackupDialog
          deviceId={id}
          extension={data.profile.extension}
          onClose={() => setUploading(false)}
        />
      )}
      {reviewing && (
        <ReviewBackupDialog
          deviceId={id}
          file={reviewing}
          onClose={() => setReviewing(undefined)}
        />
      )}
      {restoring && (
        <RestoreBackupDialog
          deviceId={id}
          file={restoring}
          onClose={() => setRestoring(undefined)}
        />
      )}
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Download, History, LoaderCircle, RefreshCw, Trash2 } from "lucide-react";
import {
  useBackupActivityQuery,
  useDeviceCompaniesQuery,
  useDownloadDeviceBackupMutation,
  type BackupActivity,
} from "@/entities/device";
import {
  ClearBackupHistoryDialog,
  saveVerifiedBackup,
  type BackupHistorySelection,
} from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
const number = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
const timestamp = (value: string) =>
  new Date(value).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
const labels = {
  created: "ایجاد بک‌آپ",
  failed: "دریافت ناموفق",
  downloaded: "دریافت فایل",
  file_deleted: "حذف فایل",
  uploaded: "آپلود فایل",
  history_cleared: "پاک‌سازی تاریخچه",
};

export function BackupActivityPanel() {
  const [filters, setFilters] = useState<{
    page: number;
    search?: string;
    event?: string;
    companyId?: string;
  }>({ page: 1 });
  const [search, setSearch] = useState("");
  const [selection, setSelection] = useState<BackupHistorySelection>();
  const { data, currentData, error, isLoading, isFetching, refetch } =
    useBackupActivityQuery(filters);
  const companies = useDeviceCompaniesQuery();
  const [download, downloading] = useDownloadDeviceBackupMutation();
  const lock = useRef(false);
  const busy = downloading.isLoading || !!selection;
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setFilters((current) =>
          current.search === (search.trim() || undefined)
            ? current
            : { ...current, search: search.trim() || undefined, page: 1 },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  async function save(event: BackupActivity) {
    if (lock.current || !event.backupId || !event.sha256) return;
    lock.current = true;
    try {
      const result = await download({ deviceId: event.deviceId, id: event.backupId }).unwrap();
      await saveVerifiedBackup(result, event.sha256);
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
    <section
      id="backup-activity"
      aria-label="تاریخچهٔ یکپارچهٔ بک‌آپ"
      className="mt-6 grid scroll-mt-24 gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <History size={18} className="text-primary" />
          تاریخچهٔ عملیات بک‌آپ
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            aria-label="تازه‌سازی تاریخچهٔ بک‌آپ"
            disabled={isFetching || busy}
            onClick={() => void refetch()}
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <Button
            variant="outline"
            disabled={isFetching || busy || !currentData?.total}
            onClick={() =>
              setSelection({
                search: filters.search,
                event: filters.event,
                companyId: filters.companyId,
              })
            }
          >
            <Trash2 size={16} />
            پاک‌کردن تاریخچهٔ انتخاب‌شده
          </Button>
        </div>
      </div>
      <div className="grid items-end gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm">
          جست‌وجوی سابقه
          <Input
            placeholder="نام کاربر، تجهیز، آدرس یا فایل…"
            maxLength={120}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className="grid gap-1">
          <span className="text-sm">شرکت مالک</span>
          <Select
            label="شرکت تاریخچه"
            disabled={companies.isLoading}
            value={filters.companyId ?? ""}
            onValueChange={(companyId) =>
              setFilters((current) => ({ ...current, companyId: companyId || undefined, page: 1 }))
            }
            options={[
              { value: "", label: "همهٔ شرکت‌ها", icon: <Building2 size={16} /> },
              ...(companies.data ?? []).map((company) => ({
                value: company.id,
                label: company.name,
                icon: <Building2 size={16} />,
              })),
            ]}
          />
          {companies.error && (
            <div role="alert" className="flex items-center gap-2 text-xs text-destructive">
              <span>دریافت شرکت‌ها انجام نشد.</span>
              <button
                aria-label="دریافت دوبارهٔ شرکت‌های تاریخچه"
                disabled={companies.isFetching}
                onClick={() => void companies.refetch()}
              >
                <RefreshCw size={14} className={companies.isFetching ? "animate-spin" : ""} />
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-1">
          <span className="text-sm">نوع رویداد</span>
          <Select
            label="نوع رویداد تاریخچه"
            value={filters.event ?? ""}
            onValueChange={(event) =>
              setFilters((current) => ({ ...current, event: event || undefined, page: 1 }))
            }
            options={[
              { value: "", label: "همهٔ رویدادها" },
              ...Object.entries(labels)
                .filter(([key]) => key !== "history_cleared")
                .map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </div>
      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <p>{apiErrorMessage(error)}</p>
          <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : isLoading || isFetching ? (
        <p role="status" className="py-5 text-center text-sm text-muted-foreground">
          در حال دریافت تاریخچه…
        </p>
      ) : currentData?.items.length ? (
        <ul className="grid gap-3">
          {currentData.items.map((event) => (
            <li key={event.id} className="grid gap-3 rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <Link
                  href={`/dashboard/assets/devices/${event.deviceId}#device-backups`}
                  className="font-medium text-primary"
                >
                  {event.deviceName}
                </Link>
                <span>{labels[event.action]}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{event.companyName ?? "بدون شرکت"}</span>
                <bdi>{event.host}</bdi>
                <bdi>{event.vendor}</bdi>
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-xs">
                <span>
                  {event.actorName}
                  {event.actorUsername && event.actorName !== event.actorUsername && (
                    <>
                      {" "}
                      · <bdi>@{event.actorUsername}</bdi>
                    </>
                  )}
                </span>
                <time dateTime={event.occurredAt}>{timestamp(event.occurredAt)}</time>
              </div>
              {!!event.filename && (
                <bdi className="break-all font-mono text-xs text-muted-foreground">
                  {event.filename}
                </bdi>
              )}
              {event.action === "failed" && (
                <p className="text-xs text-destructive">
                  {event.failureCode === "credential_unavailable"
                    ? "اعتبارنامهٔ ذخیره‌شده در دسترس نیست."
                    : "دریافت بک‌آپ کامل نشد؛ مجوز خواندن تنظیمات و اتصال SSH را بررسی کنید."}
                </p>
              )}
              {!!event.durationMs && (
                <p className="text-xs text-muted-foreground">
                  زمان دریافت:{" "}
                  {event.durationMs < 1000
                    ? `${number(event.durationMs)} میلی‌ثانیه`
                    : `${number(event.durationMs / 1000)} ثانیه`}
                </p>
              )}
              {event.action === "history_cleared" && event.deletedCount != null && (
                <p className="text-xs text-muted-foreground">
                  {number(event.deletedCount)} سابقه حذف شد؛ فایل‌ها باقی ماندند.
                </p>
              )}
              {(event.action === "created" || event.action === "uploaded") && !event.backupId && (
                <p className="text-xs text-muted-foreground">
                  این فایل در مخزن فعلی تجهیز موجود نیست.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {(event.action === "created" || event.action === "uploaded") &&
                  event.backupId &&
                  event.sha256 && (
                    <Button variant="outline" disabled={busy} onClick={() => void save(event)}>
                      {downloading.isLoading && downloading.originalArgs?.id === event.backupId ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      دریافت فایل
                    </Button>
                  )}
                {event.action !== "history_cleared" && (
                  <Button
                    variant="outline"
                    disabled={busy || isFetching}
                    onClick={() => setSelection({ eventId: event.id })}
                  >
                    <Trash2 size={16} />
                    حذف سابقه
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-5 text-center text-sm text-muted-foreground">
          سابقه‌ای با این مشخصات پیدا نشد.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>
          {number(currentData?.total ?? data?.total ?? 0)} رویداد · صفحهٔ {number(filters.page)}
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
            disabled={isFetching || filters.page * 20 >= (currentData?.total ?? 0)}
            onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
          >
            بعدی
          </Button>
        </div>
      </div>
      {selection && (
        <ClearBackupHistoryDialog
          selection={selection}
          onClose={() => setSelection(undefined)}
          onCleared={() => setFilters((current) => ({ ...current, page: 1 }))}
        />
      )}
    </section>
  );
}

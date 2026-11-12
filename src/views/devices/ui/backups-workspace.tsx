"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, ChevronLeft, FileSearch, RefreshCw } from "lucide-react";
import {
  useBackupCatalogQuery,
  useDeviceCompaniesQuery,
  type BackupCatalogFile,
  type BackupCatalogQuery,
} from "@/entities/device";
import { ReviewBackupDialog } from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import styles from "./devices.module.css";
import { BackupActivityPanel } from "./backup-activity";
const number = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
const byteSize = (value: number) =>
  value < 1024
    ? `${number(value)} بایت`
    : value < 1024 * 1024
      ? `${number(value / 1024)} کیلوبایت`
      : `${number(value / 1024 / 1024)} مگابایت`;
const date = (value: string) =>
  new Date(value).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });

export function BackupsWorkspace() {
  const [query, setQuery] = useState<BackupCatalogQuery>({ page: 1 });
  const [search, setSearch] = useState("");
  const [reviewing, setReviewing] = useState<BackupCatalogFile>();
  const companies = useDeviceCompaniesQuery();
  const { data, currentData, isLoading, isFetching, error, refetch } = useBackupCatalogQuery(query);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setQuery((current) =>
          current.search === (search.trim() || undefined)
            ? current
            : { ...current, search: search.trim() || undefined, page: 1 },
        ),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>دارایی‌ها / بک‌آپ‌ها</span>
          <h1>مخزن بک‌آپ تجهیزات</h1>
          <p>فایل‌های دریافت‌شده و آپلودشدهٔ تجهیزات فعال فضای کاری</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => void refetch()}
            aria-label="تازه‌سازی بک‌آپ‌ها"
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
          <a
            href="#backup-activity"
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            تاریخچهٔ عملیات
          </a>
          <Link
            href="/dashboard/assets/devices"
            className="inline-flex items-center gap-1 text-sm text-primary"
          >
            تجهیزات
            <ChevronLeft size={16} />
          </Link>
        </div>
      </header>
      <section className="mb-4 grid grid-cols-3 gap-2" aria-label="آمار بک‌آپ‌ها">
        {[
          { label: "فایل", value: number(currentData?.total ?? 0) },
          { label: "تجهیز", value: number(currentData?.deviceCount ?? 0) },
          {
            label: "حجم ذخیره‌شده",
            value: byteSize(Number(currentData?.totalBytes ?? 0)),
          },
        ].map((stat) => (
          <div key={stat.label} className="grid gap-1 rounded-lg border bg-card p-3">
            <strong className="text-base">{isLoading || isFetching ? "…" : stat.value}</strong>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </section>
      <section className="grid gap-4 rounded-xl border bg-card p-4">
        <div className="grid items-end gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            جست‌وجوی سریع
            <Input
              placeholder="نام فایل، تجهیز یا آدرس…"
              value={search}
              maxLength={120}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="grid gap-1">
            <span className="text-sm">شرکت مالک</span>
            <Select
              label="شرکت مالک"
              value={query.companyId ?? ""}
              disabled={companies.isLoading}
              onValueChange={(companyId) =>
                setQuery((current) => ({ ...current, companyId: companyId || undefined, page: 1 }))
              }
              options={[
                { value: "", label: "همهٔ شرکت‌ها" },
                ...(companies.data ?? []).map((company) => ({
                  value: company.id,
                  label: company.name,
                })),
              ]}
            />
            {companies.error && (
              <div role="alert" className="flex items-center gap-2 text-xs text-destructive">
                <span>دریافت شرکت‌ها انجام نشد.</span>
                <button
                  aria-label="دریافت دوباره شرکت‌ها"
                  disabled={companies.isFetching}
                  onClick={() => void companies.refetch()}
                >
                  <RefreshCw size={14} className={companies.isFetching ? "animate-spin" : ""} />
                </button>
              </div>
            )}
          </div>
          <div className="grid gap-1">
            <span className="text-sm">منبع فایل</span>
            <Select
              label="منبع فایل"
              value={query.origin ?? ""}
              onValueChange={(origin) =>
                setQuery((current) => ({ ...current, origin: origin || undefined, page: 1 }))
              }
              options={[
                { value: "", label: "همهٔ فایل‌ها" },
                { value: "collected", label: "دریافت از تجهیز" },
                { value: "uploaded", label: "آپلود کاربر" },
              ]}
            />
          </div>
        </div>
        {error ? (
          <div role="alert" className="flex flex-wrap items-center gap-2">
            <p>{apiErrorMessage(error)}</p>
            <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : isLoading || isFetching ? (
          <p role="status" className="py-8 text-center text-sm text-muted-foreground">
            در حال دریافت فایل‌ها…
          </p>
        ) : currentData?.items.length ? (
          <ul className="grid gap-3">
            {currentData.items.map((file) => (
              <li key={file.id} className="grid gap-3 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <bdi className="flex min-w-0 items-center gap-2 break-all">
                    <Archive size={16} className="shrink-0 text-primary" />
                    {file.filename}
                  </bdi>
                  <span className="text-xs text-muted-foreground">{date(file.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground">
                  <span>{file.deviceName}</span>
                  <bdi>{file.host}</bdi>
                  <span>{file.companyName ?? "بدون شرکت"}</span>
                  <span>{file.origin === "uploaded" ? "آپلود کاربر" : "دریافت از تجهیز"}</span>
                  <span>{number(file.byteLength / 1024)} کیلوبایت</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {["linux_edge", "cisco", "mikrotik", "fortigate"].includes(file.deviceType) && (
                    <Button variant="outline" onClick={() => setReviewing(file)}>
                      <FileSearch size={16} />
                      بررسی فایل
                    </Button>
                  )}
                  <Link
                    href={`/dashboard/assets/devices/${file.deviceId}#device-backups`}
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    مدیریت بک‌آپ تجهیز
                    <ChevronLeft size={14} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {query.search || query.companyId || query.origin
              ? "فایلی با این مشخصات پیدا نشد."
              : "هنوز فایل بک‌آپی ذخیره نشده است."}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>
            {number(currentData?.total ?? data?.total ?? 0)} فایل · صفحهٔ {number(query.page)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isFetching || query.page <= 1}
              onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              disabled={isFetching || query.page * 20 >= (currentData?.total ?? 0)}
              onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
            >
              بعدی
            </Button>
          </div>
        </div>
      </section>
      <BackupActivityPanel />
      {reviewing && (
        <ReviewBackupDialog
          deviceId={reviewing.deviceId}
          file={reviewing}
          onClose={() => setReviewing(undefined)}
        />
      )}
    </main>
  );
}

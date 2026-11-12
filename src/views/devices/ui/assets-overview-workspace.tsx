"use client";
import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  HelpCircle,
  Plus,
  RefreshCw,
  Search,
  Server,
} from "lucide-react";
import {
  DeviceIcon,
  deviceTypeLabels,
  statusLabels,
  useAssetsOverviewQuery,
  useDeviceCompaniesQuery,
  type AssetsOverviewQuery,
  type AssetsFilter,
} from "@/entities/device";
import { DeviceFormDialog } from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { AssetsOverviewCharts } from "./assets-overview-charts";
const number = (n: number) => n.toLocaleString("fa-IR");
const filters: [AssetsFilter, string, typeof Server][] = [
  ["all", "همهٔ دارایی‌ها", Server],
  ["online", "آنلاین", CheckCircle2],
  ["attention", "نیازمند بررسی", CircleAlert],
  ["unverified", "اتصال تأییدنشده", HelpCircle],
];
export function AssetsOverviewWorkspace({ userId }: { userId: string }) {
  const [query, setQuery] = useState<AssetsOverviewQuery>({ filter: "all", page: 1, pageSize: 20 });
  const [search, setSearch] = useState(""),
    [adding, setAdding] = useState<"network" | "recorder">();
  const {
    currentData: data,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useAssetsOverviewQuery(query);
  const companies = useDeviceCompaniesQuery(),
    group = useId(),
    reduced = useReducedMotion();
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
  const pages = Math.max(1, Math.ceil((data?.total ?? 0) / query.pageSize));
  return (
    <main className="grid w-full min-w-0 gap-4 p-4 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">دارایی‌ها / نمای کلی</p>
          <h1 className="text-xl font-semibold sm:text-2xl">نمای کلی دارایی‌ها</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            تجهیزات شبکه، سرورها، دوربین‌ها و ضبط‌کننده‌های فعال فضای کاری
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/assets/devices">
              تجهیزات
              <ArrowLeft size={15} />
            </Link>
          </Button>
          <Button onClick={() => setAdding("network")}>
            <Plus size={16} />
            افزودن تجهیز
          </Button>
          <Button variant="outline" onClick={() => setAdding("recorder")}>
            <Camera size={16} />
            دوربین / ضبط‌کننده
          </Button>
        </div>
      </header>
      <LayoutGroup id={group}>
        <section
          aria-label="آمار و فیلتر دارایی‌ها"
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {filters.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              aria-pressed={query.filter === key}
              onClick={() => setQuery((current) => ({ ...current, filter: key, page: 1 }))}
              className="relative isolate flex min-h-20 items-center gap-3 rounded-xl border bg-card p-3 text-right sm:p-4"
            >
              {query.filter === key && (
                <motion.span
                  layoutId="assets-active-filter"
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-xl border border-primary bg-primary/5"
                  transition={{ duration: reduced ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
              <Icon
                size={20}
                className={
                  key === "attention" ? "shrink-0 text-destructive" : "shrink-0 text-primary"
                }
              />
              <span className="grid gap-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <strong className="text-xl">
                  {data ? number(key === "all" ? data.stats.total : data.stats[key]) : "—"}
                </strong>
              </span>
            </button>
          ))}
        </section>
      </LayoutGroup>
      <AssetsOverviewCharts
        data={data}
        loading={isLoading || isFetching}
        hasError={!!error}
        onFilter={(filter) => setQuery((current) => ({ ...current, filter, page: 1 }))}
      />
      <p className="text-xs leading-6 text-muted-foreground">
        نیازمند بررسی شامل وضعیت آفلاین، خطا یا بررسی‌نشده است. تأیید اتصال مدیریتی مستقل از وضعیت
        آخرین پینگ است. نمودارها کل موجودی شرکت انتخاب‌شده را نشان می‌دهند.
      </p>
      {!!data?.stats.attention && query.filter !== "attention" && (
        <button
          type="button"
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
          onClick={() => setQuery((current) => ({ ...current, filter: "attention", page: 1 }))}
        >
          <span className="flex items-center gap-2">
            <CircleAlert size={17} />
            {number(data.stats.attention)} دارایی نیازمند بررسی است.
          </span>
          <span className="flex items-center gap-1 text-primary">
            نمایش موارد
            <ArrowLeft size={15} />
          </span>
        </button>
      )}
      <section
        aria-label="موجودی یکپارچهٔ دارایی‌ها"
        className="grid min-w-0 gap-4 rounded-xl border bg-card p-3 sm:p-5"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">موجودی دارایی‌ها</h2>
          <Button
            size="icon"
            variant="outline"
            aria-label="تازه‌سازی دارایی‌ها"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
        <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="grid gap-2 text-sm">
            <span className="flex items-center gap-1">
              <Search size={14} />
              جست‌وجوی دارایی
            </span>
            <Input
              placeholder="نام، آدرس، سازنده یا محل نصب…"
              maxLength={120}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="grid gap-2 text-sm">
            <div className="flex min-h-5 items-center justify-between">
              <span>شرکت (آمار و موجودی)</span>
              {companies.error && (
                <button
                  type="button"
                  aria-label="دریافت دوبارهٔ شرکت‌ها"
                  disabled={companies.isFetching}
                  onClick={() => void companies.refetch()}
                >
                  <RefreshCw size={13} />
                </button>
              )}
            </div>
            <Select
              label="شرکت دارایی‌ها"
              disabled={companies.isLoading}
              value={query.companyId ?? ""}
              onValueChange={(companyId) =>
                setQuery((current) => ({ ...current, companyId: companyId || undefined, page: 1 }))
              }
              options={[
                { value: "", label: "همهٔ شرکت‌ها", icon: <Building2 size={15} /> },
                ...(companies.data ?? []).map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: <Building2 size={15} />,
                })),
              ]}
            />
            {companies.error && (
              <p role="alert" className="text-xs text-destructive">
                دریافت شرکت‌ها انجام نشد.
              </p>
            )}
          </div>
        </div>
        {error ? (
          <div role="alert" className="grid justify-items-start gap-3 py-8 text-sm">
            <p>{apiErrorMessage(error)}</p>
            <Button variant="outline" disabled={isFetching} onClick={() => void refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : isLoading || isFetching ? (
          <p role="status" className="py-8 text-center text-sm text-muted-foreground">
            در حال دریافت دارایی‌ها…
          </p>
        ) : !data?.items.length ? (
          <div className="grid justify-items-center gap-3 py-8 text-center text-sm">
            <Server size={26} className="text-muted-foreground" />
            <p>
              {query.search || query.companyId || query.filter !== "all"
                ? "دارایی با این مشخصات پیدا نشد."
                : "هنوز دارایی فعالی ثبت نشده است."}
            </p>
            {query.search || query.companyId || query.filter !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setQuery({ filter: "all", page: 1, pageSize: query.pageSize });
                }}
              >
                پاک‌کردن فیلترها
              </Button>
            ) : (
              <Button onClick={() => setAdding("network")}>افزودن تجهیز</Button>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {data.items.map((asset) => (
              <li
                key={asset.id}
                className="grid min-w-0 gap-3 rounded-lg border bg-background/40 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <DeviceIcon type={asset.type} vendor={asset.vendor} />
                  <div className="grid min-w-0 gap-1">
                    <Link
                      className="break-words text-sm font-semibold text-primary hover:underline"
                      href={`/dashboard/assets/devices/${asset.id}`}
                    >
                      {asset.name}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      <bdi>{asset.vendor}</bdi> · {deviceTypeLabels[asset.type]}
                    </span>
                    <span className="break-words text-xs text-muted-foreground">
                      {asset.companyName ?? "بدون شرکت"}
                      {asset.location ? ` · ${asset.location}` : ""}
                    </span>
                  </div>
                </div>
                <div className="grid min-w-0 gap-2 border-y py-3 text-xs">
                  <bdi className="break-all font-mono">{asset.host}</bdi>
                  <span className="text-muted-foreground">
                    آخرین مشاهده:{" "}
                    {asset.lastSeenAt
                      ? new Date(asset.lastSeenAt).toLocaleString("fa-IR", {
                          timeZone: "Asia/Tehran",
                        })
                      : "هنوز ثبت نشده"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span
                      className={
                        asset.status === "online"
                          ? "text-primary"
                          : asset.status === "unknown"
                            ? "text-muted-foreground"
                            : "text-destructive"
                      }
                    >
                      {statusLabels[asset.status]}
                    </span>
                    <span className="text-muted-foreground">
                      {asset.verified ? "اتصال تأیید شده" : "اتصال تأییدنشده"}
                    </span>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/assets/devices/${asset.id}`}>
                      جزئیات
                      <ArrowLeft size={14} />
                    </Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs">
          <span role="status">
            {data
              ? `${number(data.total)} نتیجه · صفحهٔ ${number(query.page)} از ${number(pages)}`
              : "—"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span>تعداد در صفحه</span>
            <div className="w-20">
              <Select
                label="تعداد دارایی در صفحه"
                value={String(query.pageSize)}
                onValueChange={(value) =>
                  setQuery((current) => ({ ...current, pageSize: Number(value), page: 1 }))
                }
                options={[10, 20, 50].map((n) => ({ value: String(n), label: number(n) }))}
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label="صفحهٔ قبل دارایی‌ها"
              disabled={isFetching || query.page <= 1}
              onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
            >
              <ChevronRight size={15} />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="صفحهٔ بعد دارایی‌ها"
              disabled={isFetching || !data || query.page >= pages}
              onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
            >
              <ChevronLeft size={15} />
            </Button>
          </div>
        </footer>
      </section>
      {adding && (
        <DeviceFormDialog
          draftOwnerId={userId}
          initialCategory={adding}
          onClose={() => setAdding(undefined)}
        />
      )}
    </main>
  );
}

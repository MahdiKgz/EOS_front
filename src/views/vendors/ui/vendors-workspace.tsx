"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import {
  DeviceIcon,
  statusLabels,
  useDeviceCompaniesQuery,
  useVendorCatalogQuery,
  useVendorDetailQuery,
  useRefreshDeviceCapabilitiesMutation,
  type SupportState,
  type VendorDefinition,
} from "@/entities/device";
import { DeviceFormDialog } from "@/features/manage-device";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { apiErrorMessage } from "@/shared/api/error-message";
const states: Record<SupportState, string> = {
  implemented: "پیاده‌شده",
  partial: "پشتیبانی محدود",
  planned: "برنامه‌ریزی‌شده",
  unsupported: "پشتیبانی‌نشده",
};
const number = (value: number) => value.toLocaleString("fa-IR");
function StateBadge({ state }: { state: SupportState }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs ${state === "implemented" ? "text-primary" : state === "unsupported" ? "text-destructive" : "text-muted-foreground"}`}
    >
      {state === "implemented" ? (
        <CheckCircle2 size={13} />
      ) : state === "unsupported" ? (
        <ShieldAlert size={13} />
      ) : (
        <Clock3 size={13} />
      )}{" "}
      {states[state]}
    </span>
  );
}
function useSearch() {
  const [search, setSearch] = useState(""),
    [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  return { search, setSearch, debounced };
}
function CompanyFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const companies = useDeviceCompaniesQuery();
  return (
    <div className="grid min-w-0 gap-1">
      <div className="flex min-h-6 items-center justify-between gap-2 text-xs">
        <span>شرکت مالک</span>
        {companies.error && (
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0"
            aria-label="دریافت دوبارهٔ شرکت‌ها"
            disabled={companies.isFetching}
            onClick={() => void companies.refetch()}
          >
            <RefreshCw size={12} />
          </Button>
        )}
      </div>
      <Select
        label="شرکت مالک"
        value={value}
        onValueChange={onChange}
        disabled={companies.isFetching}
        placeholder={companies.isLoading ? "در حال دریافت…" : "انتخاب شرکت"}
        options={
          companies.data
            ? [
                { value: "", label: "همهٔ شرکت‌ها", icon: <Building2 size={15} /> },
                ...companies.data.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: <Building2 size={15} />,
                })),
              ]
            : []
        }
        emptyMessage={
          companies.error ? "دریافت شرکت‌ها انجام نشد." : "شرکتی در فضای کاری موجود نیست."
        }
      />
      {companies.error && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(companies.error)}
        </p>
      )}
    </div>
  );
}
export function VendorsWorkspace({
  userId,
  initialCompanyId,
}: {
  userId: string;
  initialCompanyId?: string;
}) {
  const [companyId, setCompanyId] = useState(initialCompanyId ?? ""),
    [state, setState] = useState(""),
    [adding, setAdding] = useState<VendorDefinition>();
  const { search, setSearch, debounced } = useSearch();
  const report = useVendorCatalogQuery({
      companyId: companyId || undefined,
      search: debounced || undefined,
      state: (state as SupportState) || undefined,
    }),
    data = report.error ? undefined : report.currentData;
  return (
    <main className="grid min-w-0 gap-5 p-5 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">دارایی‌ها / وندورها</p>
          <h1 className="text-xl font-semibold">وندورها و سطح پشتیبانی</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            روش‌های اتصال، پیش‌نیازها و قابلیت‌های موجود هر خانواده را بررسی کنید.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          aria-label="دریافت دوبارهٔ وندورها"
          disabled={report.isFetching}
          onClick={() => void report.refetch()}
        >
          <RefreshCw size={16} className={report.isFetching ? "animate-spin" : ""} />
        </Button>
      </header>
      {data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Object.entries(states).map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <strong className="text-lg">{number(data.stats[key as SupportState])}</strong>
            </div>
          ))}
        </div>
      )}
      <section className="grid gap-4 rounded-xl border bg-card p-4 md:grid-cols-3">
        <label className="grid gap-2 text-xs">
          <span className="flex min-h-6 items-center gap-1">
            <Search size={13} />
            جست‌وجوی وندور
          </span>
          <input
            type="search"
            className="h-10 min-w-0 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="نام وندور…"
            maxLength={120}
          />
        </label>
        <CompanyFilter value={companyId} onChange={setCompanyId} />
        <div className="grid gap-2">
          <span className="flex min-h-6 items-center gap-1 text-xs">
            <Filter size={13} />
            سطح پشتیبانی
          </span>
          <Select
            label="سطح پشتیبانی"
            value={state}
            onValueChange={setState}
            options={[
              { value: "", label: "همهٔ وضعیت‌ها" },
              ...Object.entries(states).map(([value, label]) => ({ value, label })),
            ]}
          />
        </div>
      </section>
      {report.error ? (
        <div role="alert" className="grid justify-items-start gap-3 rounded-xl border p-5">
          <p className="text-sm text-destructive">{apiErrorMessage(report.error)}</p>
          <Button
            variant="outline"
            disabled={report.isFetching}
            onClick={() => void report.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">
          در حال دریافت کاتالوگ…
        </p>
      ) : !data.items.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          وندوری با این فیلترها پیدا نشد.
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.items.map((vendor) => (
            <article
              key={vendor.key}
              className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
            >
              <header className="flex items-center justify-between gap-3">
                <DeviceIcon type={vendor.registration.type} vendor={vendor.registration.vendor} />
                <StateBadge state={vendor.state} />
              </header>
              <h2 className="font-semibold">{vendor.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{vendor.description}</p>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span>تجهیزات فعال در شرکت انتخاب‌شده</span>
                <strong>{number(vendor.deviceCount)}</strong>
              </div>
              <footer className="mt-auto flex flex-wrap gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link
                    href={`/dashboard/assets/vendors/${vendor.key}${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""}`}
                  >
                    جزئیات
                    <ArrowLeft size={14} />
                  </Link>
                </Button>
                <Button size="sm" onClick={() => setAdding(vendor)}>
                  <Plus size={14} />
                  افزودن تجهیز
                </Button>
              </footer>
            </article>
          ))}
        </div>
      )}
      <p className="text-xs leading-6 text-muted-foreground">
        سطح پشتیبانی به قابلیت‌های موجود در همین نسخه اشاره دارد. تأیید اتصال، نسخهٔ سیستم‌عامل و
        مجوز حساب برای هر تجهیز جداگانه بررسی می‌شوند.
      </p>
      {adding && (
        <DeviceFormDialog
          draftOwnerId={userId}
          initialDevice={adding.registration}
          initialCompanyId={companyId || undefined}
          onClose={() => setAdding(undefined)}
        />
      )}
    </main>
  );
}
export function VendorDetailWorkspace({
  vendorKey,
  userId,
  initialCompanyId,
  canRefresh,
}: {
  vendorKey: string;
  userId: string;
  canRefresh: boolean;
  initialCompanyId?: string;
}) {
  const [companyId, setCompanyId] = useState(initialCompanyId ?? ""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20),
    [adding, setAdding] = useState(false);
  const { search, setSearch, debounced } = useSearch();
  const [refreshCapability, capabilityResult] = useRefreshDeviceCapabilitiesMutation(),
    capabilityLock = useRef(false);
  const report = useVendorDetailQuery({
      key: vendorKey,
      companyId: companyId || undefined,
      search: debounced || undefined,
      status: status || undefined,
      page,
      pageSize,
    }),
    data = report.error ? undefined : report.currentData,
    definition = report.data?.vendor;
  const totalPages = Math.max(1, Math.ceil((data?.devices.total ?? 0) / pageSize));
  return (
    <main className="grid min-w-0 gap-5 p-5 sm:p-8">
      <Link
        href={`/dashboard/assets/vendors${companyId ? `?companyId=${encodeURIComponent(companyId)}` : ""}`}
        className="inline-flex w-fit items-center gap-[4px] justify-self-end text-sm text-primary hover:underline"
      >
        بازگشت
        <ArrowLeft size={16} />
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-xs text-muted-foreground">دارایی‌ها / وندورها</p>
          <h1 className="flex items-center gap-3 text-xl font-semibold">
            {definition && (
              <DeviceIcon
                type={definition.registration.type}
                vendor={definition.registration.vendor}
              />
            )}{" "}
            {definition?.title ?? vendorKey}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="دریافت دوبارهٔ جزئیات وندور"
            disabled={report.isFetching}
            onClick={() => void report.refetch()}
          >
            <RefreshCw size={16} className={report.isFetching ? "animate-spin" : ""} />
          </Button>
          <Button disabled={!data || report.isFetching} onClick={() => setAdding(true)}>
            <Plus size={15} />
            افزودن تجهیز
          </Button>
        </div>
      </header>
      {definition && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-7 text-muted-foreground">{definition.description}</p>
            <StateBadge state={definition.state} />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["تجهیزات فعال", data?.stats.total ?? null],
              ["آنلاین", data?.stats.online ?? null],
              [
                "قابلیت پیاده‌شده",
                definition.capabilities.filter((c) => c.state === "implemented").length,
              ],
              [
                "قابلیت محدود یا آینده",
                definition.capabilities.filter((c) => c.state !== "implemented").length,
              ],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <strong className="mt-2 block text-lg">
                  {value === null ? "—" : number(Number(value))}
                </strong>
              </div>
            ))}
          </div>
        </>
      )}
      <section className="grid min-w-0 gap-4 rounded-xl border bg-card p-4">
        <h2 className="font-semibold">تجهیزات این وندور</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-xs">
            <span className="flex min-h-6 items-center gap-1">
              <Search size={13} />
              جست‌وجوی تجهیز
            </span>
            <input
              type="search"
              className="h-10 min-w-0 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="نام، آدرس، سازنده یا محل نصب…"
              maxLength={120}
            />
          </label>
          <CompanyFilter
            value={companyId}
            onChange={(value) => {
              setCompanyId(value);
              setPage(1);
            }}
          />
          <div className="grid gap-2">
            <span className="min-h-6 text-xs">وضعیت دسترسی</span>
            <Select
              label="وضعیت دسترسی"
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              options={[
                { value: "", label: "همهٔ وضعیت‌ها" },
                ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
              ]}
            />
          </div>
        </div>
        {report.error ? (
          <div role="alert" className="grid justify-items-start gap-3">
            <p className="text-sm text-destructive">{apiErrorMessage(report.error)}</p>
            <Button
              variant="outline"
              disabled={report.isFetching}
              onClick={() => void report.refetch()}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : !data ? (
          <p role="status" className="text-sm text-muted-foreground">
            در حال دریافت تجهیزات…
          </p>
        ) : !data.devices.items.length ? (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            تجهیز فعالی با این فیلترها پیدا نشد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-start text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  {[
                    "نام",
                    "آدرس",
                    "شرکت",
                    "وضعیت دسترسی",
                    "تأیید مدیریت",
                    ...(["cisco", "fortigate"].includes(vendorKey)
                      ? ["آخرین خانوادهٔ شناسایی‌شده"]
                      : []),
                    "",
                  ].map((label) => (
                    <th key={label} scope="col" className="p-3 text-start">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.devices.items.map((device) => (
                  <tr key={device.id} className="border-b last:border-0">
                    <td className="p-3 font-medium">{device.name}</td>
                    <td className="p-3">
                      <bdi>
                        {device.host}:{device.managementPort}
                      </bdi>
                    </td>
                    <td className="p-3">{device.companyName ?? "—"}</td>
                    <td className="p-3">{statusLabels[device.status]}</td>
                    <td className="p-3">{device.verified ? "تأییدشده" : "تأییدنشده"}</td>
                    {["cisco", "fortigate"].includes(vendorKey) && (
                      <td className="p-3">
                        <bdi>{device.platform ?? "هنوز شناسایی نشده"}</bdi>
                        {device.platformCollectedAt && (
                          <small className="mt-1 block text-muted-foreground">
                            {new Intl.DateTimeFormat("fa-IR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            }).format(new Date(device.platformCollectedAt))}
                          </small>
                        )}
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex gap-2">
                        {["cisco", "fortigate"].includes(vendorKey) &&
                          canRefresh &&
                          device.protocol === "ssh" && (
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`کشف قابلیت‌های ${device.name}`}
                              title="کشف و تازه‌سازی قابلیت‌ها"
                              disabled={capabilityResult.isLoading}
                              onClick={async () => {
                                if (capabilityLock.current) return;
                                capabilityLock.current = true;
                                try {
                                  const result = await refreshCapability(device.id).unwrap();
                                  if (result.supported)
                                    toast.success("قابلیت‌های تجهیز به‌روزرسانی شد.");
                                  else
                                    toast.error(
                                      "هویت سیستم‌عامل برای کانکتور انتخاب‌شده تأیید نشد.",
                                    );
                                } catch (error) {
                                  toast.error(apiErrorMessage(error));
                                } finally {
                                  capabilityLock.current = false;
                                }
                              }}
                            >
                              {capabilityResult.isLoading &&
                              capabilityResult.originalArgs === device.id ? (
                                <LoaderCircle size={14} className="animate-spin" />
                              ) : (
                                <RefreshCw size={14} />
                              )}
                            </Button>
                          )}
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/dashboard/assets/devices/${device.id}`}>
                            جزئیات
                            <ArrowLeft size={14} />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-xs">
          <span>
            {data
              ? `${number(data.devices.total)} نتیجه · صفحهٔ ${number(page)} از ${number(totalPages)}`
              : "در حال دریافت…"}
          </span>
          <div className="flex items-center gap-2">
            <span>تعداد در صفحه</span>
            <div className="w-20">
              <Select
                label="تعداد در صفحه"
                value={String(pageSize)}
                disabled={report.isFetching}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
                options={[10, 20, 50, 100].map((value) => ({
                  value: String(value),
                  label: number(value),
                }))}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="size-9 p-0"
              aria-label="صفحهٔ قبل"
              disabled={report.isFetching || page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronRight size={15} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="size-9 p-0"
              aria-label="صفحهٔ بعد"
              disabled={report.isFetching || !data || page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronLeft size={15} />
            </Button>
          </div>
        </footer>
      </section>
      {definition && (
        <>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">پیش‌نیازهای اتصال</h2>
            <ul className="grid list-inside list-disc gap-2 text-sm leading-7 text-muted-foreground">
              {definition.requirements.map((requirement) => (
                <li key={requirement}>{requirement}</li>
              ))}
            </ul>
          </section>
          <section className="grid gap-3">
            <h2 className="font-semibold">پلتفرم‌ها</h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {definition.platforms.map((platform) => (
                <article key={platform.key} className="grid gap-3 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{platform.title}</h3>
                    <StateBadge state={platform.state} />
                  </div>
                  <p className="text-xs leading-7 text-muted-foreground">{platform.description}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="grid gap-3">
            <h2 className="font-semibold">قابلیت‌ها</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {definition.capabilities.map((capability) => (
                <article key={capability.key} className="grid gap-3 rounded-xl border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{capability.title}</h3>
                    <StateBadge state={capability.state} />
                  </div>
                  <p className="text-xs leading-7 text-muted-foreground">
                    {capability.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {capability.mode === "read"
                      ? "خواندنی"
                      : "تغییردهنده؛ نیازمند مجوز و جریان تأیید مربوط به عملیات"}
                  </span>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
      {adding && data && definition && (
        <DeviceFormDialog
          draftOwnerId={userId}
          initialDevice={definition.registration}
          initialCompanyId={companyId || undefined}
          onClose={() => setAdding(false)}
        />
      )}
    </main>
  );
}

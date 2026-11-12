"use client";
import { useEffect, useId, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Archive,
  ArrowDownUp,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  HelpCircle,
  Activity,
  LoaderCircle,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Server,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { type User } from "@/entities/user";
import {
  DeviceIcon,
  deviceTypeLabels,
  environmentLabels,
  statusLabels,
  type Device,
  type DeviceListQuery,
  useDevicesQuery,
  useDeviceCompaniesQuery,
  useRestoreDeviceMutation,
} from "@/entities/device";
import {
  ArchiveDeviceDialog,
  DeviceDetailsDialog,
  DeviceFormDialog,
  CredentialLibraryDialog,
} from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import styles from "./devices.module.css";
const number = (value: number) => value.toLocaleString("fa-IR");
const date = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value));
export function DevicesWorkspace({
  user,
  overview = false,
  recorderInventory = false,
}: {
  user: User;
  overview?: boolean;
  recorderInventory?: boolean;
}) {
  const [query, setQuery] = useState<DeviceListQuery>({
    page: 1,
    pageSize: 20,
    sort: "createdAt",
    direction: "desc",
  });
  const [search, setSearch] = useState("");
  const [managingCredentials, setManagingCredentials] = useState(false);
  const [editing, setEditing] = useState<Device | null | undefined>();
  const [details, setDetails] = useState<Device>();
  const [archiving, setArchiving] = useState<Device>();
  const { data, currentData, isFetching, isLoading, error, refetch } = useDevicesQuery({
    ...query,
    ...(recorderInventory ? { category: "recorder" } : {}),
  });
  const companies = useDeviceCompaniesQuery();
  const archived = query.inventory === "archived";
  const [restoreDevice, { isLoading: restoring, originalArgs: restoringId }] =
    useRestoreDeviceMutation();
  const filtersId = useId();
  const canWrite = user.role !== "co_employee";
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
  function filter(key: string, value: string) {
    setQuery((current) => ({ ...current, [key]: value || undefined, page: 1 }));
  }
  const stats = error ? undefined : data?.stats;
  const summary = [
    {
      key: "total",
      label: recorderInventory ? "ضبط‌کننده‌ها" : "کل تجهیزات",
      icon: Server,
      count: stats?.total,
      tone: "primary",
    },
    { key: "online", label: "آنلاین", icon: Check, count: stats?.online, tone: "success" },
    {
      key: "needsReview",
      label: "نیازمند بررسی",
      icon: CircleAlert,
      count: stats?.needsReview,
      tone: "danger",
    },
    { key: "unknown", label: "بررسی‌نشده", icon: HelpCircle, count: stats?.unknown, tone: "muted" },
  ];
  const activeFilters = [
    query.type,
    query.status,
    query.environment,
    query.companyId,
    recorderInventory ? undefined : query.category,
  ].filter(Boolean).length;
  const rows = currentData?.items ?? [];
  const pages = Math.max(1, Math.ceil((currentData?.total ?? 0) / query.pageSize));
  return (
    <main className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>
            دارایی‌ها / {recorderInventory ? "دوربین‌ها" : overview ? "نمای کلی" : "تجهیزات"}
          </span>
          <h1>
            {recorderInventory
              ? archived
                ? "دوربین‌ها و ضبط‌کننده‌های بایگانی‌شده"
                : "دوربین‌ها و ضبط‌کننده‌ها"
              : archived
                ? "تجهیزات بایگانی‌شده"
                : overview
                  ? "نمای کلی دارایی‌ها"
                  : "تجهیزات"}
          </h1>
          <p>
            {recorderInventory
              ? "دوربین‌های IP و ضبط‌کننده‌های NVR و DVR شرکت‌های فضای کاری؛ پروفایل‌ها و وضعیت ضبط در جزئیات هر تجهیز در دسترس‌اند."
              : "فهرست تجهیزات شبکه، سرورها و ضبط‌کننده‌های فضای کاری شما"}
          </p>
        </div>
        <div className={styles.headingActions}>
          {overview && (
            <Link href="/dashboard/assets/devices" className={styles.textLink}>
              فهرست تجهیزات <ChevronLeft size={15} />
            </Link>
          )}
          <Button
            variant="outline"
            aria-pressed={archived}
            onClick={() => filter("inventory", archived ? "" : "archived")}
          >
            <Archive size={16} />
            {recorderInventory
              ? archived
                ? "دوربین‌ها و ضبط‌کننده‌های فعال"
                : "دوربین‌ها و ضبط‌کننده‌های بایگانی‌شده"
              : archived
                ? "تجهیزات فعال"
                : "تجهیزات بایگانی‌شده"}
          </Button>
          <Button variant="outline" onClick={() => setManagingCredentials(true)}>
            مدیریت اعتبارنامه‌ها
          </Button>
          <Button onClick={() => setEditing(null)}>
            <Plus size={17} />
            {recorderInventory ? "افزودن دوربین / ضبط‌کننده" : "افزودن تجهیز"}
          </Button>
        </div>
      </header>
      <section className={styles.stats} aria-label="آمار تجهیزات">
        {summary.map(({ key, label, icon: Icon, count, tone }) => (
          <div className={styles.stat} key={key} data-tone={tone}>
            <span className={styles.statIcon}>
              <Icon size={18} aria-hidden="true" />
            </span>
            <div>
              <span>{label}</span>
              <strong>{count === undefined ? "—" : number(count)}</strong>
            </div>
          </div>
        ))}
      </section>
      <section className={styles.panel} aria-labelledby="devices-table-title">
        <header className={styles.panelHeading}>
          <div>
            <h2 id="devices-table-title">
              {recorderInventory ? "فهرست دوربین‌ها و ضبط‌کننده‌ها" : "فهرست تجهیزات"}
            </h2>
            <span>{currentData ? `${number(currentData.total)} تجهیز` : "تجهیزات ثبت‌شده"}</span>
          </div>
          <button
            type="button"
            className={styles.refresh}
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            aria-label="به‌روزرسانی تجهیزات"
            title="به‌روزرسانی تجهیزات"
          >
            <RefreshCw
              size={17}
              className={isFetching ? "animate-spin motion-reduce:animate-none" : ""}
            />
          </button>
        </header>
        <div className={styles.toolbar}>
          <label className={styles.search}>
            <Search size={17} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="جستجوی نام، آدرس، سازنده، محل نصب یا برچسب…"
              aria-label="جستجوی سریع تجهیزات"
              maxLength={120}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="پاک کردن جستجو">
                <X size={14} />
              </button>
            )}
          </label>
          <div className={styles.tools}>
            <label className={styles.sort}>
              <ArrowDownUp size={16} aria-hidden="true" />
              <span className="sr-only">مرتب‌سازی تجهیزات</span>
              <Select
                label="مرتب‌سازی تجهیزات"
                value={`${query.sort}:${query.direction}`}
                onValueChange={(value) => {
                  const [sort, direction] = value.split(":");
                  setQuery((current) => ({ ...current, sort, direction, page: 1 }));
                }}
                options={[
                  { value: "createdAt:desc", label: "جدیدترین" },
                  { value: "createdAt:asc", label: "قدیمی‌ترین" },
                  { value: "name:asc", label: "نام: صعودی" },
                  { value: "name:desc", label: "نام: نزولی" },
                  { value: "vendor:asc", label: "سازنده" },
                  { value: "status:asc", label: "وضعیت" },
                ]}
              />
            </label>
            <details className={styles.filters}>
              <summary>
                <SlidersHorizontal size={16} aria-hidden="true" />
                فیلتر{activeFilters > 0 && <b>{number(activeFilters)}</b>}
              </summary>
              <div className={styles.filterPopover} id={filtersId}>
                <label>
                  وضعیت
                  <Select
                    label="فیلتر وضعیت"
                    value={query.status ?? ""}
                    onValueChange={(value) => filter("status", value)}
                    options={[
                      { value: "", label: "همه وضعیت‌ها" },
                      ...Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
                    ]}
                  />
                </label>
                {!recorderInventory && (
                  <label>
                    دسته
                    <Select
                      label="فیلتر دسته"
                      value={query.category ?? ""}
                      onValueChange={(value) => filter("category", value)}
                      options={[
                        { value: "", label: "همه تجهیزات" },
                        { value: "network", label: "شبکه / سرور", icon: <Network /> },
                        { value: "recorder", label: "ضبط‌کننده", icon: <Server /> },
                      ]}
                    />
                  </label>
                )}
                <label>
                  شرکت مالک
                  <Select
                    label="فیلتر شرکت مالک"
                    value={query.companyId ?? ""}
                    disabled={companies.isLoading}
                    onValueChange={(value) => filter("companyId", value)}
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
                    <button
                      type="button"
                      aria-label="دریافت دوبارهٔ شرکت‌ها"
                      disabled={companies.isFetching}
                      onClick={() => void companies.refetch()}
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </label>
                <label>
                  نوع تجهیز
                  <Select
                    label="فیلتر نوع تجهیز"
                    value={query.type ?? ""}
                    onValueChange={(value) => filter("type", value)}
                    options={[
                      { value: "", label: "همه انواع" },
                      ...Object.entries(deviceTypeLabels)
                        .filter(
                          ([value]) =>
                            !recorderInventory || ["nvr", "dvr", "camera"].includes(value),
                        )
                        .map(([value, label]) => ({
                          value,
                          label,
                          icon: <DeviceIcon type={value} />,
                        })),
                    ]}
                  />
                </label>
                <label>
                  محیط
                  <Select
                    label="فیلتر محیط"
                    value={query.environment ?? ""}
                    onValueChange={(value) => filter("environment", value)}
                    options={[
                      { value: "", label: "همه محیط‌ها" },
                      ...Object.entries(environmentLabels).map(([value, label]) => ({
                        value,
                        label,
                      })),
                    ]}
                  />
                </label>
                <button
                  className={styles.textLink}
                  type="button"
                  disabled={!activeFilters}
                  onClick={() =>
                    setQuery((current) => ({
                      page: 1,
                      pageSize: current.pageSize,
                      inventory: current.inventory,
                      search: current.search,
                      sort: current.sort,
                      direction: current.direction,
                    }))
                  }
                >
                  حذف فیلترها
                </button>
              </div>
            </details>
          </div>
        </div>
        {error ? (
          <div className={styles.empty} role="alert">
            <CircleAlert size={28} />
            <h3>دریافت تجهیزات انجام نشد</h3>
            <p>{apiErrorMessage(error)}</p>
            <Button
              variant="outline"
              onClick={() => {
                void refetch();
              }}
              disabled={isFetching}
            >
              {isFetching ? "در حال تلاش…" : "تلاش دوباره"}
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.tableWrap} aria-busy={isFetching}>
              <table className={styles.table}>
                <caption className="sr-only">
                  تجهیزات فضای کاری با وضعیت، آدرس و مشخصات اتصال
                </caption>
                <thead>
                  <tr>
                    <th scope="col">تجهیز / سازنده</th>
                    <th scope="col">آدرس مدیریت</th>
                    <th scope="col">نوع تجهیز</th>
                    <th scope="col">وضعیت</th>
                    <th scope="col">محیط</th>
                    <th scope="col">تاریخ ثبت</th>
                    <th scope="col">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading || (isFetching && !currentData)
                    ? Array.from({ length: 5 }, (_, index) => (
                        <tr key={index} aria-hidden="true">
                          {Array.from({ length: 7 }, (_, column) => (
                            <td key={column}>
                              <div className={styles.skeleton} />
                            </td>
                          ))}
                        </tr>
                      ))
                    : rows.map((device) => (
                        <tr key={device.id}>
                          <td>
                            <div className={styles.identity}>
                              <DeviceIcon vendor={device.vendor} type={device.type} />
                              <div>
                                <strong>
                                  {archived ? (
                                    device.name
                                  ) : (
                                    <Link
                                      className="hover:underline"
                                      href={`/dashboard/assets/devices/${device.id}`}
                                    >
                                      {device.name}
                                    </Link>
                                  )}
                                </strong>
                                <span>
                                  <bdi>{device.vendor}</bdi>
                                  {device.tags.length > 0 && (
                                    <span title={device.tags.join("، ")}>
                                      {" "}
                                      · {device.tags.slice(0, 2).join("، ")}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.address}>
                              <bdi>{device.host}</bdi>
                              <span dir="ltr">
                                {device.protocol.toUpperCase()} : {device.managementPort}
                              </span>
                            </div>
                          </td>
                          <td>{deviceTypeLabels[device.type]}</td>
                          <td>
                            <span className={styles.status} data-status={device.status}>
                              <i />
                              {statusLabels[device.status]}
                            </span>
                          </td>
                          <td>
                            <span className={styles.environment}>
                              {environmentLabels[device.environment]}
                            </span>
                          </td>
                          <td className={styles.date}>{date(device.createdAt)}</td>
                          <td>
                            <div className={styles.rowActions}>
                              {archived ? (
                                canWrite && (
                                  <Button
                                    variant="outline"
                                    disabled={isFetching || restoring}
                                    onClick={async () => {
                                      try {
                                        const result = await restoreDevice(device.id).unwrap();
                                        toast.success(result.message);
                                        if (rows.length === 1 && query.page > 1)
                                          setQuery((current) =>
                                            current === query
                                              ? { ...current, page: current.page - 1 }
                                              : current,
                                          );
                                      } catch (error) {
                                        toast.error(apiErrorMessage(error));
                                      }
                                    }}
                                  >
                                    {restoring && restoringId === device.id
                                      ? "در حال بازیابی…"
                                      : "بازگردانی"}
                                  </Button>
                                )
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    aria-label={`جزئیات و تست اتصال ${device.name}`}
                                    title="جزئیات و تست اتصال"
                                    onClick={() => setDetails(device)}
                                  >
                                    <Activity size={16} />
                                  </button>
                                  {canWrite && (
                                    <>
                                      <button
                                        type="button"
                                        disabled={isFetching}
                                        aria-label={`ویرایش ${device.name}`}
                                        title="ویرایش تجهیز"
                                        onClick={() => setEditing(device)}
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isFetching}
                                        aria-label={`بایگانی ${device.name}`}
                                        title="بایگانی تجهیز"
                                        onClick={() => setArchiving(device)}
                                      >
                                        <Archive size={16} />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
            {!isFetching && currentData && rows.length === 0 && (
              <div className={styles.empty}>
                <Server size={30} />
                <h3>
                  {query.search || activeFilters
                    ? "تجهیزی با این مشخصات پیدا نشد"
                    : archived
                      ? "بایگانی خالی است"
                      : "هنوز تجهیزی ثبت نشده است"}
                </h3>
                <p>
                  {query.search || activeFilters
                    ? "عبارت جستجو یا فیلترها را تغییر دهید."
                    : archived
                      ? "تجهیزات بایگانی‌شده در اینجا نمایش داده می‌شوند."
                      : "برای شروع، مشخصات اولین تجهیز را به فهرست اضافه کنید."}
                </p>
                {!archived && !query.search && !activeFilters && (
                  <Button variant="outline" onClick={() => setEditing(null)}>
                    <Plus size={16} />
                    افزودن تجهیز
                  </Button>
                )}
              </div>
            )}
            <footer className={styles.pagination}>
              <span role="status" aria-live="polite">
                {isFetching ? (
                  <>
                    <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" />
                    در حال دریافت…
                  </>
                ) : currentData ? (
                  `${number(currentData.total)} نتیجه · صفحه ${number(query.page)} از ${number(pages)}`
                ) : (
                  ""
                )}
              </span>
              <div>
                <label>
                  تعداد در صفحه
                  <Select
                    label="تعداد در صفحه"
                    value={String(query.pageSize)}
                    onValueChange={(value) =>
                      setQuery((current) => ({ ...current, pageSize: Number(value), page: 1 }))
                    }
                    options={[10, 20, 50].map((n) => ({ value: String(n), label: number(n) }))}
                  />
                </label>
                <button
                  type="button"
                  aria-label="صفحه قبل"
                  disabled={query.page <= 1 || isFetching}
                  onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}
                >
                  <ChevronRight size={17} />
                </button>
                <button
                  type="button"
                  aria-label="صفحه بعد"
                  disabled={query.page >= pages || isFetching}
                  onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}
                >
                  <ChevronLeft size={17} />
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
      {managingCredentials && (
        <CredentialLibraryDialog onClose={() => setManagingCredentials(false)} />
      )}
      {editing !== undefined && (
        <DeviceFormDialog
          device={editing ?? undefined}
          draftOwnerId={user.id}
          initialCategory={recorderInventory ? "recorder" : "network"}
          onClose={() => setEditing(undefined)}
        />
      )}
      {details && (
        <DeviceDetailsDialog
          device={details}
          canTest={canWrite}
          onClose={() => setDetails(undefined)}
        />
      )}
      {archiving && (
        <ArchiveDeviceDialog device={archiving} onClose={() => setArchiving(undefined)} />
      )}
    </main>
  );
}

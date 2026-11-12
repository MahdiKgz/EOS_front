"use client";
import { useRef } from "react";
import { Cpu, LoaderCircle, RefreshCw, Shield } from "lucide-react";
import toast from "react-hot-toast";
import {
  useFortigateCapabilitiesQuery,
  useRefreshDeviceCapabilitiesMutation,
} from "@/entities/device";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/api/error-message";
import { FortigateActions } from "./fortigate-actions";
import { FortigateDailyReport } from "./fortigate-daily-report";
import { InventoryTable } from "./inventory-table";
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }),
  number = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const state: Record<string, string> = {
  collected: "دریافت‌شده",
  partial: "بخشی از داده‌ها",
  not_supported: "پشتیبانی‌نشده",
  requires_privilege: "نیازمند مجوز",
  command_failed: "فرمان ناموفق",
  not_collected: "دریافت‌نشده",
  failed: "ناموفق",
  unsupported: "هویت تأییدنشده",
};
const labels: Record<string, string> = {
  id: "شناسه",
  "short-name": "نام کوتاه",
  "vcluster-id": "شناسهٔ کلاستر",
  description: "توضیح",
  name: "نام",
  ip: "آدرس IP",
  vdom: "VDOM",
  mode: "روش",
  type: "نوع",
  role: "کاربری",
  allowaccess: "دسترسی مدیریتی",
  administrativeStatus: "وضعیت تنظیم‌شده",
  vlanid: "VLAN",
  parent: "رابط والد",
  alias: "نام نمایشی",
  status: "وضعیت",
  speed: "سرعت",
  duplex: "Duplex",
  profile: "پروفایل",
  trustHosts: "مبداهای مجاز",
  srcintf: "رابط مبدا",
  dstintf: "رابط مقصد",
  srcaddr: "آدرس مبدا",
  dstaddr: "آدرس مقصد",
  service: "سرویس",
  action: "رفتار",
  nat: "NAT",
  logtraffic: "ثبت لاگ",
  subnet: "زیرشبکه",
  fqdn: "نام دامنه",
  member: "اعضا",
  members: "اعضای مورد بررسی",
  interface: "رابط",
  zone: "Zone",
  gateway: "Gateway",
  server: "سرور",
  src: "مراجع مبدأ",
  dst: "مراجع مقصد",
  "priority-members": "اعضا به ترتیب اولویت",
  "service-sla-tie-break": "انتخاب عضو Zone",
  protocol: "پروتکل",
  day: "روز",
  start: "شروع",
  end: "پایان",
  extip: "IP خارجی",
  mappedip: "IP داخلی",
  extintf: "رابط خارجی",
  portforward: "انتقال پورت",
  extport: "پورت خارجی",
  mappedport: "پورت داخلی",
  startip: "IP شروع",
  endip: "IP پایان",
  phase1: "Phase 1",
  phase2: "Phase 2",
  rxBytes: "بایت دریافتی",
  txBytes: "بایت ارسالی",
};
const commands: Record<string, string> = {
  system: "هویت سیستم",
  performance: "منابع و نشست‌ها",
  processes: "پردازش‌ها",
  interfaces: "رابط‌ها",
  physical: "رابط‌های فیزیکی",
  counters: "شمارندهٔ ترافیک",
  routes: "مسیریابی",
  dns: "DNS جاری",
  dnsConfig: "پیکربندی DNS",
  fortiguard: "FortiGuard",
  admins: "مدیران",
  zones: "Zone",
  policies: "Policy",
  addresses: "آدرس‌ها",
  addressGroups: "گروه آدرس",
  services: "سرویس‌ها",
  serviceGroups: "گروه سرویس",
  schedules: "زمان‌بندی",
  vips: "VIP",
  ipPools: "IP Pool",
  ipsecSummary: "خلاصهٔ IPsec",
  ipsecStatus: "وضعیت IPsec",
  sslMonitor: "کاربران SSL-VPN",
  phase1: "IPsec Phase 1",
  phase2: "IPsec Phase 2",
  sslSettings: "تنظیم SSL-VPN",
  ha: "وضعیت HA",
  haConfig: "تنظیم HA",
  sdwan: "تنظیم SD-WAN",
  vdoms: "VDOM",
  vdomProperties: "توضیحات VDOM",
  arp: "ARP",
  arpDiagnostic: "ARP تشخیصی",
  neighbors: "همسایه‌ها",
};
const display = (value: unknown): string =>
  value === null || value === undefined
    ? "—"
    : typeof value === "boolean"
      ? value
        ? "بله"
        : "خیر"
      : typeof value === "number"
        ? number.format(value)
        : String(value);
export function FortigateCapabilities({
  id,
  canWrite,
  companyId,
}: {
  id: string;
  canWrite: boolean;
  companyId?: string | null;
}) {
  const query = useFortigateCapabilitiesQuery(id, {
      pollingInterval: 15000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    }),
    [refresh, mutation] = useRefreshDeviceCapabilitiesMutation(),
    lock = useRef(false);
  const data =
    !query.error && query.currentData?.companyId === (companyId ?? null)
      ? query.currentData
      : undefined;
  const busy = mutation.isLoading || !!data?.running,
    latest = data?.latest,
    collection = latest?.collection;
  return (
    <section
      className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-5"
      aria-label="موجودی FortiGate"
      aria-busy={busy}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Shield size={18} />
            موجودی و وضعیت FortiGate
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            داده‌های خواندنی FortiOS؛ وضعیت پینگ مستقل از تأیید اتصال مدیریتی است.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label="دریافت دوبارهٔ گزارش FortiGate"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
          </Button>
          {canWrite && (
            <Button
              size="sm"
              disabled={busy || !data || query.isLoading || !!query.error}
              onClick={async () => {
                if (lock.current) return;
                lock.current = true;
                try {
                  const result = await refresh(id).unwrap();
                  if (result.supported) toast.success("موجودی FortiGate به‌روزرسانی شد.");
                  else toast.error("هویت FortiOS از این تجهیز تأیید نشد.");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                } finally {
                  lock.current = false;
                }
              }}
            >
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}{" "}
              {busy ? "در حال گردآوری…" : "کشف و تازه‌سازی"}
            </Button>
          )}
        </div>
      </header>
      {query.error && (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(query.error)}
        </p>
      )}
      {!query.error && !data && (
        <p role="status" className="text-sm text-muted-foreground">
          در حال دریافت گزارش…
        </p>
      )}
      {data?.lastErrorCode && (
        <p role="alert" className="rounded-lg border border-destructive/50 p-3 text-sm">
          گردآوری اخیر ناموفق بود. حساب SSH، کلید میزبان، مقصد و مجوز خواندن وضعیت سیستم را بررسی
          کنید.
        </p>
      )}
      {latest ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
            <time>آخرین دریافت: {date.format(new Date(latest.collectedAt))}</time>
            <bdi>
              {latest.source.host}:{latest.source.port}
            </bdi>
            <span>{data?.stale ? "گزارش قدیمی؛ نیازمند تازه‌سازی" : "گزارش تازه"}</span>
          </div>
          {!latest.detection.supported && (
            <p role="alert" className="text-sm">
              خروجی نسخه، هویت FortiGate را تأیید نکرد. اطلاعات دیگری از این مقصد جمع‌آوری نشد.
            </p>
          )}
          {collection && (
            <>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                {[
                  ["CPU", collection.health.cpuUsagePercent, "٪"],
                  ["حافظه", collection.health.memoryUsagePercent, "٪"],
                  ["نشست‌های فعال", collection.health.sessionCount, ""],
                  ["رابط‌های دارای شمارنده", collection.interfaceCounters.length, ""],
                ].map(([title, value, unit]) => (
                  <article key={String(title)} className="rounded-lg border bg-background p-3">
                    <small className="text-muted-foreground">{title}</small>
                    <p className="mt-2 flex items-center gap-2 font-semibold">
                      <Cpu size={14} className="text-primary" />
                      {display(value)}
                      {value !== null && unit}
                    </p>
                  </article>
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs xl:grid-cols-4">
                {[
                  ["نام میزبان", collection.system.hostname],
                  ["مدل", collection.system.model],
                  ["نسخه", collection.system.version],
                  ["سریال", collection.system.serial],
                  ["مجوز", collection.system.license],
                  ["حالت کار", collection.system.operationMode],
                  ["HA", collection.system.haMode],
                  ["VDOM", collection.system.vdomMode],
                  ["VDOM جاری", collection.system.currentVdom],
                  ["زمان تجهیز", collection.system.systemTime],
                  ["مدت کارکرد (ثانیه)", collection.health.uptimeSeconds],
                ].map(([title, value]) => (
                  <div key={String(title)}>
                    <dt className="text-muted-foreground">{title}</dt>
                    <dd className="mt-1 break-words">
                      <bdi>{display(value)}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
              {!!collection.warnings.length && (
                <p
                  role="status"
                  className="rounded-lg border p-3 text-xs leading-6 text-muted-foreground"
                >
                  بخشی از اطلاعات کامل نیست. وضعیت فرمان‌ها را بررسی کنید؛ دادهٔ دریافت‌نشده به معنی
                  نبود سرویس یا مقدار صفر نیست.
                </p>
              )}
              <FortigateDailyReport report={collection.dailyCheck} logs={collection.logs} />
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {collection.tables.map((table) => (
                  <InventoryTable
                    key={table.key}
                    title={`${table.title} · ${state[table.state] ?? table.state}`}
                    headers={table.columns.map((key) => labels[key] ?? key)}
                    rows={table.rows.map((row) => table.columns.map((key) => display(row[key])))}
                    unavailable={table.state !== "collected"}
                    open={table.key === "interfaces"}
                  />
                ))}
                <InventoryTable
                  title="شمارنده‌های ترافیک"
                  headers={["رابط", "بایت دریافتی", "بایت ارسالی"]}
                  rows={collection.interfaceCounters.map((row) => [
                    row.name,
                    number.format(row.rxBytes),
                    number.format(row.txBytes),
                  ])}
                  unavailable={
                    collection.commandEvidence.find((row) => row.commandId === "counters")
                      ?.state !== "collected"
                  }
                />
              </div>
              <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                {collection.rawSections.map((section) => (
                  <details
                    key={section.key}
                    className="min-w-0 rounded-lg border bg-background p-3"
                  >
                    <summary className="cursor-pointer text-sm">
                      {section.title} · {state[section.state] ?? section.state}
                    </summary>
                    {section.lines.length ? (
                      <pre
                        className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs leading-6"
                        dir="ltr"
                      >
                        {section.lines.join("\n")}
                      </pre>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">داده‌ای گزارش نشده است.</p>
                    )}
                  </details>
                ))}
              </div>
              <InventoryTable
                title="وضعیت گردآوری"
                headers={["بخش", "وضعیت", "تعداد سطر"]}
                rows={collection.commandEvidence.map((row) => [
                  commands[row.commandId] ?? row.commandId,
                  state[row.state] ?? row.state,
                  number.format(row.lineCount),
                ])}
              />
            </>
          )}
        </div>
      ) : (
        !!data &&
        !query.error && (
          <p className="text-sm leading-7 text-muted-foreground">
            هنوز موجودی FortiGate دریافت نشده است.{" "}
            {canWrite
              ? "برای دریافت، کشف و تازه‌سازی را اجرا کنید."
              : "مدیر فضای کاری می‌تواند موجودی را دریافت کند."}
          </p>
        )
      )}
      <FortigateActions
        key={`${id}-${companyId ?? "none"}`}
        id={id}
        companyId={companyId}
        canWrite={canWrite}
        collection={collection}
      />
      {!!data?.history.length && (
        <InventoryTable
          title="تاریخچهٔ گردآوری"
          headers={["زمان", "کاربر", "نتیجه", "فرمان موفق"]}
          rows={data.history
            .slice(0, 10)
            .map((row) => [
              date.format(new Date(row.completedAt)),
              row.actorName,
              state[row.status] ?? row.status,
              number.format(row.commandCount),
            ])}
        />
      )}
    </section>
  );
}

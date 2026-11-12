"use client";
import { CiscoAccessDialog } from "./cisco-access-dialog";
import { useRef, useState } from "react";
import { Cpu, LoaderCircle, RefreshCw, Settings2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeviceCapabilitiesQuery,
  useRefreshDeviceCapabilitiesMutation,
  type CiscoSection,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { InventoryTable } from "./inventory-table";
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });
const states: Record<string, string> = {
  collected: "دریافت‌شده",
  partial: "بخشی از داده‌ها",
  not_supported: "پشتیبانی‌نشده",
  command_failed: "فرمان ناموفق",
  not_collected: "دریافت‌نشده",
  read_only: "خواندنی",
  unknown: "نامشخص",
  not_configured: "تنظیم‌نشده",
  requires_privilege: "نیازمند مجوز",
  available: "در دسترس",
  unsupported: "خانوادهٔ پشتیبانی‌نشده",
  failed: "ناموفق",
};
const accessErrors: Record<string, string> = {
  CISCO_ENABLE_REQUIRED:
    "اتصال در سطح کاربر است. از «تنظیم اتصال»، اعتبارنامهٔ enable را انتخاب و دوباره تست کنید.",
  CISCO_ENABLE_FAILED:
    "ورود به enable ناموفق بود. گذرواژه و مجوز اعتبارنامهٔ جداگانه را بررسی کنید.",
  CISCO_NEGOTIATION_FAILED:
    "الگوریتم‌های SSH سازگار نیستند. برای دستگاه قدیمی، پروفایل سازگاری را از «تنظیم اتصال» انتخاب کنید.",
  CISCO_AUTH_FAILED: "ورود SSH انجام نشد. نام کاربری و اعتبارنامهٔ اتصال را بررسی کنید.",
  CISCO_HOST_KEY_MISMATCH: "کلید میزبان Cisco مطابقت ندارد. کلید ثبت‌شده را بررسی کنید.",
};
const groups: Record<string, string> = {
  System: "سیستم",
  Inventory: "سخت‌افزار",
  Interfaces: "رابط‌ها",
  Switching: "سوییچینگ",
  VLAN: "VLAN",
  Routing: "مسیریابی",
  ACL: "ACL",
  NAT: "NAT",
  DHCP: "DHCP",
  AAA: "احراز هویت تجهیز",
  Monitoring: "پایش",
  Backup: "پیکربندی",
  Diagnostics: "عیب‌یابی",
  Security: "امنیت",
  Services: "سرویس‌ها",
};
const sections: Record<string, string> = {
  trunk: "Trunk",
  etherchannel: "EtherChannel",
  spanningTree: "Spanning Tree",
  hosts: "نام‌های میزبان",
  arp: "ARP",
  macAddressTable: "جدول MAC",
  vlans: "VLAN",
  routingTable: "جدول مسیر",
  staticRoutes: "مسیرهای ثابت",
  ospfNeighbors: "همسایه‌های OSPF",
  eigrpNeighbors: "همسایه‌های EIGRP",
  bgpSummary: "خلاصهٔ BGP",
  cdpNeighbors: "همسایه‌های CDP",
  lldpNeighbors: "همسایه‌های LLDP",
  runningConfigMetadata: "اطلاعات پیکربندی جاری",
  startupConfigMetadata: "اطلاعات پیکربندی راه‌اندازی",
  accessLists: "فهرست‌های دسترسی",
  nat: "NAT",
  dhcpPools: "مخزن‌های DHCP",
  dhcpBindings: "اجاره‌های DHCP",
  aaa: "سرویس‌های AAA",
  localUsers: "کاربران محلی",
  ssh: "SSH",
  snmp: "SNMP",
  syslogDestinations: "مقصدهای Syslog",
  ntp: "NTP",
};
const fields: Record<string, string> = {
  name: "نام",
  description: "توضیح",
  model: "مدل",
  version: "نسخه",
  serialNumber: "سریال",
  ipAddress: "آدرس IP",
  ok: "وضعیت IP",
  method: "روش",
  administrativeStatus: "وضعیت مدیریتی",
  operationalStatus: "وضعیت عملیاتی",
  raw: "خروجی",
  status: "وضعیت",
  vlan: "VLAN",
  duplex: "Duplex",
  speed: "سرعت",
  mediaType: "رسانه",
  vlanId: "VLAN",
  ports: "پورت‌ها",
  group: "گروه",
  portChannel: "Port Channel",
  protocol: "پروتکل",
  key: "مشخصه",
  value: "مقدار",
  action: "عملیات",
  username: "کاربر",
  secretStored: "دارای رمز",
  rxBytes: "بایت دریافتی",
  txBytes: "بایت ارسالی",
};
const commands: Record<string, string> = {
  platform: "نسخه و خانواده",
  inventory: "سخت‌افزار",
  cpu: "CPU",
  memory: "حافظه",
  flash: "ذخیره‌ساز",
  interfacesStatus: "وضعیت رابط‌ها",
  interfacesDetailed: "جزئیات رابط‌ها",
  interfacesErrors: "خطاهای رابط",
  ipInterfaceBrief: "IP رابط‌ها",
  runningConfigHostname: "نام میزبان",
  vlanBrief: "VLAN",
  trunk: "Trunk",
  etherchannel: "EtherChannel",
  spanningTree: "STP",
  route: "مسیرها",
  arp: "ARP",
  macAddressTable: "جدول MAC",
  cdpNeighbors: "CDP",
  lldpNeighbors: "LLDP",
  ospfNeighbors: "OSPF",
  eigrpNeighbors: "EIGRP",
  bgpSummary: "BGP",
  acl: "ACL",
  nat: "NAT",
  dhcpPools: "DHCP Pool",
  dhcpBindings: "اجارهٔ DHCP",
  hosts: "نام‌های میزبان",
  aaa: "AAA",
  localUsers: "کاربران",
  sshStatus: "SSH",
  snmp: "SNMP",
  logging: "Syslog",
  ntpStatus: "NTP",
  clock: "زمان",
  licenseSummary: "مجوزها",
  runningConfigMetadata: "پیکربندی جاری",
  startupConfigMetadata: "پیکربندی راه‌اندازی",
};
function cell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (typeof value === "number") return value.toLocaleString("fa-IR");
  return typeof value === "string" ? value : JSON.stringify(value);
}
function Rows({
  title,
  rows,
  unavailable = false,
}: {
  title: string;
  rows: Record<string, unknown>[];
  unavailable?: boolean;
}) {
  const all = [...new Set(rows.flatMap((row) => Object.keys(row)))],
    columns = (all.length > 1 ? all.filter((key) => key !== "raw") : all).slice(0, 10);
  return (
    <InventoryTable
      title={title}
      unavailable={unavailable}
      headers={columns.map((key) => fields[key] ?? key)}
      rows={rows.map((row) => columns.map((key) => cell(row[key])))}
    />
  );
}
function SectionTables({
  values,
}: {
  values: Record<string, CiscoSection | Record<string, unknown>[] | string>;
}) {
  return (
    <>
      {Object.entries(values)
        .filter(([, value]) => typeof value !== "string")
        .map(([key, value]) => {
          if (typeof value === "string") return null;
          const rows = Array.isArray(value) ? value : (value.entries ?? []),
            state = Array.isArray(value) ? undefined : value.state;
          return (
            <Rows
              key={key}
              title={`${sections[key] ?? key}${state ? ` · ${states[state] ?? state}` : ""}`}
              rows={rows}
              unavailable={
                !!state && ["command_failed", "not_collected", "not_supported"].includes(state)
              }
            />
          );
        })}
    </>
  );
}
export function CiscoCapabilities({
  id,
  canWrite,
  companyId,
}: {
  id: string;
  canWrite: boolean;
  companyId?: string | null;
}) {
  const [accessOpen, setAccessOpen] = useState(false);
  const report = useDeviceCapabilitiesQuery(id, {
      pollingInterval: 15000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    }),
    [refresh, result] = useRefreshDeviceCapabilitiesMutation(),
    lock = useRef(false);
  const data =
      !report.error && report.currentData?.companyId === (companyId ?? null)
        ? report.currentData
        : undefined,
    latest = data?.latest,
    collection = latest?.collection,
    busy = result.isLoading || !!data?.running;
  return (
    <section
      className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-5"
      aria-labelledby="cisco-capabilities-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="cisco-capabilities-title" className="flex items-center gap-2 font-semibold">
            <ShieldCheck size={18} className="text-primary" />
            موجودی و قابلیت‌های Cisco
          </h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            خانوادهٔ سیستم‌عامل و نتیجهٔ فرمان‌های خواندنی از خود تجهیز دریافت می‌شوند.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setAccessOpen(true)}>
              <Settings2 size={15} />
              تنظیم اتصال
            </Button>
          )}
          {accessOpen && <CiscoAccessDialog id={id} onClose={() => setAccessOpen(false)} />}
          <Button
            size="sm"
            variant="outline"
            disabled={report.isFetching}
            onClick={() => void report.refetch()}
            aria-label="دریافت دوبارهٔ گزارش Cisco"
          >
            <RefreshCw size={15} className={report.isFetching ? "animate-spin" : ""} />
          </Button>
          {canWrite && (
            <Button
              size="sm"
              disabled={busy || !data || report.isLoading || !!report.error}
              onClick={async () => {
                if (lock.current) return;
                lock.current = true;
                try {
                  const response = await refresh(id).unwrap();
                  if (response.supported)
                    toast.success("موجودی و قابلیت‌های Cisco به‌روزرسانی شد.");
                  else
                    toast.error("خانوادهٔ سیستم‌عامل شناسایی شد و برای مسیر IOS پشتیبانی نمی‌شود.");
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                } finally {
                  lock.current = false;
                }
              }}
            >
              {busy ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}{" "}
              {busy ? "در حال گردآوری…" : "کشف و تازه‌سازی قابلیت‌ها"}
            </Button>
          )}
        </div>
      </header>
      {report.error ? (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(report.error)}
        </p>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">
          در حال دریافت گزارش…
        </p>
      ) : (
        <>
          {data.lastErrorCode && (
            <p role="alert" className="text-sm text-destructive">
              {accessErrors[data.lastErrorCode ?? ""] ??
                "آخرین گردآوری ناموفق بود. مقصد، کلید میزبان، حساب SSH و مجوز EXEC را بررسی کنید."}
            </p>
          )}
          {!latest ? (
            <p className="rounded-lg border border-dashed p-5 text-sm leading-7 text-muted-foreground">
              هنوز خانواده و موجودی این تجهیز جمع‌آوری نشده است.{" "}
              {canWrite
                ? "از کشف قابلیت‌ها برای دریافت اطلاعات استفاده کنید."
                : "مدیر می‌تواند قابلیت‌های تجهیز را تازه‌سازی کند."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs">
                <span className={data.stale ? "text-muted-foreground" : "text-primary"}>
                  {data.stale ? "آخرین دادهٔ ذخیره‌شده؛ نیازمند تازه‌سازی" : "گزارش تازهٔ تجهیز"} ·{" "}
                  {date.format(new Date(latest.collectedAt))}
                </span>
                <bdi>
                  {latest.source.host}:{latest.source.port}
                </bdi>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ["خانواده", latest.detection.platform],
                  ["نسخه", latest.detection.version],
                  ["مدل", latest.detection.model],
                  ["نام میزبان", latest.detection.hostname],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-lg border bg-background/40 p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-2 break-words text-sm">
                      <bdi>{value ?? "—"}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
              {!latest.detection.supported && (
                <p role="alert" className="text-sm leading-7 text-destructive">
                  این خانواده برای فرمان‌های IOS/IOS-XE فعال نیست. پس از تشخیص، فرمان‌های بعدی اجرا
                  نشده‌اند.
                </p>
              )}
              {collection && (
                <>
                  <dl className="grid gap-3 rounded-lg border bg-background/40 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["سریال", collection.system.serialNumber],
                      ["مدت روشن بودن", collection.system.uptime],
                      ["تصویر سیستم‌عامل", collection.system.imageName],
                      ["اطلاعات راه‌اندازی", collection.system.bootInformation],
                    ].map(([label, value]) => (
                      <div key={label} className="min-w-0">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-2 break-all">
                          <bdi>{value ?? "—"}</bdi>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[
                      [
                        "CPU پنج ثانیه",
                        collection.health.cpu?.fiveSeconds == null
                          ? "نامشخص"
                          : cell(collection.health.cpu.fiveSeconds) + "٪",
                      ],
                      [
                        "CPU یک دقیقه",
                        collection.health.cpu?.oneMinute == null
                          ? "نامشخص"
                          : cell(collection.health.cpu.oneMinute) + "٪",
                      ],
                      [
                        "CPU پنج دقیقه",
                        collection.health.cpu?.fiveMinutes == null
                          ? "نامشخص"
                          : cell(collection.health.cpu.fiveMinutes) + "٪",
                      ],
                      [
                        "فضای آزاد ذخیره‌ساز",
                        collection.health.flash.freeBytes === null
                          ? "نامشخص"
                          : cell(collection.health.flash.freeBytes / 1024 ** 2) + " MiB",
                      ],
                      ...collection.health.memory
                        .slice(0, 3)
                        .map((pool) => [
                          "حافظهٔ " + pool.name,
                          cell((pool.usedBytes / pool.totalBytes) * 100) + "٪",
                        ]),
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border bg-background/40 p-3">
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Cpu size={14} />
                          {label}
                        </p>
                        <p className="mt-2 text-lg font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 rounded-lg border p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(collection.capabilityProfile.groups).map(([key, state]) => (
                      <div key={key} className="flex items-center justify-between gap-3">
                        <span>{groups[key] ?? key}</span>
                        <span className="text-muted-foreground">
                          {data.stale ? "نیازمند تازه‌سازی" : (states[state] ?? state)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {!!latest.warnings.length && (
                    <p className="text-xs leading-7 text-muted-foreground">
                      بخشی از اطلاعات دریافت نشده است. وضعیت هر فرمان و مجوز موردنیاز را در جزئیات
                      گردآوری بررسی کنید.
                    </p>
                  )}
                  <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                    <Rows title="سخت‌افزار" rows={collection.system.inventory} />
                    <Rows
                      title={`خلاصهٔ رابط‌ها · ${states[collection.interfaces.state] ?? collection.interfaces.state}`}
                      rows={collection.interfaces.summary}
                    />
                    <Rows title="پورت‌های سوییچ" rows={collection.interfaces.switchports} />
                    <Rows title="شمارنده‌های رابط‌ها" rows={collection.interfaceCounters} />
                    <InventoryTable
                      title="حافظهٔ تجهیز"
                      headers={["مخزن", "کل MiB", "مصرف MiB", "آزاد MiB"]}
                      rows={collection.health.memory.map((pool) => [
                        pool.name,
                        cell(pool.totalBytes / 1024 ** 2),
                        cell(pool.usedBytes / 1024 ** 2),
                        cell(pool.freeBytes / 1024 ** 2),
                      ])}
                    />
                    <InventoryTable
                      title="خطاهای رابط‌ها"
                      headers={["خروجی"]}
                      rows={collection.interfaces.errors.map((line) => [line])}
                    />
                    <InventoryTable
                      title="زمان و مجوزهای نرم‌افزار"
                      headers={["دادهٔ دریافت‌شده"]}
                      rows={[...collection.system.clock, ...collection.system.license].map(
                        (line) => [line],
                      )}
                    />
                  </div>
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      شبکه و همسایه‌ها
                    </summary>
                    <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
                      <SectionTables values={collection.network} />
                    </div>
                  </details>
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      پیکربندی و سرویس‌های امنیتی
                    </summary>
                    <p className="mt-3 text-xs leading-7 text-muted-foreground">
                      اطلاعات پیکربندی خواندنی است؛ تشخیص تغییرات ذخیره‌نشده از این داده‌ها تأیید
                      نشده است. بک‌آپ و بازیابی از بخش مربوط به همان عملیات انجام می‌شود.
                    </p>
                    <div className="mt-3 grid min-w-0 gap-3 lg:grid-cols-2">
                      <SectionTables values={collection.configuration} />
                      <SectionTables values={collection.securityServices} />
                    </div>
                  </details>
                  <details className="rounded-lg border p-3">
                    <summary className="cursor-pointer text-sm font-medium">
                      جزئیات فرمان‌های گردآوری
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {collection.commandEvidence.map((command) => (
                        <details key={command.commandId} className="rounded-lg border p-3 text-xs">
                          <summary className="cursor-pointer">
                            {commands[command.commandId] ?? command.commandId} ·{" "}
                            {states[command.state] ?? command.state}
                          </summary>
                          {command.errorCode && (
                            <p className="mt-2 leading-6 text-destructive">
                              {command.errorCode === "CISCO_COMMAND_REQUIRES_PRIVILEGE"
                                ? "این فرمان به سطح دسترسی بالاتر نیاز دارد."
                                : command.errorCode === "CISCO_COMMAND_NOT_SUPPORTED"
                                  ? "فرمان در این نسخه پشتیبانی نمی‌شود."
                                  : command.errorCode === "CISCO_DEADLINE"
                                    ? "مهلت گردآوری تمام شد؛ دوباره تلاش کنید."
                                    : "فرمان کامل نشد. اتصال، مجوز و محدودیت خروجی را بررسی کنید."}
                            </p>
                          )}
                          {command.evidence.length > 0 && (
                            <pre
                              dir="ltr"
                              className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-left text-muted-foreground"
                            >
                              {command.evidence.join("\n")}
                            </pre>
                          )}
                        </details>
                      ))}
                    </div>
                  </details>
                </>
              )}
            </>
          )}
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-medium">
              سوابق گردآوری قابلیت‌ها
            </summary>
            <div className="mt-3 max-h-64 overflow-auto">
              {!data.history.length ? (
                <p className="text-xs text-muted-foreground">سابقه‌ای ثبت نشده است.</p>
              ) : (
                <table className="w-full whitespace-nowrap text-start text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      {["زمان", "کاربر", "نتیجه", "فرمان دریافت‌شده"].map((label) => (
                        <th key={label} className="p-2 text-start" scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((run) => (
                      <tr key={run.id} className="border-b last:border-0">
                        <td className="p-2">{date.format(new Date(run.completedAt))}</td>
                        <td className="p-2">{run.actorName}</td>
                        <td className="p-2">{states[run.status] ?? run.status}</td>
                        <td className="p-2">{cell(run.commandCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        </>
      )}
    </section>
  );
}

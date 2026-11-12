"use client";
import { useRef, useState } from "react";
import { Database, LoaderCircle, RefreshCw, Server, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import { useInspectEsxiMutation, type Device, type EsxiInventory } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { AssignApiCredential } from "./api-connection-dialog";
import { InventoryTable } from "./inventory-table";
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });
const number = (value: number | null) =>
  value === null ? "نامشخص" : value.toLocaleString("fa-IR");
const bool = (value: boolean | null) => (value === null ? "نامشخص" : value ? "بله" : "خیر");
const bytes = (value: number | null) =>
  value === null
    ? "نامشخص"
    : `${(value / 1024 ** 3).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} GiB`;
export function EsxiConnection({
  device,
  onSshSettings,
}: {
  device: Device;
  onSshSettings?: () => void;
}) {
  const ssh = device.protocol === "ssh";
  const [settings, setSettings] = useState(false);
  const [inspect, result] = useInspectEsxiMutation();
  const lock = useRef(false);
  const report = result.data;
  const current = report?.collectedAt === device.verification?.checkedAt;
  async function refresh() {
    if (lock.current) return;
    lock.current = true;
    try {
      await inspect({ id: device.id, transport: ssh ? "ssh" : "api" }).unwrap();
      toast.success("اتصال ESXi تأیید و موجودی دریافت شد.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
    }
  }
  return (
    <section
      className="grid gap-4 rounded-xl border bg-card p-5"
      aria-labelledby="esxi-inventory-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="esxi-inventory-title" className="flex items-center gap-2 font-semibold">
          <Server size={18} className="text-primary" />
          اتصال و موجودی ESXi
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={result.isLoading}
            onClick={() => (ssh ? onSshSettings?.() : setSettings(true))}
          >
            <Settings2 size={15} />
            {ssh ? "تنظیم اتصال SSH" : "اعتبارنامهٔ API"}
          </Button>
          <Button
            size="sm"
            disabled={result.isLoading || (!ssh && !device.apiCredentialId)}
            onClick={() => void refresh()}
          >
            {result.isLoading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            {result.isLoading ? "در حال دریافت…" : "دریافت موجودی"}
          </Button>
        </div>
      </header>
      {!ssh && !device.apiCredentialId && (
        <p className="text-sm text-muted-foreground">
          برای بررسی موجودی و تأیید اتصال SOAP، اعتبارنامهٔ API را انتخاب کنید.
        </p>
      )}
      {ssh && (
        <p className="text-xs leading-6 text-muted-foreground">
          موجودی خواندنی هاست از SSH دریافت می‌شود. ماشین‌های مجازی و سلامت سخت‌افزاری کامل به کانال
          SOAP API نیاز دارند.
        </p>
      )}
      {result.error && (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(result.error)}
        </p>
      )}
      {report && (
        <>
          <p className="text-xs text-muted-foreground">
            {current
              ? "زمان گردآوری"
              : "اطلاعات دریافت‌شدهٔ قبلی؛ اتصال فعلی به گردآوری دوباره نیاز دارد"}{" "}
            · {date.format(new Date(report.collectedAt))}
          </p>
          <EsxiReport report={report} />
        </>
      )}
      {!ssh && settings && (
        <AssignApiCredential device={device} onClose={() => setSettings(false)} />
      )}
    </section>
  );
}
export function EsxiReport({ report }: { report: EsxiInventory }) {
  const ssh = report.transport === "ssh";
  const unavailable = (key: string) =>
    !!report.coverage?.some((item) => item.key === key && item.status === "unavailable");
  return (
    <div className="grid min-w-0 gap-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["هاست", report.hostname],
          ["نسخه", `${report.version} build-${report.build}`],
          ["سخت‌افزار", `${report.hardwareVendor} ${report.model}`],
          ["وضعیت اتصال", report.connectionState],
          ["سلامت گزارش‌شده", report.overallStatus],
          ["حالت نگهداری", bool(report.maintenanceMode)],
          ["سریال", report.serialNumber || "—"],
          ["BIOS", report.biosVersion || "—"],
          ["Lockdown", report.lockdownMode || "—"],
          ["روشن‌شدن هاست", report.bootTime ? date.format(new Date(report.bootTime)) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words">
              <bdi>{value}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["CPU", report.cpuPercent, `${number(report.cpuCores)} هسته`],
          ["حافظه", report.memoryPercent, bytes(report.memoryBytes)],
        ].map(([label, value, detail]) => (
          <div key={String(label)} className="grid gap-2 rounded-lg border bg-background p-3">
            <div className="flex justify-between gap-2 text-sm">
              <span>{String(label)}</span>
              <span>
                {number(value as number | null)}
                {value !== null ? "٪" : ""}
              </span>
            </div>
            {typeof value === "number" && (
              <meter
                className="h-2 w-full accent-primary"
                aria-label={`مصرف ${label}`}
                min={0}
                max={100}
                value={value}
              />
            )}
            <p className="text-xs text-muted-foreground">{String(detail)}</p>
          </div>
        ))}
        <div className="grid gap-1 rounded-lg border bg-background p-3 text-sm">
          <Server size={16} className="text-primary" />
          <span>{number(report.vmCount)} ماشین مجازی</span>
          <small className="text-muted-foreground">
            {report.vmsTruncated ? "نمایش ۱۰۰ ماشین نخست" : "موجودی هاست"}
          </small>
        </div>
        <div className="grid gap-1 rounded-lg border bg-background p-3 text-sm">
          <Database size={16} className="text-primary" />
          <span>{number(report.datastoreCount)} ذخیره‌ساز</span>
          <small className="text-muted-foreground">فضا و دسترس‌پذیری</small>
        </div>
      </div>
      <InventoryTable
        title="ماشین‌های مجازی"
        unavailable={ssh}
        open
        headers={["نام", "وضعیت توان", "سیستم‌عامل", "vCPU", "حافظه MiB"]}
        rows={report.vms.map((item) => [
          item.name,
          item.powerState,
          item.guest,
          number(item.cpuCount),
          number(item.memoryMb),
        ])}
      />
      <InventoryTable
        title="ذخیره‌سازها"
        unavailable={unavailable("datastores")}
        open
        headers={["نام", "ظرفیت", "فضای آزاد", "قابل دسترس"]}
        rows={report.datastores.map((item) => [
          item.name,
          bytes(item.capacityBytes),
          bytes(item.freeBytes),
          bool(item.accessible),
        ])}
      />
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <InventoryTable
          title="رابط‌های فیزیکی"
          unavailable={unavailable("nics")}
          headers={["رابط", "لینک فعال", "سرعت Mb/s"]}
          rows={report.physicalNics.map((item) => [
            item.name,
            bool(item.linkUp),
            number(item.speedMb),
          ])}
        />
        <InventoryTable
          title="رابط‌های VMkernel"
          unavailable={unavailable("vmkernel")}
          headers={["رابط", "IP"]}
          rows={report.vmkernelNics.map((item) => [item.name, item.ip])}
        />
        <InventoryTable
          title="سوییچ‌های مجازی"
          unavailable={unavailable("switches")}
          headers={["نام", "پورت"]}
          rows={report.virtualSwitches.map((item) => [item.name, number(item.ports)])}
        />
        <InventoryTable
          title="Port Group"
          unavailable={unavailable("portgroups")}
          headers={["نام", "VLAN", "سوییچ"]}
          rows={report.portGroups.map((item) => [item.name, number(item.vlanId), item.vSwitch])}
        />
        <InventoryTable
          title="شبکه‌ها"
          headers={["نام"]}
          rows={report.networks.map((name) => [name])}
        />
        <InventoryTable
          title="سنسورها"
          unavailable={ssh}
          headers={["نام", "سلامت", "مقدار", "واحد"]}
          rows={report.sensors.map((item) => [
            item.name,
            item.state,
            number(item.reading),
            item.unit,
          ])}
        />
        <InventoryTable
          title="سرویس‌ها"
          unavailable={unavailable("services")}
          headers={["نام", "عنوان", "در حال اجرا", "سیاست", "الزامی"]}
          rows={report.services.map((item) => [
            item.key,
            item.label,
            bool(item.running),
            item.policy,
            bool(item.required),
          ])}
        />
        <InventoryTable
          title="قوانین فایروال هاست"
          unavailable={unavailable("firewall")}
          headers={["نام", "عنوان", "فعال", "الزامی"]}
          rows={report.firewallRulesets.map((item) => [
            item.key,
            item.label,
            bool(item.enabled),
            bool(item.required),
          ])}
        />
        <InventoryTable
          title="آداپتورهای ذخیره‌سازی"
          unavailable={unavailable("adapters")}
          headers={["نام", "مدل", "درایور", "وضعیت"]}
          rows={report.storageAdapters.map((item) => [
            item.name,
            item.model,
            item.driver,
            item.status,
          ])}
        />
        <InventoryTable
          title="دیسک‌های هاست"
          unavailable={ssh}
          headers={["نام", "عنوان", "نوع", "وضعیت"]}
          rows={report.storageDevices.map((item) => [
            item.name,
            item.displayName,
            item.deviceType,
            item.operationalState,
          ])}
        />
      </div>
      <dl className="grid gap-3 rounded-lg border bg-background p-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">DNS</dt>
          <dd className="mt-1 break-all">
            <bdi>
              {report.dns.hostName} {report.dns.domainName} · {report.dns.servers.join("، ") || "—"}
            </bdi>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">NTP</dt>
          <dd className="mt-1 break-all">
            <bdi>{report.time.ntpServers.join("، ") || "—"}</bdi> · {report.time.protocol || "—"}
          </dd>
        </div>
      </dl>
      {!!report.coverage?.some((item) => item.status === "unavailable") && (
        <p className="text-xs leading-6 text-muted-foreground">
          دادهٔ برخی بخش‌ها در پاسخ هاست موجود نبود. تنظیمات هاست و مجوزهای حساب اتصال را بررسی
          کنید.
        </p>
      )}
    </div>
  );
}

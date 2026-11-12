"use client";
import { useRef, useState } from "react";
import { Activity, LoaderCircle, RefreshCw, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useInspectNetworkApiMutation,
  type Device,
  type MikroTikInventory,
  type SophosInventory,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
import { AssignApiCredential } from "./api-connection-dialog";
import { InventoryTable } from "./inventory-table";
const timestamp = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });
const number = (value: number | null) =>
  value === null ? "نامشخص" : value.toLocaleString("fa-IR");
const fields: Record<string, string> = {
  name: "نام",
  version: "نسخه",
  "build-time": "زمان ساخت",
  disabled: "غیرفعال",
  running: "در حال اجرا",
  type: "نوع",
  "mac-address": "MAC",
  "actual-mtu": "MTU واقعی",
  mtu: "MTU",
  comment: "توضیح",
  address: "آدرس",
  network: "شبکه",
  interface: "رابط",
  "actual-interface": "رابط واقعی",
  dynamic: "پویا",
  "dst-address": "آدرس مقصد",
  gateway: "دروازه",
  "routing-table": "جدول مسیر",
  distance: "اولویت",
  active: "فعال",
  chain: "زنجیره",
  action: "عملیات",
  protocol: "پروتکل",
  "src-address": "آدرس مبدأ",
  "src-port": "پورت مبدأ",
  "dst-port": "پورت مقصد",
  "to-addresses": "آدرس ترجمه",
  "to-ports": "پورت ترجمه",
  list: "فهرست",
  timeout: "زمان انقضا",
  port: "پورت",
  certificate: "گواهی",
  vrf: "VRF",
  time: "زمان",
  topics: "موضوع",
  message: "پیام",
  "rx-byte": "بایت دریافتی",
  "tx-byte": "بایت ارسالی",
  status: "وضعیت",
  server: "سرور",
  "host-name": "نام میزبان",
  "expires-after": "انقضا",
  complete: "کامل",
  "on-interface": "رابط",
  bridge: "Bridge",
  vid: "VLAN",
  local: "محلی",
  ttl: "TTL",
  data: "داده",
};
const sectionLabels: Record<string, string> = {
  packages: "بسته‌ها",
  interfaces: "رابط‌ها",
  addresses: "آدرس‌های IP",
  routes: "مسیرها",
  filterRules: "قوانین فایروال",
  natRules: "قوانین NAT",
  mangleRules: "قوانین Mangle",
  addressLists: "فهرست‌های آدرس",
  services: "سرویس‌های مدیریتی",
  logs: "رویدادهای اخیر",
  counters: "شمارنده‌های ترافیک",
  arp: "همسایه‌های ARP",
  dhcpLeases: "اجاره‌های DHCP",
  bridgeHosts: "میزبان‌های Bridge",
  dnsCache: "حافظهٔ DNS",
};
export function NetworkApiConnection({ device }: { device: Device }) {
  const [settings, setSettings] = useState(false),
    lock = useRef(false);
  const [inspect, result] = useInspectNetworkApiMutation();
  const report = result.data;
  const title = device.type === "mikrotik" ? "MikroTik REST" : "Sophos XML";
  return (
    <section
      className="grid gap-4 rounded-xl border bg-card p-5"
      aria-labelledby="network-api-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="network-api-title" className="flex items-center gap-2 font-semibold">
          <Activity size={18} className="text-primary" />
          اتصال و موجودی {title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={result.isLoading}
            onClick={() => setSettings(true)}
          >
            <Settings2 size={15} />
            اعتبارنامهٔ API
          </Button>
          <Button
            size="sm"
            disabled={result.isLoading || !device.apiCredentialId}
            onClick={async () => {
              if (lock.current) return;
              lock.current = true;
              try {
                await inspect({
                  id: device.id,
                  kind: device.type === "mikrotik" ? "mikrotik" : "sophos",
                }).unwrap();
                toast.success("اتصال تأیید و موجودی دریافت شد.");
              } catch (error) {
                toast.error(apiErrorMessage(error));
              } finally {
                lock.current = false;
              }
            }}
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
      {!device.apiCredentialId && (
        <p className="text-sm text-muted-foreground">
          برای تست و دریافت موجودی، اعتبارنامهٔ API را انتخاب کنید.
        </p>
      )}
      <p className="text-xs leading-6 text-muted-foreground">
        {device.type === "mikrotik"
          ? "RouterOS 7 و سرویس www-ssl به همراه مجوزهای rest-api/read لازم است."
          : "API را در تنظیمات Sophos فعال کنید و IP سرور سامانه را در Allowed IP hosts مجاز قرار دهید. پورت پیش‌فرض HTTPS مدیریت ۴۴۴۴ است."}
      </p>
      {result.error && (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(result.error)}
        </p>
      )}
      {report && (
        <>
          <p className="text-xs text-muted-foreground">
            {report.collectedAt === device.verification?.checkedAt
              ? "زمان گردآوری"
              : "اطلاعات قبلی؛ اتصال فعلی به گردآوری دوباره نیاز دارد"}{" "}
            · {timestamp.format(new Date(report.collectedAt))}
          </p>
          {report.kind === "mikrotik" ? (
            <MikroTikReport report={report} />
          ) : (
            <SophosReport report={report} />
          )}
        </>
      )}
      {settings && <AssignApiCredential device={device} onClose={() => setSettings(false)} />}
    </section>
  );
}
export function MikroTikReport({ report }: { report: MikroTikInventory }) {
  const usedPercent = (free: number | null, total: number | null) =>
    free !== null && total !== null && total > 0
      ? Math.max(0, Math.min(100, (1 - free / total) * 100))
      : null;
  const resources = [
    { label: "CPU", value: report.cpuLoad },
    { label: "حافظه", value: usedPercent(report.memoryFree, report.memoryTotal) },
    { label: "فضای ذخیره", value: usedPercent(report.storageFree, report.storageTotal) },
  ];
  return (
    <div className="grid min-w-0 gap-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["نام", report.identity],
          ["RouterOS", report.routerosVersion],
          ["معماری", report.architecture],
          ["روشن‌بودن", report.uptime],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-all">
              <bdi>{value || "—"}</bdi>
            </dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-3 sm:grid-cols-3">
        {resources.map((item) => (
          <div className="grid gap-2 rounded-lg border bg-background p-3 text-sm" key={item.label}>
            <span>
              {item.label} ·{" "}
              {item.value === null
                ? "نامشخص"
                : `${item.value.toLocaleString("fa-IR", { maximumFractionDigits: 1 })}٪`}
            </span>
            {item.value !== null && (
              <meter
                className="h-2 w-full accent-primary"
                min={0}
                max={100}
                value={item.value}
                aria-label={`مصرف ${item.label}`}
              />
            )}
          </div>
        ))}
      </div>
      {!!report.warnings.length && (
        <div role="status" className="rounded-lg border p-3 text-xs text-muted-foreground">
          <p>دادهٔ این بخش‌ها دریافت نشد. نسخه، مجوز حساب و دسترس‌پذیری API را بررسی کنید.</p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {report.warnings.map((item) => (
              <li key={item.section}>
                {sectionLabels[item.section] ?? item.section} · <bdi>{item.code}</bdi>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid min-w-0 gap-3">
        {Object.entries(report.sections).map(([section, rows]) => {
          const columns = [...new Set(rows.flatMap(Object.keys))];
          return (
            <InventoryTable
              key={section}
              title={sectionLabels[section] ?? section}
              open={section === "interfaces"}
              headers={columns.map((key) => fields[key] ?? key)}
              rows={rows.map((row) =>
                columns.map((key) =>
                  row[key] === null || row[key] === undefined ? "—" : String(row[key]),
                ),
              )}
            />
          );
        })}
      </div>
      <InventoryTable
        title="شمارنده‌های معتبر ترافیک"
        headers={["رابط", "بایت دریافتی", "بایت ارسالی"]}
        rows={report.interfaceCounters.map((item) => [
          item.name,
          number(item.rxBytes),
          number(item.txBytes),
        ])}
      />
    </div>
  );
}
export function SophosReport({ report }: { report: SophosInventory }) {
  return (
    <div className="grid min-w-0 gap-3">
      <p className="text-sm">
        <bdi>
          {report.product} · API {report.apiVersion || "نامشخص"}
        </bdi>
      </p>
      {!!report.collectionWarnings?.length && (
        <div
          role="status"
          className="grid gap-2 rounded-lg border p-3 text-xs text-muted-foreground"
        >
          <p>برخی ماژول‌ها توسط نسخه یا مجوز این حساب ارائه نشده‌اند.</p>
          {report.collectionWarnings.map((warning) => (
            <bdi key={warning}>{warning}</bdi>
          ))}
        </div>
      )}
      <InventoryTable
        title="رابط‌ها"
        open
        headers={["نام", "سخت‌افزار", "Zone", "IP", "MAC", "ماسک", "سرعت", "لینک", "وضعیت مدیریتی"]}
        rows={report.interfaces.map((item) => [
          item.name,
          item.hardware,
          item.zone,
          item.ipAddresses.join("، "),
          item.macAddress,
          item.netmask,
          item.speed,
          item.operationalStatus,
          item.administrativeStatus,
        ])}
      />
      <InventoryTable
        title="قوانین فایروال"
        headers={["نام", "وضعیت", "عملیات", "Zone مبدأ", "Zone مقصد", "سرویس"]}
        rows={report.firewallRules.map((item) => [
          item.name,
          item.status,
          item.action,
          item.sourceZones.join("، "),
          item.destinationZones.join("، "),
          item.services.join("، "),
        ])}
      />
      <InventoryTable
        title="IP Host"
        headers={["نام", "آدرس", "نوع", "ماسک", "خانواده IP"]}
        rows={report.ipHosts.map((item) => [
          item.name,
          item.address,
          item.hostType,
          item.netmask,
          item.ipFamily,
        ])}
      />
      <InventoryTable
        title="سرویس‌ها"
        headers={["نام", "پروتکل", "پورت‌ها"]}
        rows={report.services.map((item) => [item.name, item.protocol, item.ports.join("، ")])}
      />
      <InventoryTable title="Zone" headers={["نام"]} rows={report.zones.map((item) => [item])} />
      <InventoryTable
        title="دروازه‌ها"
        headers={["نام"]}
        rows={report.gateways.map((item) => [item])}
      />
      <InventoryTable
        title="پیکربندی اتصال‌های VPN"
        headers={[
          "نام",
          "وضعیت تنظیم",
          "حالت زمان اجرا",
          "نوع",
          "پروفایل",
          "رابط WAN",
          "دروازهٔ راه دور",
          "شبکهٔ محلی",
          "شبکهٔ راه دور",
          "شناسهٔ محلی",
          "شناسهٔ راه دور",
          "شروع",
          "احراز هویت",
        ]}
        rows={report.vpnConnections.map((item) => [
          item.name,
          item.status,
          "نامشخص",
          item.connectionType,
          item.profile,
          item.wanInterface,
          item.remoteGateway,
          item.localSubnet,
          item.remoteNetworks?.join("، "),
          item.localId,
          item.remoteId,
          item.startupMode,
          item.authenticationType,
        ])}
      />
      <InventoryTable
        title="پروفایل‌های VPN"
        headers={[
          "نام",
          "روش کلید",
          "IKE",
          "رمزنگاری فاز ۱",
          "احراز هویت فاز ۱",
          "رمزنگاری فاز ۲",
          "احراز هویت فاز ۲",
          "DH",
        ]}
        rows={(report.vpnProfiles ?? []).map((item) => [
          item.name,
          item.keyingMethod,
          item.ikeVersion,
          item.phase1Encryption.join("، "),
          item.phase1Authentication.join("، "),
          item.phase2Encryption.join("، "),
          item.phase2Authentication.join("، "),
          item.dhGroups.join("، "),
        ])}
      />
    </div>
  );
}

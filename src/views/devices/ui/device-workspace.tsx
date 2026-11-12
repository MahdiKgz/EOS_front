"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DeviceIcon,
  deviceApiKind,
  deviceTypeLabels,
  environmentLabels,
  statusLabels,
  useDeviceQuery,
  useDeviceHistoryQuery,
  useDeviceInventoryEventsQuery,
} from "@/entities/device";
import {
  EsxiConnection,
  CiscoCapabilities,
  FortigateCapabilities,
  NetworkApiConnection,
  DeviceDetailsDialog,
  DeviceFormDialog,
  LinuxSshDialog,
  RecorderVerificationDialog,
} from "@/features/manage-device";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/api/error-message";

import { DeviceMonitoring } from "./device-monitoring";
import { DeviceConnectionChannels } from "./device-connection-channels";
import { DeviceBackups } from "./device-backups";
import { RecorderStatus } from "./recorder-status";

const timestamp = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });

export function DeviceWorkspace({ id, canWrite }: { id: string; canWrite: boolean }) {
  const [dialog, setDialog] = useState<"test" | "edit" | "ssh" | "onvif">();
  const { data: device, error, refetch } = useDeviceQuery(id);
  const events = useDeviceInventoryEventsQuery(id, { skip: !device });
  const history = useDeviceHistoryQuery(id, { skip: !device });

  return (
    <main className="grid min-w-0 gap-6 p-5 sm:p-8">
      <Link
        className="inline-flex w-fit items-center gap-[4px] justify-self-end text-sm text-primary hover:underline"
        href="/dashboard/assets/devices"
      >
        بازگشت
        <ArrowLeft size={16} aria-hidden="true" />
      </Link>
      {error ? (
        <div className="grid justify-items-start gap-3" role="alert">
          <p>{apiErrorMessage(error)}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            تلاش دوباره
          </Button>
        </div>
      ) : !device ? (
        <p role="status">در حال دریافت اطلاعات تجهیز…</p>
      ) : (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DeviceIcon vendor={device.vendor} type={device.type} />
              <h1 className="text-xl font-semibold">{device.name}</h1>
            </div>
            {canWrite && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setDialog("edit")}>
                  ویرایش تجهیز
                </Button>
                <Button onClick={() => setDialog("test")}>تست اتصال</Button>
                {device.protocol === "ssh" && (
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/assets/devices/${id}/terminal`}>ترمینال تجهیز</Link>
                  </Button>
                )}
                {["nvr", "dvr", "camera"].includes(device.type) && device.protocol === "api" && (
                  <Button variant="outline" onClick={() => setDialog("onvif")}>
                    {device.type === "camera" ? "تأیید اتصال دوربین" : "تأیید اتصال ضبط‌کننده"}
                  </Button>
                )}
                {["linux_edge", "mikrotik", "pfsense", "esxi", "fortigate", "cisco"].includes(
                  device.type,
                ) &&
                  device.protocol === "ssh" && (
                    <Button variant="outline" onClick={() => setDialog("ssh")}>
                      مدیریت SSH
                    </Button>
                  )}
              </div>
            )}
          </header>
          <section className="rounded-xl border bg-card p-5">
            <h2 className="mb-4 font-semibold">نمای کلی تجهیز</h2>
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                [
                  "سازنده و نوع",
                  <bdi key="vendor">
                    {device.vendor} · {deviceTypeLabels[device.type]}
                  </bdi>,
                ],
                ["آدرس مدیریت", <bdi key="host">{device.host}</bdi>],
                [
                  "پروتکل و پورت",
                  <bdi key="port">
                    {device.protocol.toUpperCase()} · {device.managementPort}
                  </bdi>,
                ],
                ["محل نصب", device.location || "—"],
                ["محیط", environmentLabels[device.environment]],
                [
                  "تأیید اتصال مدیریتی",
                  device.verification
                    ? timestamp.format(new Date(device.verification.checkedAt))
                    : "تأیید نشده",
                ],
                ...(device.verification?.identity?.FirmwareVersion
                  ? [["نسخهٔ شناسایی‌شده", device.verification.identity.FirmwareVersion]]
                  : []),
                ["وضعیت دسترسی", statusLabels[device.status]],
                [
                  "آخرین پاسخ موفق",
                  device.lastSeenAt ? timestamp.format(new Date(device.lastSeenAt)) : "—",
                ],
                ["برچسب‌ها", device.tags.join("، ") || "—"],
              ].map(([label, value], index) => (
                <div key={index}>
                  <dt className="mb-1 text-muted-foreground">{label}</dt>
                  <dd className="break-all">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          {canWrite && device.type === "esxi" && ["api", "ssh"].includes(device.protocol) && (
            <EsxiConnection
              key={`esxi-${device.id}-${device.protocol}`}
              device={device}
              onSshSettings={() => setDialog("ssh")}
            />
          )}
          {canWrite && ["mikrotik", "sophos"].includes(deviceApiKind(device) ?? "") && (
            <NetworkApiConnection
              key={`api-${device.id}-${deviceApiKind(device)}`}
              device={device}
            />
          )}
          {device.type === "cisco" && device.protocol === "ssh" && (
            <CiscoCapabilities id={device.id} companyId={device.companyId} canWrite={canWrite} />
          )}
          {device.type === "fortigate" && device.protocol === "ssh" && (
            <FortigateCapabilities
              id={device.id}
              companyId={device.companyId}
              canWrite={canWrite}
            />
          )}
          <DeviceConnectionChannels key={device.id} id={device.id} canWrite={canWrite} />
          {((device.type === "linux_edge" && device.protocol === "ssh") ||
            ["mikrotik", "cisco", "fortigate", "pfsense", "esxi", "generic_firewall"].includes(
              device.type,
            )) && (
            <DeviceMonitoring
              key={`monitor-${device.id}-${device.companyId}`}
              id={device.id}
              canWrite={canWrite}
            />
          )}
          <section className="rounded-xl border bg-card p-5" aria-labelledby="check-history">
            <h2 id="check-history" className="font-semibold">
              تاریخچه تست دسترسی
            </h2>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              ۵ تست اخیر پینگ از سرور سامانه
            </p>
            {history.error ? (
              <div role="alert" className="grid justify-items-start gap-3">
                <p>{apiErrorMessage(history.error)}</p>
                <Button variant="outline" onClick={() => void history.refetch()}>
                  تلاش دوباره
                </Button>
              </div>
            ) : history.isLoading ? (
              <p role="status">در حال دریافت تاریخچه…</p>
            ) : !history.data?.length ? (
              <p className="text-sm text-muted-foreground">هنوز نتیجه تستی ثبت نشده است.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap text-start text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      {["زمان تست", "آدرس تست‌شده", "نتیجه", "میانگین تأخیر"].map((label) => (
                        <th key={label} scope="col" className="p-3 text-start">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.map((check) => (
                      <tr key={check.id} className="border-b last:border-0">
                        <td className="p-3">{timestamp.format(new Date(check.checkedAt))}</td>
                        <td className="p-3">
                          <bdi>{check.host}</bdi>
                        </td>
                        <td className="p-3">
                          {check.status === "online" ? "پاسخ دریافت شد" : "بدون پاسخ"}
                        </td>
                        <td className="p-3">
                          {check.latencyMs === null
                            ? "—"
                            : `${check.latencyMs.toLocaleString("fa-IR")} میلی‌ثانیه`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {canWrite &&
            ["nvr", "dvr", "camera"].includes(device.type) &&
            device.protocol === "api" && <RecorderStatus key={device.id} id={device.id} />}
          {canWrite && <DeviceBackups key={device.id} id={device.id} protocol={device.protocol} />}
          <section className="grid gap-3 rounded-xl border bg-card p-5">
            <h2 className="font-semibold">تاریخچه تغییرات تجهیز</h2>
            {events.error ? (
              <div className="flex flex-wrap items-center gap-3" role="alert">
                <p>{apiErrorMessage(events.error)}</p>
                <Button variant="outline" onClick={() => void events.refetch()}>
                  تلاش دوباره
                </Button>
              </div>
            ) : events.isLoading ? (
              <p role="status">در حال دریافت تغییرات…</p>
            ) : events.data?.length ? (
              <ul className="grid gap-2 text-sm">
                {events.data.map((event) => (
                  <li key={event.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
                    <span>
                      {
                        {
                          archived: "بایگانی",
                          restored: "بازگردانی",
                          transferred: "تغییر شرکت مالک",
                        }[event.action]
                      }{" "}
                      · {event.actorName}
                    </span>
                    <time dateTime={event.occurredAt}>
                      {timestamp.format(new Date(event.occurredAt))}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">تغییری ثبت نشده است.</p>
            )}
          </section>
          {dialog === "test" && (
            <DeviceDetailsDialog
              device={device}
              canTest={canWrite}
              onClose={() => setDialog(undefined)}
            />
          )}
          {dialog === "ssh" && (
            <LinuxSshDialog
              device={device}
              onClose={() => setDialog(undefined)}
              onVerified={() => void refetch()}
            />
          )}
          {dialog === "onvif" && (
            <RecorderVerificationDialog
              device={device}
              onClose={() => setDialog(undefined)}
              onVerified={() => void refetch()}
            />
          )}
          {dialog === "edit" && (
            <DeviceFormDialog device={device} onClose={() => setDialog(undefined)} />
          )}
        </>
      )}
    </main>
  );
}

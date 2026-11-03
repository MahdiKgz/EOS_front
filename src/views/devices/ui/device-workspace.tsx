"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  DeviceIcon,
  deviceTypeLabels,
  environmentLabels,
  statusLabels,
  useDeviceQuery,
  useDeviceHistoryQuery,
} from "@/entities/device";
import { DeviceDetailsDialog, DeviceFormDialog, LinuxSshDialog } from "@/features/manage-device";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/api/error-message";

const timestamp = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });

export function DeviceWorkspace({ id, canWrite }: { id: string; canWrite: boolean }) {
  const [dialog, setDialog] = useState<"test" | "edit" | "ssh">();
  const { data: device, error, refetch } = useDeviceQuery(id);
  const history = useDeviceHistoryQuery(id, { skip: !device });

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-5 sm:p-8">
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
                {device.type === "linux_edge" && device.protocol === "ssh" && (
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
                ["محیط", environmentLabels[device.environment]],
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
          {dialog === "test" && (
            <DeviceDetailsDialog
              device={device}
              canTest={canWrite}
              onClose={() => setDialog(undefined)}
            />
          )}
          {dialog === "ssh" && (
            <LinuxSshDialog device={device} onClose={() => setDialog(undefined)} />
          )}
          {dialog === "edit" && (
            <DeviceFormDialog device={device} onClose={() => setDialog(undefined)} />
          )}
        </>
      )}
    </main>
  );
}

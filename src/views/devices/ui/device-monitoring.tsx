"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Activity, Clock3, LoaderCircle, RefreshCw, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCollectMonitoringMutation,
  useConfigureMonitoringMutation,
  useDeviceMonitoringQuery,
  type MonitoringRange,
  type MonitoringReport,
} from "@/entities/device";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { apiErrorMessage } from "@/shared/api/error-message";
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });
const num = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 2 });
const labels: Record<string, string> = {
  "cpu.usage_percent": "مصرف پردازنده",
  "memory.usage_percent": "مصرف حافظه",
  "disk.usage_percent": "مصرف دیسک",
  "datastore.usage_percent": "مصرف دیتاستور",
  "network.rx_mbps": "ترافیک دریافتی",
  "network.tx_mbps": "ترافیک ارسالی",
  "sensor.reading": "سنسور",
  "system.uptime_seconds": "مدت روشن بودن",
  "cpu.total_cores": "هسته‌های پردازنده",
  "memory.total_bytes": "حافظهٔ کل",
  "memory.used_bytes": "حافظهٔ مصرف‌شده",
  "disk.total_bytes": "ظرفیت دیسک",
  "disk.used_bytes": "دیسک مصرف‌شده",
  "datastore.total_bytes": "ظرفیت دیتاستور",
  "datastore.used_bytes": "دیتاستور مصرف‌شده",
  "vm.count": "ماشین‌های مجازی",
  "interfaces.count": "تعداد رابط‌ها",
  "interfaces.up_count": "رابط‌های روشن",
  "interfaces.down_count": "رابط‌های خاموش",
  "sessions.count": "نشست‌ها",
};
function display(value: number, unit: string) {
  if (unit === "bytes") return num(value / 1024 ** 3) + " GiB";
  if (unit === "seconds") return num(value / 3600) + " ساعت";
  return num(value) + (unit === "percent" ? "٪" : unit === "count" ? "" : " " + unit);
}
function Plot({
  series,
  range,
}: {
  series: MonitoringReport["series"][number];
  range: MonitoringRange;
}) {
  const points = series.points,
    max = series.unit === "percent" ? 100 : Math.max(1, ...points.map((p) => p.value)),
    min = series.unit === "percent" ? 0 : Math.min(0, ...points.map((p) => p.value)),
    duration = { "1h": 3600000, "24h": 86400000, "7d": 604800000, "30d": 2592000000 }[range];
  const end = Math.max(...points.map((p) => Date.parse(p.at))),
    start = end - duration;
  const coords = points.map((p) => ({
    x: 36 + ((Date.parse(p.at) - start) / duration) * 468,
    y: 132 - ((p.value - min) / (max - min)) * 112,
    point: p,
  }));
  const segments: string[][] = [];
  coords.forEach((p, i) => {
    const last = coords[i - 1];
    if (
      !last ||
      p.point.epoch !== last.point.epoch ||
      Date.parse(p.point.at) - Date.parse(last.point.at) > 7200000
    )
      segments.push([]);
    segments.at(-1)!.push(`${p.x},${p.y}`);
  });
  return (
    <figure className="min-w-0 rounded-xl border bg-background/40 p-4">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          {labels[series.key] ?? series.key}{" "}
          {series.label && <bdi className="text-muted-foreground">· {series.label}</bdi>}
        </span>
        <bdi className="font-semibold text-primary">
          {display(points.at(-1)!.value, series.unit)}
        </bdi>
      </figcaption>
      <svg
        viewBox="0 0 520 160"
        role="img"
        aria-label={`نمودار ${labels[series.key] ?? series.key} ${series.label}`}
        className="w-full"
        direction="ltr"
      >
        {[20, 76, 132].map((y, i) => (
          <g key={y}>
            <line x1="36" x2="504" y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 4" />
            <text x="30" y={y + 4} fill="var(--muted-foreground)" textAnchor="end" fontSize="10">
              {num(max - ((max - min) * i) / 2)}
            </text>
          </g>
        ))}
        {segments.map((segment, i) => (
          <polyline
            key={i}
            points={segment.join(" ")}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {coords.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={points.length === 1 ? 4 : 2} fill="var(--primary)">
            <title>
              {date.format(new Date(p.point.at))} · {display(p.point.value, series.unit)}
            </title>
          </circle>
        ))}
        <text x="36" y="155" fill="var(--muted-foreground)" fontSize="10">
          {date.format(new Date(start))}
        </text>
        <text x="504" y="155" fill="var(--muted-foreground)" textAnchor="end" fontSize="10">
          {date.format(new Date(end))}
        </text>
      </svg>
    </figure>
  );
}
export function DeviceMonitoring({ id, canWrite }: { id: string; canWrite: boolean }) {
  const [range, setRange] = useState<MonitoringRange>("24h"),
    [settings, setSettings] = useState(false),
    [expanded, setExpanded] = useState(false),
    [allResources, setAllResources] = useState(false);
  const report = useDeviceMonitoringQuery(
      { id, range },
      { pollingInterval: 15000, skipPollingIfUnfocused: true },
    ),
    [collect, result] = useCollectMonitoringMutation(),
    lock = useRef(false);
  const data = report.currentData,
    busy = result.isLoading || !!data?.config?.running;
  const series = (data?.series ?? []).filter(
    (s) => s.unit === "percent" || s.unit === "Mbps" || s.key === "sensor.reading",
  );
  const resources = (data?.latest?.measurements ?? []).filter(
    (m) => m.kind !== "counter" && m.key !== "sensor.reading",
  );
  return (
    <section
      className="grid min-w-0 gap-4 rounded-xl border bg-card p-4 sm:p-5"
      aria-labelledby="monitoring-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="monitoring-title" className="flex items-center gap-2 font-semibold">
            <Activity size={18} className="text-primary" />
            سلامت و نمودارهای تجهیز
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            داده‌های جمع‌آوری‌شده از اتصال مدیریتی یا کانال پایش تجهیز
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="دریافت دوبارهٔ گزارش پایش"
            disabled={report.isFetching}
            onClick={() => void report.refetch()}
          >
            <RefreshCw size={15} className={report.isFetching ? "animate-spin" : ""} />
          </Button>
          {canWrite && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy || report.isLoading || !!report.error}
                onClick={() => setSettings(true)}
              >
                <Settings2 size={15} />
                تنظیم پایش
              </Button>
              <Button
                size="sm"
                disabled={busy || report.isLoading || !!report.error}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  try {
                    const response = await collect({ id }).unwrap();
                    if (response.collected) toast.success("اطلاعات سلامت تجهیز به‌روزرسانی شد.");
                    else toast.error("گردآوری انجام نشد. اتصال و اعتبارنامهٔ تجهیز را بررسی کنید.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  } finally {
                    lock.current = false;
                  }
                }}
              >
                {busy ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Activity size={15} />
                )}{" "}
                {busy ? "در حال پایش…" : "پایش اکنون"}
              </Button>
            </>
          )}
        </div>
      </header>
      {report.error ? (
        <p role="alert" className="text-sm text-destructive">
          {apiErrorMessage(report.error)}
        </p>
      ) : !data ? (
        <p role="status" className="text-sm text-muted-foreground">
          در حال دریافت گزارش پایش…
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs">
            <span className="flex items-center gap-2">
              <Clock3 size={15} />
              {data.config?.enabled
                ? `پایش خودکار هر ${num(data.config.intervalSeconds / 60)} دقیقه`
                : "پایش خودکار غیرفعال است"}
            </span>
            <span className={data.stale ? "text-amber-400" : "text-primary"}>
              {data.latest
                ? `${data.stale ? "آخرین دادهٔ ذخیره‌شده" : "آخرین گردآوری"} · ${date.format(new Date(data.latest.collectedAt))}`
                : "هنوز داده‌ای جمع‌آوری نشده است"}
            </span>
          </div>
          {data.config?.lastErrorCode && (
            <p role="alert" className="text-sm text-destructive">
              {data.config.lastErrorCode === "MONITOR_CONFIGURATION_INVALID"
                ? "پایش متوقف شد؛ دسترسی، مقصد یا اعتبارنامه تغییر کرده است. تنظیمات را بررسی کنید."
                : "آخرین گردآوری ناموفق بود؛ اتصال، کلید میزبان، اعتبارنامه و مجوز خواندن اطلاعات را بررسی کنید."}
            </p>
          )}
          {data.latest && (
            <>
              <p className="text-xs text-muted-foreground">
                منبع: {data.latest.source.role === "management" ? "اتصال اصلی" : "کانال ثانویه"} ·{" "}
                <bdi>
                  {data.latest.source.method.toUpperCase()} · {data.latest.source.host}:
                  {data.latest.source.port}
                </bdi>
              </p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {(allResources ? resources : resources.slice(0, 12)).map((m) => (
                  <div key={m.key + m.label} className="rounded-lg border bg-background/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      {labels[m.key] ?? m.key} {m.label && <bdi>· {m.label}</bdi>}
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      <bdi>{display(m.value, m.unit)}</bdi>
                    </p>
                  </div>
                ))}
              </div>
              {resources.length > 12 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-self-start"
                  onClick={() => setAllResources(!allResources)}
                >
                  {allResources ? "نمایش کمتر" : `نمایش همهٔ ${num(resources.length)} شاخص`}
                </Button>
              )}
              {data.latest.warnings.some(
                (w) => w === "SSH_PARTIAL_METRICS" || w === "SNMP_BASIC_METRICS",
              ) && (
                <p className="text-xs text-muted-foreground">
                  این کانال بخشی از شاخص‌ها را ارائه می‌کند. شاخص دریافت‌نشده در نمودار نمایش داده
                  نمی‌شود.
                </p>
              )}
              {data.latest.warnings.includes("PREFERRED_SOURCE_UNAVAILABLE") && (
                <p className="text-xs text-amber-400">
                  اتصال دارای اولویت پاسخ نداد؛ داده‌ها از کانال جایگزین دریافت شدند.
                </p>
              )}
            </>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">روند تغییرات</h3>
            <div className="w-40">
              <Select
                label="بازهٔ نمودار"
                value={range}
                onValueChange={(value) => setRange(value as MonitoringRange)}
                options={[
                  { value: "1h", label: "یک ساعت اخیر" },
                  { value: "24h", label: "۲۴ ساعت اخیر" },
                  { value: "7d", label: "۷ روز اخیر" },
                  { value: "30d", label: "۳۰ روز اخیر" },
                ]}
              />
            </div>
          </div>
          {series.length ? (
            <>
              <div className="grid min-w-0 gap-3 lg:grid-cols-2">
                {(expanded ? series : series.slice(0, 8)).map((s) => (
                  <Plot key={s.key + s.label} series={s} range={range} />
                ))}
              </div>
              {series.length > 8 && (
                <Button variant="outline" onClick={() => setExpanded(!expanded)}>
                  {expanded ? "نمایش کمتر" : `نمایش همهٔ ${num(series.length)} نمودار`}
                </Button>
              )}
            </>
          ) : (
            <p className="rounded-lg border border-dashed p-5 text-sm leading-7 text-muted-foreground">
              {data.latest
                ? "در این بازه نمونه‌ای برای نمودار منابع وجود ندارد. برای محاسبهٔ ترافیک به حداقل دو نمونه نیاز است."
                : "برای دریافت شاخص‌ها، اعتبارنامهٔ تجهیز را تنظیم و پایش را اجرا کنید."}
            </p>
          )}
          <p className="text-xs leading-6 text-muted-foreground">
            نمونه‌ها در بازه‌های ۵ دقیقه‌ای و داده‌های قدیمی‌تر از یک روز در بازه‌های یک‌ساعته تجمیع
            می‌شوند و تا ۳۰ روز نگهداری می‌شوند. ترافیک از اختلاف شمارنده‌ها محاسبه می‌شود؛ با تغییر
            منبع یا راه‌اندازی مجدد تجهیز، محاسبه از نو شروع می‌شود.
          </p>
          <details className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm">
              تاریخچهٔ گردآوری ({num(data.history.length)})
            </summary>
            <div className="mt-3 max-h-72 overflow-auto">
              {!data.history.length ? (
                <p className="text-sm text-muted-foreground">هنوز گردآوری ثبت نشده است.</p>
              ) : (
                <table className="w-full whitespace-nowrap text-start text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      {["زمان", "نتیجه", "منبع", "تعداد شاخص"].map((label) => (
                        <th className="p-3 text-start" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.map((row) => (
                      <tr className="border-b last:border-0" key={row.id}>
                        <td className="p-3">{date.format(new Date(row.completedAt))}</td>
                        <td className="p-3">{row.status === "success" ? "موفق" : "ناموفق"}</td>
                        <td className="p-3">
                          <bdi>{row.source?.method.toUpperCase() ?? "—"}</bdi>
                        </td>
                        <td className="p-3">{num(row.measurementCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              حداکثر ۵۰ نتیجهٔ اخیر؛ سوابق پینگ جداگانه نگهداری می‌شوند.
            </p>
          </details>
        </>
      )}
      {settings && (
        <MonitoringSettings
          id={id}
          config={data?.config ?? null}
          onClose={() => setSettings(false)}
        />
      )}
    </section>
  );
}
function MonitoringSettings({
  id,
  config,
  onClose,
}: {
  id: string;
  config: MonitoringReport["config"];
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true),
    formId = useId(),
    lock = useRef(false),
    [save] = useConfigureMonitoringMutation();
  const form = useForm({
      defaultValues: {
        enabled: config?.enabled ?? false,
        intervalSeconds: String(config?.intervalSeconds ?? 300),
      },
    }),
    busy = form.formState.isSubmitting;
  return (
    <AnimatedDialog
      open={open}
      title="تنظیم پایش دوره‌ای"
      description="اطلاعات با فرمان‌های خواندنی از اتصال ذخیره‌شده جمع‌آوری می‌شود."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button form={formId} type="submit" disabled={busy}>
            {busy && <LoaderCircle size={15} className="animate-spin" />}ذخیره
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="grid gap-5"
        onSubmit={(event) => {
          void form.handleSubmit(async (body) => {
            if (lock.current) return;
            lock.current = true;
            try {
              await save({
                id,
                body: {
                  enabled: body.enabled,
                  intervalSeconds: Number(body.intervalSeconds),
                  revision: config?.revision,
                },
              }).unwrap();
              toast.success("تنظیمات پایش ذخیره شد.");
              setOpen(false);
            } catch (error) {
              form.setError("root", { message: apiErrorMessage(error) });
            } finally {
              lock.current = false;
            }
          })(event);
        }}
      >
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" disabled={busy} {...form.register("enabled")} />
          پایش دوره‌ای فعال باشد
        </label>
        <Controller
          name="intervalSeconds"
          control={form.control}
          render={({ field }) => (
            <div className="grid gap-2">
              <label className="text-sm">فاصلهٔ گردآوری</label>
              <Select
                label="فاصلهٔ گردآوری"
                value={field.value}
                onValueChange={field.onChange}
                disabled={busy}
                options={[
                  { value: "60", label: "هر یک دقیقه", icon: <Clock3 size={15} /> },
                  { value: "300", label: "هر پنج دقیقه", icon: <Clock3 size={15} /> },
                  { value: "900", label: "هر پانزده دقیقه", icon: <Clock3 size={15} /> },
                ]}
              />
            </div>
          )}
        />
        <p className="text-xs leading-7 text-muted-foreground">
          اولویت اتصال از بخش کانال‌های تجهیز تعیین می‌شود. با تغییر مقصد، شرکت یا اعتبارنامه، تنظیم
          پایش نیاز به بررسی دوباره دارد. بایگانی تجهیز پایش را متوقف می‌کند.
        </p>
        {form.formState.errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}
      </form>
    </AnimatedDialog>
  );
}

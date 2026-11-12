"use client";
import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Network,
  RefreshCw,
  Settings2,
  Terminal,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeviceChannelsQuery,
  channelMethods,
  useTestDeviceChannelMutation,
  useToggleDeviceChannelMutation,
} from "@/entities/device";
import {
  ApiInventoryReport,
  DeviceChannelDialog,
  SnmpCredentialDialog,
} from "@/features/manage-device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";
const date = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });
const time = (value: string | null) => (value ? date.format(new Date(value)) : "—");
const errorText: Record<string, string> = {
  SNMP_TIMEOUT: "پاسخ SNMP در زمان مقرر دریافت نشد؛ مسیر شبکه، UDP و تنظیمات کاربر را بررسی کنید.",
  SNMP_AUTH_OR_QUERY_FAILED:
    "احراز هویت یا خواندن SNMP انجام نشد؛ کاربر، الگوریتم و هر دو گذرواژه را بررسی کنید.",
  SNMP_INVALID_RESPONSE: "پاسخ SNMP معتبر یا شامل شناسه‌های لازم نبود.",
  API_CONNECTION_FAILED: "اتصال API تأیید نشد؛ آدرس، پورت، اعتبارنامه و گواهی HTTPS را بررسی کنید.",
  API_TLS_OR_NETWORK: "ارتباط HTTPS برقرار نشد؛ آدرس، پورت و گواهی مورد اعتماد را بررسی کنید.",
  ESXI_TLS_OR_NETWORK: "ارتباط HTTPS با ESXi برقرار نشد؛ آدرس، پورت و گواهی هاست را بررسی کنید.",
  API_AUTH_FAILED: "حساب API تأیید نشد؛ نام کاربری، گذرواژه و مجوز خواندن را بررسی کنید.",
  API_TLS_PIN_NOT_SUPPORTED:
    "برای این کانال، گواهی عمومی یا گواهی صادرشده از مرجع مورد اعتماد انتخاب کنید.",
  API_TIMEOUT: "پاسخ API در زمان مقرر دریافت نشد؛ مسیر شبکه و وضعیت تجهیز را بررسی کنید.",
  SSH_CONNECTION_FAILED:
    "اتصال SSH تأیید نشد؛ مسیر، پورت، اطلاعات ورود و کلید میزبان را بررسی کنید.",
};
export function DeviceConnectionChannels({ id, canWrite }: { id: string; canWrite: boolean }) {
  const query = useDeviceChannelsQuery(id);
  const [dialog, setDialog] = useState<"channel" | "credentials">();
  const [test, testing] = useTestDeviceChannelMutation(),
    [toggle, toggling] = useToggleDeviceChannelMutation();
  const busy = testing.isLoading || toggling.isLoading || query.isFetching;
  async function run(role: "primary" | "secondary") {
    try {
      const result = await test({ id, role }).unwrap();
      if (result.connected) toast.success("اتصال کانال تأیید شد.");
      else
        toast.error(
          errorText[result.errorCode ?? ""] ??
            "اتصال کانال تأیید نشد؛ مسیر، اعتبارنامه و مجوزها را بررسی کنید.",
        );
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }
  const data = query.currentData,
    secondary = data?.secondary;
  return (
    <section
      className="grid gap-4 rounded-xl border bg-card p-5"
      aria-labelledby="device-channels-title"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="device-channels-title" className="flex items-center gap-2 font-semibold">
          <Network size={18} className="text-primary" />
          کانال‌های اتصال
        </h2>
        <div className="flex gap-2">
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setDialog("credentials")}
            >
              <KeyRound size={15} />
              اعتبارنامه‌های SNMP
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            aria-label="دریافت دوباره کانال‌ها"
            disabled={busy}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={16} className={query.isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
      </header>
      {query.error ? (
        <p role="alert">{apiErrorMessage(query.error)}</p>
      ) : !data ? (
        <p role="status">در حال دریافت کانال‌ها…</p>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2">
            <article className="grid content-start gap-3 rounded-lg border bg-background p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Terminal size={17} />
                کانال مدیریتی · <bdi>{data.primary.method.toUpperCase()}</bdi>
              </h3>
              <p className="text-sm">
                <bdi>
                  {data.primary.host}:{data.primary.port}
                </bdi>
              </p>
              <p className="text-sm text-muted-foreground">
                {data.primary.status === "verified" ? "تأیید شده" : "تأیید نشده"} · اولویت{" "}
                {data.primary.priority.toLocaleString("fa-IR")}
              </p>
              <p className="text-xs text-muted-foreground">
                آخرین تأیید: {time(data.primary.lastSuccessAt)}
              </p>
              {canWrite && (
                <Button
                  className="w-fit"
                  variant="outline"
                  size="sm"
                  disabled={
                    busy || !data.primary.supported || data.primary.credentialsConfigured === false
                  }
                  onClick={() => void run("primary")}
                >
                  {testing.isLoading && testing.originalArgs?.role === "primary" && (
                    <LoaderCircle size={15} className="animate-spin" />
                  )}
                  تست با اتصال ذخیره‌شده
                </Button>
              )}
              {!data.primary.supported && (
                <p className="text-xs text-muted-foreground">
                  کانکتور این روش مدیریتی هنوز در نسخهٔ جدید منتقل نشده است.
                </p>
              )}
            </article>
            <article className="grid content-start gap-3 rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Activity size={17} />
                  کانال ثانویه{secondary ? ` · ${channelMethods[secondary.method].label}` : ""}
                </h3>
                {canWrite && !!data.availableMethods.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || !!secondary?.testing}
                    onClick={() => setDialog("channel")}
                  >
                    <Settings2 size={15} />
                    {secondary ? "تنظیمات" : "افزودن کانال"}
                  </Button>
                )}
              </div>
              {!secondary ? (
                <p className="text-sm text-muted-foreground">
                  {data.availableMethods.length
                    ? "کانال ثانویه هنوز تنظیم نشده است."
                    : "برای این نوع تجهیز کانال ثانویهٔ قابل اجرا تعریف نشده است."}
                </p>
              ) : (
                <>
                  <p className="text-sm">
                    <bdi>
                      {secondary.host ?? data.primary.host}:{secondary.port}
                    </bdi>
                  </p>
                  <p className="flex items-center gap-2 text-sm">
                    {secondary.status === "verified" && (
                      <CheckCircle2 size={16} className="text-primary" />
                    )}
                    {secondary.testing
                      ? "تست در حال اجراست…"
                      : secondary.status === "verified"
                        ? secondary.enabled
                          ? "تأیید شده و فعال"
                          : "تأیید شده و غیرفعال"
                        : secondary.status === "error"
                          ? "اتصال ناموفق"
                          : "نیازمند تست اتصال"}{" "}
                    · اولویت {secondary.priority.toLocaleString("fa-IR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    آخرین تست: {time(secondary.lastTestAt)} · آخرین موفقیت:{" "}
                    {time(secondary.lastSuccessAt)}
                  </p>
                  {secondary.needsCredential && (
                    <p className="text-sm text-destructive">
                      اعتبارنامهٔ این کانال در حساب شما موجود نیست؛ یک اعتبارنامه انتخاب کنید.
                    </p>
                  )}
                  {secondary.lastError && (
                    <p role="status" className="text-sm text-destructive">
                      {errorText[secondary.lastError] ?? "تست اتصال ناموفق بود."}
                    </p>
                  )}
                  {secondary.telemetry && (
                    <dl className="grid grid-cols-2 gap-3 rounded-md border p-3 text-xs">
                      <div>
                        <dt className="text-muted-foreground">نام سیستم</dt>
                        <dd className="mt-1 break-all">
                          <bdi>{secondary.telemetry.sysName || "—"}</bdi>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">زمان روشن‌بودن</dt>
                        <dd className="mt-1">
                          {Math.floor(secondary.telemetry.uptimeSeconds / 3600).toLocaleString(
                            "fa-IR",
                          )}{" "}
                          ساعت
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">تعداد رابط‌ها</dt>
                        <dd className="mt-1">
                          {secondary.telemetry.interfaceCount?.toLocaleString("fa-IR") ?? "—"}
                        </dd>
                      </div>
                    </dl>
                  )}
                  {canWrite && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={busy || secondary.needsCredential || secondary.testing}
                        onClick={() => void run("secondary")}
                      >
                        {testing.isLoading && testing.originalArgs?.role === "secondary" && (
                          <LoaderCircle size={15} className="animate-spin" />
                        )}
                        تست اتصال
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          busy ||
                          secondary.testing ||
                          secondary.needsCredential ||
                          secondary.status !== "verified"
                        }
                        onClick={async () => {
                          try {
                            await toggle({
                              id,
                              body: { enabled: !secondary.enabled, revision: secondary.revision },
                            }).unwrap();
                            toast.success(
                              secondary.enabled ? "کانال غیرفعال شد." : "کانال فعال شد.",
                            );
                          } catch (error) {
                            toast.error(apiErrorMessage(error));
                          }
                        }}
                      >
                        {secondary.enabled ? "غیرفعال‌کردن" : "فعال‌کردن"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </article>
          </div>
          {testing.data?.inventory &&
            secondary?.status === "verified" &&
            secondary.revision === testing.data.revision &&
            secondary.lastTestAt === testing.data.checkedAt && (
              <div className="grid min-w-0 gap-4 rounded-lg border p-4">
                <h3 className="text-sm font-semibold">موجودی دریافت‌شده از کانال ثانویه</h3>
                <ApiInventoryReport inventory={testing.data.inventory} />
              </div>
            )}
          <p className="text-xs leading-6 text-muted-foreground">
            {data.preferred
              ? `اولویت انتخاب برای گردآوری خواندنی: ${data.preferred === "management" ? "کانال مدیریتی" : "کانال ثانویه"}.`
              : "هنوز کانال تأییدشده‌ای برای گردآوری انتخاب نشده است."}{" "}
            تأیید کانال مستقل از نتیجهٔ پینگ است. تغییر مقصد، شرکت یا اعتبارنامه به تست دوباره نیاز
            دارد.
          </p>
          {!!data.history.length && (
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-start text-xs">
                <caption className="pb-3 text-start text-muted-foreground">
                  ۵ تست اخیر کانال ثانویه
                </caption>
                <thead>
                  <tr className="border-b">
                    {["زمان", "روش", "نتیجه"].map((label) => (
                      <th key={label} className="p-2 text-start">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="p-2">{time(item.checkedAt)}</td>
                      <td className="p-2">
                        <bdi>{item.method.toUpperCase()}</bdi>
                      </td>
                      <td className="p-2">{item.connected ? "تأیید شد" : "ناموفق"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {dialog === "channel" && data.availableMethods.length > 0 && (
            <DeviceChannelDialog
              id={id}
              data={data}
              host={data.primary.host}
              onClose={() => setDialog(undefined)}
            />
          )}
        </>
      )}
      {dialog === "credentials" && <SnmpCredentialDialog onClose={() => setDialog(undefined)} />}
    </section>
  );
}

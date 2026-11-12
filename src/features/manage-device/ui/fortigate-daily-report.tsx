import type { FortiDailyCheck, FortiLogs } from "@/entities/device";
const statusLabels: Record<string, string> = {
  safe: "بدون یافتهٔ مهم",
  needs_review: "نیازمند بررسی",
  critical: "بحرانی",
  not_checked: "شواهد ناکافی",
  not_supported: "پشتیبانی‌نشده",
  collected: "دریافت‌شده",
  partial: "بخشی از داده‌ها",
  command_failed: "ناموفق",
  requires_privilege: "نیازمند مجوز",
  not_collected: "دریافت‌نشده",
};
const coverageLabels: Record<string, string> = {
  complete: "شواهد کامل",
  partial: "شواهد ناقص",
  unavailable: "بدون شواهد کافی",
};
const severity: Record<string, string> = {
  info: "اطلاعات",
  low: "کم",
  medium: "متوسط",
  high: "زیاد",
  critical: "بحرانی",
};
export function FortigateDailyReport({
  report,
  logs,
}: {
  report?: FortiDailyCheck;
  logs?: FortiLogs;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <section
        className="grid min-w-0 gap-3 rounded-lg border bg-background p-3"
        aria-label="گزارش بررسی FortiGate"
      >
        <header className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">بررسی روزانهٔ FortiGate</h3>
          {report && (
            <span
              className={
                report.status === "critical"
                  ? "text-destructive text-xs"
                  : "text-muted-foreground text-xs"
              }
            >
              {statusLabels[report.status] ?? report.status} · {coverageLabels[report.coverage]}
            </span>
          )}
        </header>
        <p className="text-xs leading-6 text-muted-foreground">
          {report?.summary ?? "برای تولید گزارش از موجودی، کشف و تازه‌سازی را اجرا کنید."}
        </p>
        {report && (
          <div className="grid min-w-0 gap-2 xl:grid-cols-2">
            {report.sections.map((section) => (
              <details className="min-w-0 rounded-lg border p-3" key={section.key}>
                <summary className="cursor-pointer text-xs font-medium">
                  {section.title} · {statusLabels[section.status] ?? section.status}
                </summary>
                <div className="mt-3 grid gap-3 text-xs leading-6">
                  <p className="text-muted-foreground">
                    {section.summary} · {coverageLabels[section.coverage]}
                  </p>
                  <dl className="grid gap-2">
                    {section.evidence.map((entry, index) => (
                      <div key={index}>
                        <dt className="text-muted-foreground">{entry.label}</dt>
                        <dd className="break-words">
                          <bdi>{entry.value}</bdi>
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {section.findings.map((finding, index) => (
                    <article key={index} className="grid gap-1 rounded-md border p-3">
                      <p className="font-medium">
                        {finding.title} · {severity[finding.severity] ?? finding.severity}
                      </p>
                      <p className="break-words text-muted-foreground">
                        <bdi>{finding.evidence}</bdi>
                      </p>
                      <p>{finding.recommendedAction}</p>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
      <details className="min-w-0 rounded-lg border bg-background p-3">
        <summary className="cursor-pointer text-sm font-medium">
          رویدادهای اخیر FortiGate ·{" "}
          {logs ? (statusLabels[logs.state] ?? logs.state) : "دریافت‌نشده"}
        </summary>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          حداکثر ۵۰۰ رخداد از آخرین گردآوری در ترتیب دستگاه؛ ساعت و منطقهٔ زمانی مطابق خروجی تجهیز
          است. دریافت دوباره از «کشف و تازه‌سازی» انجام می‌شود.
        </p>
        {logs?.entries.length ? (
          <div className="mt-3 max-h-96 overflow-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  {["زمان تجهیز", "سطح", "نوع / زیرنوع", "VDOM", "کاربر", "مبدا", "پیام"].map(
                    (label) => (
                      <th key={label} scope="col" className="whitespace-nowrap p-2 text-start">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {logs.entries.map((entry, index) => (
                  <tr key={index} className="border-b align-top last:border-0">
                    <td className="whitespace-nowrap p-2">
                      <bdi>
                        {[entry.date, entry.time, entry.timezone].filter(Boolean).join(" ") ||
                          entry.eventTime ||
                          "—"}
                      </bdi>
                    </td>
                    <td className="p-2">
                      <bdi>{entry.level ?? "—"}</bdi>
                    </td>
                    <td className="p-2">
                      <bdi>{[entry.type, entry.subtype].filter(Boolean).join(" / ") || "—"}</bdi>
                    </td>
                    <td className="p-2">
                      <bdi>{entry.vdom ?? "—"}</bdi>
                    </td>
                    <td className="p-2">
                      <bdi>{entry.user ?? "—"}</bdi>
                    </td>
                    <td className="p-2">
                      <bdi>{entry.sourceIp ?? "—"}</bdi>
                    </td>
                    <td className="min-w-56 max-w-lg break-words p-2">
                      <bdi>{entry.message ?? entry.description ?? entry.raw}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {logs?.reportedTotal === 0 && logs.state === "collected"
              ? "در پاسخ دستگاه، رخدادی برای این بازه گزارش نشد."
              : "رویداد قابل تفسیر دریافت نشده است؛ وضعیت فرمان و خروجی تکمیلی را بررسی کنید."}
          </p>
        )}
        {!!logs?.rawLines.length && (
          <details className="mt-3 rounded-md border p-3">
            <summary className="cursor-pointer text-xs">خروجی تکمیلی رخدادها</summary>
            <pre
              className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs leading-6"
              dir="ltr"
            >
              {logs.rawLines.join("\n")}
            </pre>
          </details>
        )}
      </details>
    </div>
  );
}

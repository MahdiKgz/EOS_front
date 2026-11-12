import { deviceTypeLabels, type AssetsFilter, type AssetsOverview } from "@/entities/device";
import styles from "./assets-overview-charts.module.css";
const number = (value: number) => value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
const states = [
  { key: "online", label: "آنلاین", color: "var(--success)" },
  { key: "offline", label: "آفلاین", color: "var(--destructive)" },
  { key: "error", label: "خطا", color: "var(--warning)" },
  { key: "unknown", label: "بررسی‌نشده", color: "var(--text-faint)" },
] as const;
export function AssetsOverviewCharts({
  data,
  loading,
  hasError,
  onFilter,
}: {
  data?: AssetsOverview;
  loading: boolean;
  hasError: boolean;
  onFilter: (filter: AssetsFilter) => void;
}) {
  const total = data?.stats.total ?? 0;
  const unavailable = hasError || (!!data && !data.analytics);
  const others = total - (data?.analytics?.vendors.reduce((sum, row) => sum + row.count, 0) ?? 0);
  const vendors = [
    ...(data?.analytics?.vendors ?? []).map((row) => ({
      ...row,
      key: `vendor:${row.key}`,
      label: row.key,
    })),
    ...(others > 0 ? [{ key: "aggregate:others", label: "سایر سازنده‌ها", count: others }] : []),
  ];
  return (
    <section aria-label="نمودارهای موجودی دارایی‌ها" className={styles.charts} aria-busy={loading}>
      <figure className={styles.panel}>
        <figcaption>
          <h2>وضعیت دسترسی</h2>
          <span>آخرین وضعیت ثبت‌شده</span>
        </figcaption>
        {loading || unavailable || !total ? (
          <ChartMessage loading={loading} error={unavailable} />
        ) : (
          <div className={styles.health}>
            <div className={styles.donut}>
              <svg
                viewBox="0 0 120 120"
                role="img"
                aria-label={`وضعیت دسترسی ${number(total)} دارایی`}
              >
                <title>
                  {states
                    .map((state) => `${state.label}: ${number(data!.analytics.status[state.key])}`)
                    .join("، ")}
                </title>
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="10"
                />
                {states.map((state, index) => {
                  const count = data!.analytics.status[state.key];
                  const start =
                    states
                      .slice(0, index)
                      .reduce((sum, previous) => sum + data!.analytics.status[previous.key], 0) /
                    total;
                  const fraction = count / total;
                  return count > 0 ? (
                    <circle
                      key={state.key}
                      cx="60"
                      cy="60"
                      r="46"
                      pathLength="100"
                      fill="none"
                      stroke={state.color}
                      strokeWidth="10"
                      strokeDasharray={`${fraction * 100} ${100 - fraction * 100}`}
                      strokeDashoffset={-start * 100}
                      transform="rotate(-90 60 60)"
                    />
                  ) : null;
                })}
              </svg>
              <div aria-hidden="true">
                <strong>{number((data!.analytics.status.online / total) * 100)}٪</strong>
                <span>آنلاین</span>
              </div>
            </div>
            <ul className={styles.legend}>
              {states.map((state) => (
                <li key={state.key}>
                  <span>
                    <i style={{ background: state.color }} />
                    {state.label}
                  </span>
                  <b>{number(data!.analytics.status[state.key])}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!!total && !loading && !unavailable && (
          <button type="button" className={styles.action} onClick={() => onFilter("attention")}>
            مشاهدهٔ دارایی‌های نیازمند بررسی
          </button>
        )}
      </figure>
      <Distribution
        title="ترکیب دارایی‌ها"
        subtitle="تعداد به تفکیک نوع تجهیز"
        rows={(data?.analytics?.types ?? []).map((row) => ({
          key: row.key,
          label: deviceTypeLabels[row.key],
          count: row.count,
        }))}
        total={total}
        loading={loading}
        error={unavailable}
        color="var(--primary)"
      />
      <Distribution
        title="سازنده‌ها"
        subtitle="پنج سازندهٔ پرتعداد و سایر موارد"
        rows={vendors}
        total={total}
        loading={loading}
        error={unavailable}
        color="var(--accent)"
      />
    </section>
  );
}
function ChartMessage({ loading, error }: { loading: boolean; error: boolean }) {
  return (
    <p className={styles.empty}>
      {loading
        ? "در حال دریافت نمودار…"
        : error
          ? "دادهٔ نمودار در دسترس نیست."
          : "هنوز دارایی فعالی در این محدوده وجود ندارد."}
    </p>
  );
}
function Distribution({
  title,
  subtitle,
  rows,
  total,
  loading,
  error,
  color,
}: {
  title: string;
  subtitle: string;
  rows: { key: string; label: string; count: number }[];
  total: number;
  loading: boolean;
  error: boolean;
  color: string;
}) {
  return (
    <figure className={styles.panel}>
      <figcaption>
        <h2>{title}</h2>
        <span>{subtitle}</span>
      </figcaption>
      {loading || error || !total ? (
        <ChartMessage loading={loading} error={error} />
      ) : (
        <ul className={styles.bars}>
          {rows.map((row) => (
            <li key={row.key}>
              <div>
                <bdi>{row.label}</bdi>
                <span>
                  {number(row.count)} <small>· {number((row.count / total) * 100)}٪</small>
                </span>
              </div>
              <div className={styles.track} aria-hidden="true">
                <span style={{ width: `${(row.count / total) * 100}%`, background: color }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

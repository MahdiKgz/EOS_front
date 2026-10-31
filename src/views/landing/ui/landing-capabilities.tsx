import { capabilities } from "../model/content";
import { cx } from "./classes";

export function LandingCapabilities() {
  return (
    <section id="capabilities" className={cx("landing-capabilities landing-section")}>
          <div className={cx("capabilities-heading")}>
            <div><span>قابلیت‌های سامانه</span><h2>ابزارهای مدیریت شبکه و امنیت</h2></div>
            <p>تجهیزات را پایش کنید، هشدارها را بررسی کنید و اقدام‌های موردنیاز را با تأیید اپراتور انجام دهید.</p>
          </div>
          <div className={cx("capability-grid")}>
            {capabilities.map(({ icon: Icon, title, text }, index) => (
              <article key={title}>
                <span><Icon /></span><h3>{title}</h3><p>{text}</p><i>{String(index + 1).padStart(2, "0")}</i>
              </article>
            ))}
          </div>
        </section>
  );
}

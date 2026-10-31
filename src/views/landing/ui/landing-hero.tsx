import Link from "next/link";
import { Bot, ChevronLeft, CircleCheck, ShieldCheck } from "lucide-react";
import productOverview from "@/shared/assets/landing/product-overview.png";
import { ScreenshotFrame } from "./screenshot-frame";
import { cx } from "./classes";

export function LandingHero() {
  return (
    <section id="top" aria-labelledby="landing-title" className={cx("landing-hero landing-hero--refresh")}>
          <div className={cx("landing-hero__copy")}>
            <span className={cx("landing-kicker")}><i /> سامانه مدیریت شبکه و امنیت</span>
            <h1 id="landing-title">امنیت را فقط نبینید؛<br /><em>برای آن اقدام کنید.</em></h1>
            <p>وضعیت تجهیزات، لاگ‌ها و هشدارهای شبکه را در یک محیط بررسی کنید. با فرمان‌های فارسی و دستیار هوشمند، اقدام موردنیاز را انتخاب کنید و پس از بررسی و تأیید، نتیجه اجرای آن را ببینید.</p>
            <div className={cx("landing-hero__actions")}>
              <Link href="/login" prefetch={false}>ورود به سامانه <ChevronLeft /></Link>
              <span><ShieldCheck /> اجرای دستورها پس از بررسی و تأیید شما</span>
            </div>
            <dl className={cx("hero-trust")} aria-label="سامانه در یک نگاه">
              <div><dt>گروه تجهیزات</dt><dd>۶</dd></div>
              <div><dt>مرحله کنترل و اجرا</dt><dd>۴</dd></div>
              <div><dt>مرکز فرمان فارسی</dt><dd>۱</dd></div>
            </dl>
          </div>

          <div className={cx("landing-hero__visual showcase-stage showcase-stage--hero")}>
            <div className={cx("showcase-orbit")}  aria-hidden="true" />
            <ScreenshotFrame image={productOverview} alt="نمای کلی محیط واقعی Firewall SOAR" hero />
            <div className={cx("hero-float hero-float--one")}><Bot /><span><strong>فرمان آماده بررسی</strong><small>بررسی جزئیات پیش از اجرا</small></span></div>
            <div className={cx("hero-float hero-float--two")}><CircleCheck /><span><strong>فرمان اجرا شد</strong><small>نتیجه در سوابق ثبت شد</small></span></div>
          </div>

          <div className={cx("landing-proof")}>
            <span>Linux</span><span>MikroTik</span><span>Cisco</span><span>FortiGate</span><span>pfSense</span><span>Sophos</span>
          </div>
        </section>
  );
}

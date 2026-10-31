import { ChevronLeft } from "lucide-react";
import { BrandMark } from "./brand-mark";
import { cx } from "./classes";

export function LandingFooter() {
  return (
    <footer className={cx("landing-footer")}>
        <div className={cx("landing-brand")}><BrandMark /><span><strong>Firewall SOAR</strong><small>مرکز فرمان شبکه و امنیت</small></span></div>
        <p>پایش شبکه، بررسی هشدارها و مدیریت فرمان‌ها به زبان فارسی.</p>
        <a href="#top">بازگشت به بالا <ChevronLeft /></a>
      </footer>
  );
}

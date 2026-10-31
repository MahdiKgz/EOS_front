import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { cx } from "./classes";

export function LandingHeader() {
  return (
    <header className={cx("landing-header")}>
      <a className={cx("landing-brand")} href="#top" aria-label="Firewall SOAR">
        <BrandMark />
        <span>
          <strong dir="ltr">Firewall SOAR</strong>
          <small>مرکز فرمان امنیت</small>
        </span>
      </a>
      <nav aria-label="ناوبری لندینگ">
        <a href="#product">معرفی</a>
        <a href="#capabilities">قابلیت‌ها</a>
        <a href="#workflow">چرخه اقدام</a>
        <a href="#team">تیم</a>
      </nav>
      <Link className={cx("landing-header__anchor")} href="/dashboard" prefetch={false}>
        ورود / ثبت نام
      </Link>
    </header>
  );
}

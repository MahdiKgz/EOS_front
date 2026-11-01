import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import background from "@/shared/assets/landing/product-overview.png";
import { iranYekan } from "@/shared/config/fonts";
import { AuthShowcase } from "./auth-showcase";
import styles from "./auth-shell.module.css";

export function AuthShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${styles.shell} ${iranYekan.variable}`}>
      <section className={styles.panel} aria-label="حساب کاربری">
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="EOSNet، صفحه اصلی">
            <span className={styles.brandMark}>
              <ShieldCheck aria-hidden="true" />
            </span>
            <span>
              <strong dir="ltr">EOSNet</strong>
              <small>مدیریت شبکه و امنیت</small>
            </span>
          </Link>
          <Link href="/" className={styles.homeLink} aria-label="بازگشت به صفحه اصلی">
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </header>
        <main className={styles.formContent}>{children}</main>
        <footer className={styles.footer}>پایش شبکه و مدیریت فرمان‌ها در یک محیط</footer>
      </section>
      <aside className={styles.showcase} aria-label="آشنایی با سامانه">
        <Image
          src={background}
          alt=""
          fill
          sizes="(min-width: 1280px) 70vw, 1px"
          className={styles.background}
        />
        <div className={styles.overlay} />
        <div className={styles.showcaseTop}>
          <span className={styles.productLabel}>
            <span /> سامانه مدیریت شبکه و امنیت
          </span>
          <span dir="ltr" className={styles.wordmark}>
            EOSNET
          </span>
        </div>
        <AuthShowcase />
        <div className={styles.showcaseBottom}>
          <span>اطلاعات شبکه، تصمیم‌های روشن‌تر</span>
          <span dir="ltr">EOSNet / Network Operations</span>
        </div>
      </aside>
    </div>
  );
}

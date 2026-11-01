"use client";

import { useMeQuery } from "@/entities/user";
import Link from "next/link";
import { BrandMark } from "./brand-mark";
import { cx } from "./classes";

export function LandingHeader() {
  const { data, error, isLoading, refetch } = useMeQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const user = error ? undefined : data?.user;
  const unavailable = error && !("status" in error && error.status === 401);
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
      {isLoading ? (
        <span className={cx("landing-header__anchor")} role="status">
          در حال بررسی…
        </span>
      ) : unavailable ? (
        <button
          type="button"
          className={cx("landing-header__anchor")}
          onClick={() => void refetch()}
        >
          تلاش دوباره
        </button>
      ) : (
        <Link
          className={cx("landing-header__anchor")}
          href={user ? "/dashboard" : "/login"}
          prefetch={false}
        >
          <span className={cx("header-account-label")}>
            {user ? `${user.displayName} / داشبورد` : "ورود / ثبت نام"}
          </span>
        </Link>
      )}
    </header>
  );
}

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Building2, ChevronDown, Menu, type LucideIcon } from "lucide-react";
import { type User, userRoleLabels } from "@/entities/user";
import { LogoutButton } from "@/features/auth-session";
import styles from "./dashboard-shell.module.css";

type Props = {
  user: User;
  title: string;
  icon: LucideIcon;
  accent: string;
  mobileOpen: boolean;
  onOpenMenu: () => void;
  panelLabel: string;
  onChangePanel?: () => void;
};

export function DashboardHeader({
  user,
  title,
  icon: Icon,
  accent,
  mobileOpen,
  onOpenMenu,
  panelLabel,
  onChangePanel,
}: Props) {
  const account = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function dismiss(event: PointerEvent) {
      if (
        account.current &&
        event.target instanceof Node &&
        !account.current.contains(event.target)
      )
        account.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && account.current?.open) {
        account.current.open = false;
        account.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <header className={styles.topbar}>
      <div className={styles.pageContext}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileToggle}`}
          onClick={onOpenMenu}
          aria-label="باز کردن منوی داشبورد"
          aria-expanded={mobileOpen}
          aria-controls="dashboard-mobile-menu"
        >
          <Menu aria-hidden="true" />
        </button>
        <span className={styles.contextIcon} style={{ color: `var(--sidebar-${accent})` }}>
          <Icon aria-hidden="true" />
        </span>
        <div className={styles.contextText}>
          <span>فضای کاری</span>
          <strong>{title}</strong>
        </div>
        <span className={styles.contextDot} aria-hidden="true" />
      </div>
      <div className={styles.headerControls}>
        {onChangePanel ? (
          <button
            type="button"
            className={`${styles.workspaceChip} ${styles.panelSwitcher}`}
            onClick={onChangePanel}
            aria-haspopup="dialog"
            title="تغییر بخش"
          >
            <Building2 aria-hidden="true" />
            <span>{panelLabel}</span>
            <ChevronDown aria-hidden="true" />
          </button>
        ) : (
          <div className={styles.workspaceChip}>
            <Building2 aria-hidden="true" />
            <span>فضای کاری شرکت</span>
          </div>
        )}
        <details className={styles.accountMenu} ref={account}>
          <summary className={styles.accountTrigger} aria-label={`حساب کاربری ${user.displayName}`}>
            <span className={styles.headerAvatar} aria-hidden="true">
              {Array.from(user.displayName.trim())[0]}
            </span>
            <span className={styles.accountName}>{user.displayName}</span>
            <ChevronDown className={styles.accountChevron} aria-hidden="true" />
          </summary>
          <div className={styles.accountPopover}>
            <div className={styles.accountIdentity}>
              <strong>{user.displayName}</strong>
              <span>{userRoleLabels[user.role]}</span>
            </div>
            <Link href="/">صفحه اصلی</Link>
            <div className={styles.accountExit}>
              <span>خروج از حساب</span>
              <LogoutButton />
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

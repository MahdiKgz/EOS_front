"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Menu, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { type User, userRoleLabels } from "@/entities/user";
import { LogoutButton } from "@/features/auth-session";
import { dashboardNavigation } from "../model/navigation";
import styles from "./dashboard-shell.module.css";

type SidebarProps = { user: User; collapsed?: boolean; onToggle: () => void; mobile?: boolean; activeItem: string; onSelect: (id: string) => void };
function Sidebar({ user, collapsed = false, onToggle, mobile = false, activeItem, onSelect }: SidebarProps) {
  const layoutGroupId = useId();
  const reduceMotion = useReducedMotion();
  const indicator = <motion.span layoutId="active-sidebar-item" className={styles.activeIndicator} aria-hidden="true" initial={false} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 40, mass: .8 }} />;
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  function toggleGroup(id: string) {
    onSelect(id);
    if (collapsed) { onToggle(); return; }
    setClosedGroups(groups => groups.includes(id) ? groups.filter(group => group !== id) : [...groups, id]);
  }
  return <div className={styles.sidebarInner}>
    <header className={styles.sidebarHeader}>
      <Link href="/dashboard" className={styles.brand} aria-label="EOSNet، داشبورد">
        <span className={styles.brandMark} aria-hidden="true">E</span>
        {!collapsed && <span><strong dir="ltr">EOSNET</strong><small>مرکز فرمان امنیت</small></span>}
      </Link>
      <button type="button" className={styles.iconButton} onClick={onToggle} aria-label={mobile ? "بستن منو" : collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"} aria-expanded={!collapsed}>
        {mobile ? <X aria-hidden="true" /> : collapsed ? <PanelRightOpen aria-hidden="true" /> : <PanelRightClose aria-hidden="true" />}
      </button>
    </header>
    <LayoutGroup id={layoutGroupId}><motion.nav layoutScroll className={styles.navigation} aria-label="منوی داشبورد">
      <Link href="/dashboard" className={`${styles.activeLink} ${styles.navItem} ${activeItem === "dashboard" ? styles.selected : ""}`} aria-current="page" title={collapsed ? "داشبورد" : undefined} onClick={() => { onSelect("dashboard"); if (mobile) onToggle(); }}>
        {activeItem === "dashboard" && indicator}
        <span className={styles.menuMark} aria-hidden="true" />{!collapsed && <span>داشبورد</span>}
      </Link>
      {dashboardNavigation.map(group => {
        const open = !collapsed && !closedGroups.includes(group.id);
        const id = `${mobile ? "mobile" : "desktop"}-${group.id}`;
        return <section className={styles.group} key={group.id}>
          <button type="button" className={`${styles.groupButton} ${styles.navItem} ${activeItem === group.id ? styles.selected : ""}`} onClick={() => toggleGroup(group.id)} aria-pressed={activeItem === group.id} aria-expanded={open} aria-controls={id} title={collapsed ? group.title : undefined}>
            {activeItem === group.id && indicator}
            <span className={styles.menuMark} aria-hidden="true" />{!collapsed && <><span className={styles.itemLabel}>{group.title}</span><ChevronDown className={open ? styles.chevronOpen : styles.chevronClosed} aria-hidden="true" /></>}
          </button>
          <ul id={id} className={styles.submenu} hidden={!open}>{group.items.map(item => <li key={item}><button type="button" disabled title="این بخش هنوز در دسترس نیست">{item}</button></li>)}</ul>
        </section>;
      })}
      {["گزارش‌گیری", "آزمایشگاه شبکه"].map(title => <button className={styles.pendingItem} type="button" disabled key={title} title={collapsed ? title : "این بخش هنوز در دسترس نیست"}><span className={styles.menuMark} aria-hidden="true" />{!collapsed && <span>{title}</span>}</button>)}
    </motion.nav></LayoutGroup>
    <footer className={styles.sidebarFooter}>
      <div className={styles.userCard} title={collapsed ? `${user.displayName} / ${userRoleLabels[user.role]}` : undefined}>
        <span className={styles.avatar} aria-hidden="true">{Array.from(user.displayName.trim())[0]}</span>
        {!collapsed && <div><strong>{user.displayName}</strong><small>{userRoleLabels[user.role]}</small></div>}
        {!collapsed && <LogoutButton />}
      </div>
    </footer>
  </div>;
}

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("dashboard");
  const dialog = useRef<HTMLDialogElement>(null);
  function openMobile() { dialog.current?.showModal(); setMobileOpen(true); }
  function closeMobile() { dialog.current?.close(); }
  return <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}>
    <aside className={styles.sidebar}><Sidebar user={user} activeItem={activeItem} onSelect={setActiveItem} collapsed={collapsed} onToggle={() => setCollapsed(current => !current)} /></aside>
    <div className={styles.workspace}>
      <header className={styles.topbar}>
        <div><button type="button" className={`${styles.iconButton} ${styles.mobileToggle}`} onClick={openMobile} aria-label="باز کردن منوی داشبورد" aria-expanded={mobileOpen} aria-controls="dashboard-mobile-menu"><Menu aria-hidden="true" /></button><span>داشبورد</span></div>
        <Link href="/">صفحه اصلی</Link>
      </header>
      {children}
    </div>
    <dialog id="dashboard-mobile-menu" className={styles.mobileDrawer} ref={dialog} onClose={() => setMobileOpen(false)} onClick={event => { if (event.target === event.currentTarget) closeMobile(); }} aria-label="منوی داشبورد">
      <Sidebar user={user} activeItem={activeItem} onSelect={setActiveItem} onToggle={closeMobile} mobile />
    </dialog>
  </div>;
}

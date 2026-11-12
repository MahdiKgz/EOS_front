"use client";

import { type CSSProperties, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Boxes,
  FileChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react";
import { type User, userRoleLabels } from "@/entities/user";
import { PanelModeDialog, type PanelMode } from "@/features/select-panel-mode";
import { LogoutButton } from "@/features/auth-session";
import { dashboardNavigation } from "../model/navigation";
import styles from "./dashboard-shell.module.css";
import { DashboardHeader } from "./dashboard-header";

type SidebarProps = {
  user: User;
  collapsed?: boolean;
  onToggle: () => void;
  mobile?: boolean;
  management?: boolean;
  activeItem: string;
  onSelect: (id: string) => void;
};
const groupIcons = { assets: Boxes, security: ShieldAlert, actions: Wrench };
const pendingItems = [
  { id: "reports", title: "گزارش‌گیری", icon: FileChartColumn },
  { id: "lab", title: "آزمایشگاه شبکه", icon: Gauge },
] as const;
const itemColor = (id: string) => ({ "--nav-accent": `var(--sidebar-${id})` }) as CSSProperties;
function Sidebar({
  user,
  collapsed = false,
  onToggle,
  mobile = false,
  management = false,
  activeItem,
  onSelect,
}: SidebarProps) {
  const pathname = usePathname();
  const layoutGroupId = useId();
  const reduceMotion = useReducedMotion();
  const indicator = (
    <motion.span
      layoutId="active-sidebar-item"
      className={styles.activeIndicator}
      aria-hidden="true"
      initial={false}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    />
  );
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    pathname.startsWith("/dashboard/assets") ? ["assets"] : [],
  );
  function toggleGroup(id: string) {
    onSelect(id);
    setOpenGroups((groups) =>
      collapsed || !groups.includes(id)
        ? [...new Set([...groups, id])]
        : groups.filter((group) => group !== id),
    );
    if (collapsed) onToggle();
  }
  return (
    <>
      {!mobile && (
        <button
          type="button"
          className={`${styles.iconButton} ${styles.edgeToggle}`}
          onClick={onToggle}
          aria-label={collapsed ? "باز کردن سایدبار" : "جمع کردن سایدبار"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
        </button>
      )}
      <div className={styles.sidebarInner}>
        <header className={styles.sidebarHeader}>
          <Link href="/dashboard" className={styles.brand} aria-label="EOSNet، داشبورد">
            <span className={styles.brandMark} aria-hidden="true">
              E
            </span>
            {!collapsed && (
              <span>
                <strong dir="ltr">EOSNET</strong>
                <small>مرکز فرمان امنیت</small>
              </span>
            )}
          </Link>
          {mobile && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={onToggle}
              aria-label="بستن منو"
            >
              <X aria-hidden="true" />
            </button>
          )}
        </header>
        <LayoutGroup id={layoutGroupId}>
          <motion.nav layoutScroll className={styles.navigation} aria-label="منوی داشبورد">
            <Link
              href="/dashboard"
              style={itemColor("dashboard")}
              className={`${styles.activeLink} ${styles.navItem} ${activeItem === "dashboard" ? styles.selected : ""}`}
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              title={collapsed ? "داشبورد" : undefined}
              onClick={() => {
                onSelect("dashboard");
                if (mobile) onToggle();
              }}
            >
              {activeItem === "dashboard" && indicator}
              <LayoutDashboard className={styles.menuIcon} aria-hidden="true" />
              {!collapsed && <span>{management ? "مدیریت سامانه" : "داشبورد"}</span>}
            </Link>
            {!management &&
              dashboardNavigation.map((group) => {
                const open = !collapsed && openGroups.includes(group.id);
                const id = `${mobile ? "mobile" : "desktop"}-${group.id}`;
                const Icon = groupIcons[group.id];
                return (
                  <section className={styles.group} key={group.id} style={itemColor(group.id)}>
                    <button
                      type="button"
                      className={`${styles.groupButton} ${styles.navItem} ${activeItem === group.id ? styles.selected : ""}`}
                      onClick={() => toggleGroup(group.id)}
                      aria-pressed={activeItem === group.id}
                      aria-expanded={open}
                      aria-controls={id}
                      title={collapsed ? group.title : undefined}
                    >
                      {activeItem === group.id && indicator}
                      <Icon className={styles.menuIcon} aria-hidden="true" />
                      {!collapsed && (
                        <>
                          <span className={styles.itemLabel}>{group.title}</span>
                          <ChevronDown
                            className={open ? styles.chevronOpen : styles.chevronClosed}
                            aria-hidden="true"
                          />
                        </>
                      )}
                    </button>
                    <motion.ul
                      id={id}
                      className={styles.submenu}
                      initial={false}
                      animate={{
                        height: open ? "auto" : 0,
                        opacity: open ? 1 : 0,
                        marginTop: open ? 4 : 0,
                        marginBottom: open ? 4 : 0,
                      }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.5,
                        delay: reduceMotion || !open ? 0 : 0.5,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                      aria-hidden={!open}
                      inert={!open}
                    >
                      {group.items.map((item) => (
                        <li key={item.title}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              aria-current={
                                pathname === item.href ||
                                (item.href !== "/dashboard/assets" &&
                                  pathname.startsWith(item.href + "/"))
                                  ? "page"
                                  : undefined
                              }
                              onClick={() => {
                                onSelect(group.id);
                                if (mobile) onToggle();
                              }}
                            >
                              {item.title}
                            </Link>
                          ) : (
                            <button type="button" disabled title="این بخش هنوز در دسترس نیست">
                              {item.title}
                            </button>
                          )}
                        </li>
                      ))}
                    </motion.ul>
                  </section>
                );
              })}
            {!management &&
              pendingItems.map(({ id, title, icon: Icon }) => (
                <button
                  className={styles.pendingItem}
                  style={itemColor(id)}
                  type="button"
                  disabled
                  key={id}
                  title={collapsed ? title : "این بخش هنوز در دسترس نیست"}
                >
                  <Icon className={styles.menuIcon} aria-hidden="true" />
                  {!collapsed && <span>{title}</span>}
                </button>
              ))}
          </motion.nav>
        </LayoutGroup>
        <footer className={styles.sidebarFooter}>
          <div
            className={styles.userCard}
            title={collapsed ? `${user.displayName} / ${userRoleLabels[user.role]}` : undefined}
          >
            <span className={styles.avatar} aria-hidden="true">
              {Array.from(user.displayName.trim())[0]}
            </span>
            {!collapsed && (
              <div>
                <strong>{user.displayName}</strong>
                <small>{userRoleLabels[user.role]}</small>
              </div>
            )}
            {!collapsed && <LogoutButton />}
          </div>
        </footer>
      </div>
    </>
  );
}

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const [panelMode, setPanelMode] = useState<PanelMode | null>(null);
  const [selectingPanel, setSelectingPanel] = useState(user.role === "pl_admin");
  const management = user.role === "pl_admin" && panelMode === "management";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const routeSection = pathname.startsWith("/dashboard/assets") ? "assets" : "dashboard";
  const [navigationSelection, setNavigationSelection] = useState({
    path: pathname,
    id: routeSection,
  });
  const activeItem = navigationSelection.path === pathname ? navigationSelection.id : routeSection;
  function setActiveItem(id: string) {
    setNavigationSelection({ path: pathname, id });
  }
  const dialog = useRef<HTMLDialogElement>(null);
  const activeGroup = management
    ? undefined
    : dashboardNavigation.find((group) => group.id === activeItem);
  function selectPanel(mode: PanelMode) {
    setPanelMode(mode);
    setActiveItem(pathname.startsWith("/dashboard/assets") ? "assets" : "dashboard");
    setSelectingPanel(false);
  }
  function openMobile() {
    dialog.current?.showModal();
    setMobileOpen(true);
  }
  function closeMobile() {
    dialog.current?.close();
  }
  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}>
      <aside className={styles.sidebar}>
        <Sidebar
          management={management}
          user={user}
          activeItem={activeItem}
          onSelect={setActiveItem}
          collapsed={collapsed}
          onToggle={() => setCollapsed((current) => !current)}
        />
      </aside>
      <div className={styles.workspace}>
        <DashboardHeader
          accent={activeGroup?.id ?? "dashboard"}
          user={user}
          title={
            management
              ? "مدیریت سامانه"
              : pathname === "/dashboard/assets/devices"
                ? "تجهیزات"
                : pathname === "/dashboard/assets/backups"
                  ? "بک‌آپ تجهیزات"
                  : pathname.startsWith("/dashboard/assets/vendors")
                    ? "وندورها"
                    : pathname === "/dashboard/assets/cameras"
                      ? "دوربین‌ها و ضبط‌کننده‌ها"
                      : (activeGroup?.title ?? "داشبورد")
          }
          icon={activeGroup ? groupIcons[activeGroup.id] : LayoutDashboard}
          mobileOpen={mobileOpen}
          onOpenMenu={openMobile}
          panelLabel={management ? "بخش مدیریتی" : "قابلیت‌های سامانه"}
          onChangePanel={user.role === "pl_admin" ? () => setSelectingPanel(true) : undefined}
        />
        {management ? (
          <main className="mx-auto max-w-4xl px-6 py-14">
            <p className="mb-3 text-sm text-primary">ادمین سامانه</p>
            <h1 className="text-2xl font-bold leading-loose">بخش مدیریتی</h1>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">
              {user.displayName}، به محیط مدیریت سامانه خوش آمدید.
            </p>
          </main>
        ) : (
          children
        )}
      </div>
      {user.role === "pl_admin" && (
        <PanelModeDialog selectedMode={panelMode} open={selectingPanel} onSelect={selectPanel} />
      )}
      <dialog
        id="dashboard-mobile-menu"
        className={styles.mobileDrawer}
        ref={dialog}
        onClose={() => setMobileOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMobile();
        }}
        aria-label="منوی داشبورد"
      >
        <Sidebar
          management={management}
          user={user}
          activeItem={activeItem}
          onSelect={setActiveItem}
          onToggle={closeMobile}
          mobile
        />
      </dialog>
    </div>
  );
}

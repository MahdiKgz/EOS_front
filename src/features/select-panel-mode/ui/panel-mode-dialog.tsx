"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, LayoutDashboard, ShieldCheck } from "lucide-react";
import styles from "./panel-mode-dialog.module.css";

export type PanelMode = "features" | "management";
type Props = { open: boolean; selectedMode: PanelMode | null; onSelect: (mode: PanelMode) => void };
const options = [
  {
    mode: "features",
    title: "قابلیت‌های سامانه",
    description: "ورود به محیط عملیاتی و استفاده از ابزارهای شبکه و امنیت",
    icon: LayoutDashboard,
  },
  {
    mode: "management",
    title: "بخش مدیریتی",
    description: "ورود به محیط مدیریت سامانه به‌عنوان ادمین سامانه",
    icon: ShieldCheck,
  },
] as const;

export function PanelModeDialog({ open, selectedMode, onSelect }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  useEffect(() => {
    const element = dialog.current;
    return () => {
      element?.close();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => event.preventDefault()}
    >
      <AnimatePresence
        onExitComplete={() => {
          if (!open) dialog.current?.close();
        }}
      >
        {open && (
          <motion.div key="panel-choice" initial="hidden" animate="visible" exit="hidden">
            <motion.div
              className={styles.backdrop}
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
              aria-hidden="true"
            />
            <motion.section
              className={styles.panel}
              variants={{
                hidden: { opacity: 0, y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.97 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <span className={styles.eyebrow}>ادمین سامانه</span>
              <h2 id={titleId}>وارد کدام بخش می‌شوید؟</h2>
              <p id={descriptionId}>
                برای ادامه، بخش موردنظر را انتخاب کنید. بعداً می‌توانید از بالای صفحه بخش را تغییر
                دهید.
              </p>
              <div className={styles.options}>
                {options.map(({ mode, title, description, icon: Icon }) => (
                  <motion.button
                    key={mode}
                    type="button"
                    className={styles.option}
                    aria-pressed={selectedMode === mode}
                    onClick={() => onSelect(mode)}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.99 }}
                  >
                    <span className={styles.icon}>
                      <Icon aria-hidden="true" />
                    </span>
                    <strong>{title}</strong>
                    <span className={styles.description}>{description}</span>
                    <span className={styles.enter}>
                      انتخاب <ArrowLeft aria-hidden="true" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

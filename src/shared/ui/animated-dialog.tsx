"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import styles from "./animated-dialog.module.css";
export function AnimatedDialog({
  open,
  title,
  description,
  busy = false,
  onClose,
  onExited,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  description?: string;
  busy?: boolean;
  onClose: () => void;
  onExited: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    titleId = useId(),
    descriptionId = useId();
  const pointerStartedOutside = useRef(false);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  useEffect(() => {
    const el = dialog.current;
    return () => {
      el?.close();
    };
  }, []);
  return (
    <dialog
      className={styles.dialog}
      ref={dialog}
      data-entering={open ? "" : undefined}
      onPointerDown={(event) => {
        pointerStartedOutside.current =
          event.target === event.currentTarget ||
          event.target === event.currentTarget.querySelector("[data-dialog-backdrop]");
      }}
      onClick={(event) => {
        const clickedOutside =
          event.target === event.currentTarget ||
          event.target === event.currentTarget.querySelector("[data-dialog-backdrop]");
        if (open && !busy && pointerStartedOutside.current && clickedOutside) onClose();
        pointerStartedOutside.current = false;
      }}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <AnimatePresence
        onExitComplete={() => {
          if (!open) {
            dialog.current?.close();
            onExited();
          }
        }}
      >
        {open && (
          <motion.div key="dialog" initial={false} animate="visible" exit="hidden">
            <motion.div
              className={styles.backdrop}
              data-dialog-backdrop
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              aria-hidden="true"
            />
            <motion.section
              className={styles.panel}
              variants={{
                hidden: { opacity: 0, y: reduced ? 0 : 16, scale: reduced ? 1 : 0.98 },
                visible: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: reduced ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <header className={styles.header}>
                <div>
                  <h2 id={titleId}>{title}</h2>
                  {description && <p id={descriptionId}>{description}</p>}
                </div>
                <button
                  type="button"
                  className={styles.close}
                  aria-label="بستن پنجره"
                  disabled={busy}
                  onClick={onClose}
                >
                  <X size={18} />
                </button>
              </header>
              <div className={styles.body}>{children}</div>
              {footer && <footer className={styles.footer}>{footer}</footer>}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </dialog>
  );
}

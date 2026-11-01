"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { authSlides } from "../model/slides";
import styles from "./auth-shell.module.css";

export function AuthShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    let interval: number | undefined;
    function updatePlayback() {
      window.clearInterval(interval);
      if (paused || reduceMotion || !desktop.matches) return;
      interval = window.setInterval(() => {
        setActive(
          (current) =>
            (current + 1 + Math.floor(Math.random() * (authSlides.length - 1))) % authSlides.length,
        );
      }, 8000);
    }
    updatePlayback();
    desktop.addEventListener("change", updatePlayback);
    return () => {
      window.clearInterval(interval);
      desktop.removeEventListener("change", updatePlayback);
    };
  }, [paused, reduceMotion]);

  const slide = authSlides[active];
  function select(index: number) {
    setPaused(true);
    setActive((index + authSlides.length) % authSlides.length);
  }
  return (
    <section
      className={styles.story}
      aria-roledescription="اسلایدهای معرفی سامانه"
      aria-label="قابلیت‌های EOSNet"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div className={styles.storyContent} aria-live={paused ? "polite" : "off"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            <span className={styles.eyebrow}>{slide.label}</span>
            <h2>{slide.title}</h2>
            <p>{slide.description}</p>
            <ul className={styles.details}>
              {slide.details.map((detail) => (
                <li key={detail}>
                  <Check aria-hidden="true" />
                  {detail}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={styles.controls}>
        <div className={styles.dots} aria-label="انتخاب معرفی">
          {authSlides.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => select(index)}
              aria-label={item.label}
              aria-pressed={active === index}
            >
              <span />
            </button>
          ))}
        </div>
        <div className={styles.arrows}>
          <button type="button" onClick={() => select(active - 1)} aria-label="معرفی قبلی">
            <ArrowRight aria-hidden="true" />
          </button>
          <button type="button" onClick={() => select(active + 1)} aria-label="معرفی بعدی">
            <ArrowLeft aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

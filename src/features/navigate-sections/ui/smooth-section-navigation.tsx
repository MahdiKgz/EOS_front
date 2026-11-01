"use client";

import { useEffect } from "react";
import { animate, useReducedMotion } from "framer-motion";

type SmoothSectionNavigationProps = { rootId: string };

export function SmoothSectionNavigation({ rootId }: SmoothSectionNavigationProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;

    let stopAnimation: (() => void) | undefined;
    const cancelAnimation = () => {
      stopAnimation?.();
      stopAnimation = undefined;
    };

    const focusTarget = (target: HTMLElement) => {
      const temporaryTabIndex = !target.hasAttribute("tabindex");
      if (temporaryTabIndex) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (temporaryTabIndex) {
        target.addEventListener("blur", () => target.removeAttribute("tabindex"), { once: true });
      }
    };

    const navigate = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (
        !link ||
        !root.contains(link) ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      )
        return;

      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      let targetId: string;
      try {
        targetId = decodeURIComponent(hash.slice(1));
      } catch {
        return;
      }
      const target = document.getElementById(targetId);
      if (!target || !root.contains(target)) return;

      event.preventDefault();
      cancelAnimation();
      if (location.hash !== hash) history.pushState(null, "", hash);

      const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
      const top = Math.max(
        0,
        Math.min(
          target.getBoundingClientRect().top + window.scrollY - margin,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      const distance = Math.abs(top - window.scrollY);
      if (
        reduceMotion ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        distance < 1
      ) {
        window.scrollTo({ top, behavior: "instant" });
        focusTarget(target);
        return;
      }

      const controls = animate(window.scrollY, top, {
        duration: Math.min(1.05, 0.5 + distance / 10000),
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (value) => window.scrollTo({ top: value, behavior: "instant" }),
        onComplete: () => {
          stopAnimation = undefined;
          focusTarget(target);
        },
      });
      stopAnimation = () => controls.stop();
    };

    const interruptWithKeyboard = (event: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape"].includes(
          event.key,
        )
      )
        cancelAnimation();
    };
    root.addEventListener("click", navigate);
    window.addEventListener("wheel", cancelAnimation, { passive: true });
    window.addEventListener("touchstart", cancelAnimation, { passive: true });
    window.addEventListener("keydown", interruptWithKeyboard);
    window.addEventListener("popstate", cancelAnimation);
    return () => {
      cancelAnimation();
      root.removeEventListener("click", navigate);
      window.removeEventListener("wheel", cancelAnimation);
      window.removeEventListener("touchstart", cancelAnimation);
      window.removeEventListener("keydown", interruptWithKeyboard);
      window.removeEventListener("popstate", cancelAnimation);
    };
  }, [rootId, reduceMotion]);

  return null;
}

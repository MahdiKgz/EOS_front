"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "react-hot-toast";
export default function ToastLayer() {
  const [host] = useState(() => document.createElement("div"));
  useEffect(() => {
    if (!host) return;
    // Native modal dialogs render in the browser's top layer.
    const updateHost = () => {
      const dialogs = document.querySelectorAll("dialog:modal");
      const parent = dialogs[dialogs.length - 1] ?? document.body;
      if (host.parentElement !== parent) parent.append(host);
    };
    const observer = new MutationObserver(updateHost);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      childList: true,
      subtree: true,
    });
    updateHost();
    return () => {
      observer.disconnect();
      host.remove();
    };
  }, [host]);
  return host
    ? createPortal(
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
              fontFamily: "Tahoma, sans-serif",
              fontSize: "13px",
              lineHeight: "1.9",
              direction: "rtl",
            },
          }}
        />,
        host,
      )
    : null;
}

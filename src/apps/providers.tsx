"use client";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { Toaster } from "react-hot-toast";
import { makeStore } from "./store";
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  useEffect(() => setupListeners(store.dispatch), [store]);
  return <Provider store={store}>{children}<Toaster position="top-center" toastOptions={{ duration: 5000, style: { background: "var(--card)", color: "var(--foreground)", border: "1px solid var(--border)", fontFamily: "Tahoma, sans-serif", fontSize: "13px", lineHeight: "1.9", direction: "rtl" } }} /></Provider>;
}

"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Provider } from "react-redux";
import { setupListeners } from "@reduxjs/toolkit/query";
import { makeStore } from "./store";
const ToastLayer = dynamic(() => import("./toast-layer"), { ssr: false });
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  useEffect(() => setupListeners(store.dispatch), [store]);
  return (
    <Provider store={store}>
      {children}
      <ToastLayer />
    </Provider>
  );
}

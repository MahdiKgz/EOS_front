import { Providers } from "./providers";
import type { Metadata } from "next";
import "./styles/globals.css";
export const metadata: Metadata = { title: "EOSNet", description: "سامانه EOSNet" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fa" dir="rtl"><body><Providers>{children}</Providers></body></html>;
}

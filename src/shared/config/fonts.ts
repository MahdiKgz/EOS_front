import localFont from "next/font/local";

export const iranYekan = localFont({
  src: "../assets/fonts/iranyekan.ttf",
  display: "swap",
  variable: "--font-ui",
  weight: "400",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

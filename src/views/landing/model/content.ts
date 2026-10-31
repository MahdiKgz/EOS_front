import { Activity, Bot, Command, Network, Radar, ShieldCheck } from "lucide-react";
import productOverview from "@/shared/assets/landing/product-overview.png";
import controlledAction from "@/shared/assets/landing/controlled-action.png";
import monitoringAssistant from "@/shared/assets/landing/monitoring-assistant.png";

export const productViews = [
  {
    index: "01",
    eyebrow: "داشبورد شبکه",
    title: "وضعیت شبکه در یک نگاه",
    description:
      "سلامت تجهیزات، هشدارهای امنیتی و اقدام‌های در انتظار تأیید را در داشبورد ببینید. اطلاعات موردنیاز برای بررسی وضعیت شبکه در یک صفحه در دسترس شماست.",
    image: productOverview,
    alt: "نمای یکپارچه داشبورد، پایش لینوکس و دارایی‌های Firewall SOAR",
    accent: "cyan",
    facts: ["اولویت‌بندی هشدارها", "سلامت تجهیزات", "آخرین اجراها"],
  },
  {
    index: "02",
    eyebrow: "مدیریت فرمان‌ها",
    title: "بررسی و اجرای فرمان‌های فارسی",
    description:
      "فرمان موردنیاز را از فهرست فارسی انتخاب کنید. دستگاه مقصد و تنظیمات اجرا را بررسی کنید و پس از تأیید، نتیجه و سوابق اجرای فرمان را ببینید.",
    image: controlledAction,
    alt: "نمای بررسی فرمان، تأیید اجرا و مشاهده نتیجه در سامانه",
    accent: "violet",
    facts: ["پیش‌نمایش فرمان", "تأیید پیش از اجرا", "سوابق اجرا"],
  },
  {
    index: "03",
    eyebrow: "پایش و دستیار هوشمند",
    title: "پایش تجهیزات با کمک دستیار هوشمند",
    description:
      "وضعیت روزانه تجهیزات و روند هشدارها را بررسی کنید. دستیار هوشمند در تحلیل اطلاعات و پیشنهاد اقدام بعدی کمک می‌کند؛ اجرای هر پیشنهاد به بررسی و تأیید شما نیاز دارد.",
    image: monitoringAssistant,
    alt: "پایش روزانه تجهیزات و دستیار هوشمند امنیتی Firewall SOAR",
    accent: "coral",
    facts: ["بررسی روزانه", "تحلیل وضعیت شبکه", "پیشنهاد اقدام بعدی"],
  },
] as const;

export const capabilities = [
  { icon: Network, title: "مدیریت تجهیزات شبکه", text: "تجهیزات Linux، MikroTik، Cisco، FortiGate، pfSense و Sophos را در فهرست دارایی‌ها ثبت و وضعیت آن‌ها را بررسی کنید." },
  { icon: Radar, title: "پایش وضعیت تجهیزات", text: "سلامت دستگاه‌ها، رویدادهای ثبت‌شده و زمان آخرین بررسی را ببینید." },
  { icon: ShieldCheck, title: "بررسی هشدارهای امنیتی", text: "هشدارها را بر اساس شدت بررسی کنید و جزئیات و شواهد مرتبط با هر مورد را ببینید." },
  { icon: Command, title: "فرمان‌های آماده فارسی", text: "فرمان موردنیاز را از فهرست انتخاب کنید، تنظیمات آن را وارد کنید و پیش از اجرا، جزئیات را بررسی کنید." },
  { icon: Bot, title: "دستیار تحلیل شبکه", text: "برای بررسی وضعیت شبکه و انتخاب اقدام بعدی از پیشنهادهای دستیار کمک بگیرید." },
  { icon: Activity, title: "سوابق اجرای فرمان‌ها", text: "ببینید کدام فرمان روی چه دستگاهی اجرا شده و نتیجه آن چه بوده است." },
];

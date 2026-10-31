# EOSNet Frontend

زیرساخت Next.js 16، React، TypeScript، Tailwind CSS 4، shadcn/ui و React Hook Form.

## اجرا

پیش‌نیاز: Node.js 22 یا جدیدتر و pnpm 10.26.1.

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

آدرس پیش‌فرض: http://localhost:3000. مقدار `NEXT_PUBLIC_API_URL` آدرس پایه API است و در زمان build در کد مرورگر قرار می‌گیرد؛ اطلاعات محرمانه در آن قرار ندهید.

## معماری Feature-Sliced Design

```text
app/                       ورودی‌های الزامی Next.js App Router؛ فقط اتصال به apps
src/
  apps/                    لایه App: سازمان‌دهی مسیرها، layout و styles
    routes/                اتصال مسیرها به صفحات
  views/                   لایه Pages در FSD، با نام views برای جلوگیری از تداخل Pages Router
    landing/               صفحه سروری معرفی محصول؛ محتوای ثابت، اجزای UI و CSS Module
  widgets/                 بلوک‌های ترکیبی رابط
  features/                تعامل‌ها و قابلیت‌های کاربر
    check-api/             نمونه واقعی RHF + Zod برای بررسی سلامت API
      model/
      ui/
      index.ts             API عمومی slice
  entities/                مدل‌ها و UI مربوط به موجودیت‌های دامنه
  shared/                  UI پایه، ابزارها و تنظیمات عمومی
```

ترتیب وابستگی‌ها: `apps → views → widgets → features → entities → shared`.
هر لایه فقط از لایه‌های پایین‌تر استفاده می‌کند؛ sliceهای هم‌لایه به یکدیگر وابسته نمی‌شوند. از بیرون هر slice فقط از `index.ts` آن import کنید. پوشه‌های خالی widgets و entities برای قابلیت‌های آینده هستند.

Next.js پوشه `apps` را به‌عنوان router تشخیص نمی‌دهد؛ بنابراین فایل‌های نازک `app/page.tsx` و `app/layout.tsx` به کد داخل `src/apps` متصل‌اند. برای مسیر جدید، ورودی متناظر را در `app/` و ترکیب صفحه را در `src/apps/routes` بسازید. برای مسیرهای پویا تنظیماتی مانند `dynamic` و `revalidate` باید مستقیماً در فایل مسیر Next تعریف شوند.

## رابط و فرم‌ها

کامپوننت‌های shadcn در `src/shared/ui` و تنظیم CLI در `components.json` است:

```bash
pnpm dlx shadcn@latest add dialog
```

فرم‌ها را با React Hook Form و schemaهای Zod پیاده‌سازی کنید؛ نمونه در `features/check-api` است.

## Landing

مسیر `/` از طریق `app/page.tsx → src/apps/routes/home.tsx → views/landing` به صفحه معرفی محصول متصل است. صفحه و تمام بخش‌های آن Server Component هستند و در build از پیش رندر می‌شوند؛ برای محتوای ثابت نیازی به اجرای مجدد در هر درخواست نیست. صفحه و محتوای landing سروری می‌مانند؛ فقط قابلیت تعامل `features/navigate-sections` یک جزیره کلاینت کوچک برای اسکرول نرم با `framer-motion` است.

محتوا، ترتیب بخش‌ها، طراحی تیره، تصاویر و فونت محلی از landing نسخه مرجع `track_firewall_log` اقتباس شده‌اند. تصاویر با `next/image` و فونت با `next/font/local` ارائه می‌شوند. CSS Module صفحه از بقیه UI جداست؛ محتوای صفحه بدون JavaScript هم قابل مشاهده است و کاهش حرکت سیستم رعایت می‌شود.

بخش‌ها: معرفی، نماهای محصول، قابلیت‌ها، چرخه اقدام، تیم و footer. داده‌های ثابت در `src/views/landing/model/content.ts` و اجزای صفحه در `src/views/landing/ui` قرار دارند. لینک «ورود / ثبت نام» مسیر `/dashboard` نسخه مرجع را نگه می‌دارد؛ پیاده‌سازی داشبورد و احراز هویت در محدوده این مرحله نیست.

لینک‌های داخلی هدر، معرفی محصول و بازگشت به بالا با Framer Motion بین بخش‌ها جابه‌جا می‌شوند. انتخاب سریع لینک جدید، حرکت قبلی را متوقف می‌کند؛ اسکرول دستی کاربر اولویت دارد. تنظیم `prefers-reduced-motion` رعایت می‌شود و لینک‌های معمولی بدون JavaScript هم کار می‌کنند.

## تنظیم تم

منبع رنگ‌های کل برنامه `src/apps/styles/theme.css` است. landing، Tailwind و shadcn از همین متغیرهای معنایی استفاده می‌کنند؛ رنگ ثابت در CSS صفحه تعریف نکنید.

- رنگ اصلی برند: `--primary`؛ متن روی آن: `--primary-foreground`.
- پس‌زمینه‌ها: `--background`، `--background-middle`، `--background-end`، `--card` و `--surface-raised`.
- متن‌ها: `--foreground`، `--foreground-strong`، `--muted-foreground` و `--text-subtle`.
- رنگ مکمل و وضعیت‌ها: `--accent`، `--success`، `--warning` و `--destructive`.
- حاشیه و سایه: `--border-color` و `--shadow-color`.

رنگ‌های شفاف، گرادیان‌ها و حالت‌های هاور با `color-mix` از همین مقادیر ساخته می‌شوند. تم پیش‌فرض تیره است؛ برای تم روشن آماده، `data-theme="light"` را روی تگ `html` در `src/apps/layout.tsx` بگذارید. برای تم اختصاصی، پالت متغیرها را در فایل تم تغییر دهید؛ نیازی به تغییر کامپوننت‌ها یا افزودن JavaScript نیست.

## بررسی و build

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

منابع: [Next.js](https://nextjs.org/docs/app/getting-started/installation)، [FSD](https://feature-sliced.design/docs/get-started/overview)، [shadcn/ui](https://ui.shadcn.com/docs/installation/manual).

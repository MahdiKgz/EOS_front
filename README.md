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

فرم‌ها را با React Hook Form و schemaهای Zod پیاده‌سازی کنید؛ نمونه در `features/check-api` است. صفحه اولیه فارسی و RTL است. هیچ منطق تجاری نسخه قبلی در این مرحله منتقل نشده است.

## بررسی و build

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm start
```

منابع: [Next.js](https://nextjs.org/docs/app/getting-started/installation)، [FSD](https://feature-sliced.design/docs/get-started/overview)، [shadcn/ui](https://ui.shadcn.com/docs/installation/manual).

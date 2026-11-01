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

بخش‌ها: معرفی، نماهای محصول، قابلیت‌ها، چرخه اقدام، تیم و footer. داده‌های ثابت در `src/views/landing/model/content.ts` و اجزای صفحه در `src/views/landing/ui` قرار دارند. لینک‌های ورود در هدر و معرفی اولیه به `/login` متصل‌اند.

لینک‌های داخلی هدر، معرفی محصول و بازگشت به بالا با Framer Motion بین بخش‌ها جابه‌جا می‌شوند. انتخاب سریع لینک جدید، حرکت قبلی را متوقف می‌کند؛ اسکرول دستی کاربر اولویت دارد. تنظیم `prefers-reduced-motion` رعایت می‌شود و لینک‌های معمولی بدون JavaScript هم کار می‌کنند.

## صفحه‌های احراز هویت

مسیرهای `/login`، `/register` و `/forget-password` در گروه `app/(auth)` از layout مشترک استفاده می‌کنند. ورودی‌های Next.js به فایل‌های مسیریابی `src/apps/routes` متصل‌اند.

- `widgets/auth-shell`: layout سروری با نسبت ۳۰٪ فرم و ۷۰٪ معرفی در دسکتاپ (از عرض 1280px). محتوای اسلاید تمام عرض پنل تصویری را می‌گیرد. بخش تصویری در تبلت و موبایل پنهان می‌شود و فرم عرض در دسترس را می‌گیرد.
- `views/auth`: صفحات سروری، عنوان‌ها و لینک‌های بین فرم‌ها.
- `features/auth-forms`: فرم‌های کلاینت React Hook Form، schemaهای Zod و خطاهای دسترس‌پذیر.
- `shared/ui/password-input`: نمایش و پنهان‌کردن رمز عبور.

متن معرفی در پنل تصویری هر ۸ ثانیه از بین سه موضوع تغییر می‌کند؛ کاربر هم می‌تواند موضوع را انتخاب کند. حرکت با تنظیم کاهش حرکت سیستم متوقف می‌شود.

درخواست‌ها با RTK Query در `entities/user/api` تعریف شده‌اند و store برای هر نمونه Provider در `apps` ساخته می‌شود. مرورگر فقط با `/api/auth/*` در خود Next.js ارتباط دارد. Route Handler درخواست را به NestJS می‌فرستد و JWT را در کوکی HttpOnly/SameSite=Lax (در production با Secure) نگه می‌دارد؛ توکن به JavaScript یا localStorage فرستاده نمی‌شود. درخواست‌های تغییردهنده فقط با JSON و Origin همان سایت پذیرفته می‌شوند.

ورود با `username` و رمز عبور انجام می‌شود. ثبت‌نام `username`، `displayName`، رمز حداقل ۱۲ کاراکتری و تکرار آن را می‌گیرد؛ ایمیل و تلفن مطابق مدل مبنا اختیاری‌اند. نقش عمومی `co_employee` است و قابل تعیین از فرم نیست. فرم‌ها از loading واقعی mutation، جلوگیری از ارسال تکراری، غیرفعال‌سازی فیلدها و دکمه‌ها، spinner و react-hot-toast استفاده می‌کنند.

داشبورد در `app/(protected)/dashboard` با بررسی سروری `/auth/me` محافظت می‌شود. صرف وجود یا decode شدن JWT کافی نیست؛ امضا، انقضا و اعتبار نشست در بک‌اند بررسی می‌شوند. کاربران واردشده از `/login`، `/register` و `/forget-password` به `/dashboard` هدایت می‌شوند. شکست سرویس با خطای قابل تلاش مجدد نمایش داده می‌شود. داشبورد فعلی هویت حساب، خروج و ساختار سایدبار را نشان می‌دهد؛ جریان اختصاصی هر نقش هنوز اضافه نشده است. سایدبار در `widgets/dashboard-shell` قرار دارد، منوهای گروه‌بندی‌شده و قابل جمع‌کردن و footer ثابت کاربر دارد و در موبایل با dialog باز می‌شود. مسیر داشبورد فعال است و گزینه‌های ماژول‌های آینده فعلاً غیرفعال‌اند. نشان‌های منو و رنگ‌بندی اختصاصی پس از مشخص شدن طرح نهایی جایگزین می‌شوند.

مسیر `/reset-password?token=...` نیز برای تکمیل لینک ایمیل آماده است. بازیابی به SMTP بک‌اند نیاز دارد؛ در نبود آن خطای واقعی نمایش داده می‌شود. پس از تعیین رمز جدید، نشست‌های قبلی در بک‌اند باطل می‌شوند.

`API_INTERNAL_URL` آدرس سروری NestJS با prefix کامل است؛ پیش‌فرض `http://127.0.0.1:4000/api/v1`. متغیر `NEXT_PUBLIC_API_URL` هنوز برای نمونه بررسی اتصال استفاده می‌شود و مسیر احراز هویت را کنترل نمی‌کند.

### آزمایش اتصال

با دیتابیس، NestJS و فرانت در حال اجرا:

```bash
pnpm test:auth
```

تست با یک حساب موقت، کوکی HttpOnly، ریدایرکت‌ها، توکن جعلی، خروج و CSRF را بررسی می‌کند و فقط حساب ساخته‌شده توسط خودش را پاک می‌کند. برای آدرس متفاوت فرانت از `FRONTEND_TEST_URL` استفاده کنید. تست از اتصال دیتابیس `EOS_Back/.env` برای پاک‌سازی حساب آزمایشی استفاده می‌کند.

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

## Code formatting

- `pnpm format`: format the project with Prettier.
- `pnpm format:check`: check formatting without changing files.
- Husky runs `lint-staged` before every commit to format staged files and include the changes in the commit. A formatting failure blocks the commit.
- `pnpm install` activates the hooks through the `prepare` script.

export const dashboardNavigation = [
  {
    id: "assets",
    title: "دارایی‌ها",
    items: [
      { title: "نمای کلی", href: "/dashboard/assets" },
      { title: "تجهیزات", href: "/dashboard/assets/devices" },
      ...["پورت‌ها و اتصالات", "دوربین‌ها", "وندورها"].map((title) => ({
        title,
        href: null,
      })),
    ],
  },
  {
    id: "security",
    title: "امنیت",
    items: ["نمای کلی", "یافته‌ها", "کاربران و فعالیت‌ها", "قوانین تشخیص", "اعلان‌های ایمیلی"].map(
      (title) => ({ title, href: null }),
    ),
  },
  {
    id: "actions",
    title: "اقدامات",
    items: ["اقدامات", "زمان‌بندی عملیات"].map((title) => ({ title, href: null })),
  },
] as const;

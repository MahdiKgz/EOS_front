"use client";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Network } from "lucide-react";
import type { FortiActionInput, FortiCollection } from "@/entities/device";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
export function FortigateNetworkFields({
  form,
  collection,
  busy = false,
}: {
  form: UseFormReturn<FortiActionInput>;
  collection?: FortiCollection | null;
  busy?: boolean;
}) {
  const action = useWatch({ control: form.control, name: "action" });
  const sourceCidr = useWatch({ control: form.control, name: "sourceCidr" });
  const options = (keys: string[]) =>
    (collection?.tables.filter((t) => keys.includes(t.key)).flatMap((t) => t.rows) ?? []).map(
      (row) => ({ value: String(row.name), label: String(row.name), icon: <Network size={14} /> }),
    );
  if (action === "route.delete") return null;
  if (action === "dns.update")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <p className="text-xs text-muted-foreground sm:col-span-2">
          DNS عمومی تجهیز تغییر می‌کند و به VDOM انتخاب‌شده محدود نیست.
        </p>
        <label className="grid gap-2">
          DNS اصلی
          <Input
            dir="ltr"
            {...form.register("primaryDns", { required: "DNS اصلی را وارد کنید." })}
          />
        </label>
        <label className="grid gap-2">
          DNS دوم
          <Input
            dir="ltr"
            {...form.register("secondaryDns", { required: "DNS دوم را وارد کنید." })}
          />
        </label>
      </div>
    );
  if (action === "ntp.update")
    return (
      <label className="grid gap-2">
        سرور NTP
        <Input
          dir="ltr"
          placeholder="time.example.com"
          {...form.register("ntpServer", { required: "سرور NTP را وارد کنید." })}
        />
        <span className="text-xs text-muted-foreground">
          NTP سفارشی و همگام‌سازی عمومی تجهیز فعال می‌شود. فقط سرور ردیف ۱ تغییر می‌کند؛ سرورهای
          دیگر حفظ می‌شوند.
        </span>
      </label>
    );
  if (action.startsWith("route."))
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {action === "route.update" && (
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            فقط فیلدهای تکمیل‌شده تغییر می‌کنند؛ مقادیر خالی حفظ می‌شوند.
          </p>
        )}
        <label className="grid gap-2">
          مقصد (IPv4 یا CIDR)
          <Input
            dir="ltr"
            placeholder="0.0.0.0/0"
            {...form.register("destinationCidr", {
              required: action === "route.create" ? "مقصد را وارد کنید." : false,
            })}
          />
        </label>
        <label className="grid gap-2">
          Gateway
          <Input
            dir="ltr"
            {...form.register("gateway", {
              required: action === "route.create" ? "Gateway را وارد کنید." : false,
            })}
          />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          رابط خروجی
          <Controller
            control={form.control}
            name="dstInterface"
            render={({ field }) => (
              <Select
                disabled={busy}
                label="رابط خروجی"
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={[
                  {
                    value: "",
                    label: action === "route.create" ? "انتخاب خودکار تجهیز" : "بدون تغییر",
                  },
                  ...options(["interfaces"]),
                ]}
              />
            )}
          />
        </label>
      </div>
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(
        [
          ["srcInterface", "رابط یا Zone مبدأ"],
          ["dstInterface", "رابط یا Zone مقصد"],
        ] as const
      ).map(([name, label]) => (
        <label key={name} className="grid gap-2">
          {label}
          <Controller
            control={form.control}
            name={name}
            render={({ field }) => (
              <Select
                disabled={busy}
                label={label}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={[
                  { value: "any", label: "همه (any)" },
                  ...options(["interfaces", "zones"]),
                ]}
              />
            )}
          />
        </label>
      ))}
      <label className="grid gap-2">
        مرجع آدرس مبدأ
        <Input
          dir="ltr"
          disabled={busy || !!sourceCidr}
          placeholder="all"
          {...form.register("srcAddresses")}
        />
        <Select
          disabled={busy || !!sourceCidr}
          label="انتخاب آدرس مبدأ"
          value=""
          onValueChange={(v) => form.setValue("srcAddresses", v)}
          options={options(["addresses", "addressGroups"])}
        />
      </label>
      <label className="grid gap-2">
        مرجع آدرس مقصد
        <Input dir="ltr" placeholder="all" {...form.register("dstAddresses")} />
        <Select
          disabled={busy}
          label="انتخاب آدرس مقصد"
          value=""
          onValueChange={(v) => form.setValue("dstAddresses", v)}
          options={options(["addresses", "addressGroups"])}
        />
      </label>
      <label className="grid gap-2 sm:col-span-2">
        ساخت آدرس مبدأ از IPv4 یا CIDR (اختیاری)
        <Input
          dir="ltr"
          placeholder="192.0.2.0/24"
          {...form.register("sourceCidr", { onChange: () => form.setValue("srcAddresses", "") })}
        />
        <span className="text-xs text-muted-foreground">
          به‌جای مرجع مبدأ؛ آدرس مدیریت‌شده در همین اجرا ساخته یا با تطابق تنظیمات دوباره استفاده
          می‌شود.
        </span>
      </label>
      <label className="grid gap-2">
        وضعیت قانون SNAT
        <Controller
          control={form.control}
          name="policyStatus"
          render={({ field }) => (
            <Select
              disabled={busy}
              label="وضعیت SNAT"
              value={field.value ?? "enable"}
              onValueChange={field.onChange}
              options={[
                { value: "enable", label: "فعال" },
                { value: "disable", label: "غیرفعال" },
              ]}
            />
          )}
        />
      </label>
      <p className="sm:col-span-2 text-xs text-muted-foreground">
        این عملیات حالت Central NAT را تغییر نمی‌دهد؛ وضعیت فعلی آن در پیش‌نمایش نشان داده می‌شود.
      </p>
    </div>
  );
}

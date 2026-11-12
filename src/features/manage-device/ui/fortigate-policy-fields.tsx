"use client";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Network } from "lucide-react";
import {
  isFortiPolicyCreate,
  type FortiActionInput,
  type FortiCollection,
} from "@/entities/device";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
export function FortigatePolicyFields({
  form,
  collection,
}: {
  form: UseFormReturn<FortiActionInput>;
  collection?: FortiCollection | null;
}) {
  const action = useWatch({ control: form.control, name: "action" }),
    create = isFortiPolicyCreate(action);
  const sourceCidr = useWatch({ control: form.control, name: "sourceCidr" });
  const rows = (keys: string[]) =>
    collection?.tables.filter((t) => keys.includes(t.key)).flatMap((t) => t.rows) ?? [];
  const references = (keys: string[]) =>
    rows(keys).map((row) => ({
      value: String(row.name),
      label: String(row.name),
      icon: <Network size={14} />,
    }));
  const select = (
    name: "policyAction" | "policyStatus" | "logTraffic" | "position",
    label: string,
    options: { value: string; label: string }[],
    fallback: string,
  ) => (
    <label className="grid gap-2">
      {label}
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            label={label}
            value={field.value ?? fallback}
            onValueChange={field.onChange}
            options={options}
          />
        )}
      />
    </label>
  );
  if (action === "policy.delete" || action === "policy.enable" || action === "policy.disable")
    return null;
  if (action === "policy.move")
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {select(
          "position",
          "موقعیت",
          [
            { value: "before", label: "قبل از" },
            { value: "after", label: "بعد از" },
          ],
          "before",
        )}
        <label className="grid gap-2">
          شناسهٔ Policy مرجع
          <Input dir="ltr" inputMode="numeric" {...form.register("relativeTo")} />
          <Select
            label="انتخاب Policy مرجع"
            value={form.watch("relativeTo") ?? ""}
            onValueChange={(v) => form.setValue("relativeTo", v)}
            options={rows(["policies"]).map((r) => ({
              value: String(r.id),
              label: `${r.id} · ${r.name ?? ""}`,
            }))}
          />
        </label>
      </div>
    );
  if (action === "policy.comment")
    return (
      <label className="grid gap-2">
        توضیح
        <Input {...form.register("value")} maxLength={150} />
      </label>
    );
  return (
    <div className="grid gap-4">
      {action === "policy.update" && (
        <p className="text-xs text-muted-foreground">
          فقط فیلدهای تکمیل‌شده تغییر می‌کنند؛ گزینهٔ «بدون تغییر» مقدار فعلی را حفظ می‌کند.
        </p>
      )}
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
                  label={label}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  options={[
                    ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
                    { value: "any", label: "همه (any)" },
                    ...references(["interfaces", "zones"]),
                  ]}
                />
              )}
            />
          </label>
        ))}
        {(
          [
            ["srcAddresses", "اشیای آدرس مبدأ", ["addresses", "addressGroups"]],
            [
              "dstAddresses",
              "آدرس یا VIP مقصد",
              ["addresses", "addressGroups", "vips", "vipGroups"],
            ],
            ["services", "سرویس‌ها", ["services", "serviceGroups"]],
          ] as const
        ).map(([name, label, tables]) => (
          <label key={name} className="grid gap-2">
            {label}
            <Input
              dir="ltr"
              placeholder={
                name === "services"
                  ? create
                    ? "ALL"
                    : "بدون تغییر"
                  : create
                    ? "all"
                    : "بدون تغییر"
              }
              disabled={name === "srcAddresses" && !!sourceCidr}
              {...form.register(name)}
            />
            <Select
              label={`افزودن مرجع به ${label}`}
              disabled={name === "srcAddresses" && !!sourceCidr}
              value=""
              onValueChange={(v) => {
                const before = (form.getValues(name) ?? "").split(/[,،\s]+/).filter(Boolean);
                form.setValue(name, [...new Set([...before, v])].join(", "));
              }}
              options={references([...tables])}
              emptyMessage="نام دقیق مرجع را وارد کنید؛ در پیش‌نمایش از تجهیز بررسی می‌شود."
            />
          </label>
        ))}
        <label className="grid gap-2">
          زمان‌بندی
          <Controller
            control={form.control}
            name="schedule"
            render={({ field }) => (
              <Select
                label="زمان‌بندی"
                value={field.value ?? (create ? "always" : "")}
                onValueChange={field.onChange}
                options={[
                  ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
                  { value: "always", label: "همیشه (always)" },
                  ...references(["schedules"]),
                ]}
              />
            )}
          />
        </label>
        {action === "policy.deny" ? (
          <p className="text-xs">رفتار این Policy: مسدودسازی (deny)</p>
        ) : (
          select(
            "policyAction",
            "رفتار",
            [
              ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
              { value: "accept", label: "اجازه (accept)" },
              { value: "deny", label: "مسدود (deny)" },
            ],
            create ? "accept" : "",
          )
        )}
        <label className="grid gap-2">
          NAT مبدأ
          <Controller
            control={form.control}
            name="nat"
            render={({ field }) => (
              <Select
                label="NAT مبدأ"
                value={
                  field.value === undefined
                    ? create
                      ? action === "policy.egress"
                        ? "enable"
                        : "disable"
                      : ""
                    : field.value
                      ? "enable"
                      : "disable"
                }
                onValueChange={(v) => field.onChange(v === "" ? undefined : v === "enable")}
                options={[
                  ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
                  { value: "enable", label: "فعال" },
                  { value: "disable", label: "غیرفعال" },
                ]}
              />
            )}
          />
        </label>
        {select(
          "policyStatus",
          "وضعیت Policy",
          [
            ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
            { value: "disable", label: "غیرفعال" },
            { value: "enable", label: "فعال" },
          ],
          create ? "disable" : "",
        )}
        {select(
          "logTraffic",
          "ثبت رویداد",
          [
            ...(create ? [] : [{ value: "", label: "بدون تغییر" }]),
            { value: "all", label: "همهٔ نشست‌ها" },
            { value: "utm", label: "رویدادهای امنیتی" },
            { value: "disable", label: "غیرفعال" },
          ],
          create ? "all" : "",
        )}
      </div>
      {create && (
        <label className="grid gap-2">
          ساخت آدرس مبدأ از IPv4 یا CIDR (اختیاری)
          <Input
            dir="ltr"
            placeholder="192.0.2.0/24"
            {...form.register("sourceCidr", { onChange: () => form.setValue("srcAddresses", "") })}
          />
          <span className="text-xs text-muted-foreground">
            به‌جای انتخاب مرجع مبدأ؛ آدرس مدیریت‌شده در همین اجرا ساخته یا در صورت تطابق استفاده
            می‌شود.
          </span>
        </label>
      )}
      <label className="grid gap-2">
        توضیح (اختیاری)
        <Input maxLength={150} {...form.register("value")} />
      </label>
    </div>
  );
}

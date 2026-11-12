"use client";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Activity, Network } from "lucide-react";
import type { FortiActionInput, FortiCollection } from "@/entities/device";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
export function FortigateClusterFields({
  form,
  collection,
  busy,
}: {
  form: UseFormReturn<FortiActionInput>;
  collection?: FortiCollection | null;
  busy: boolean;
}) {
  const action = useWatch({ control: form.control, name: "action" });
  const rows = (key: string) => collection?.tables.find((t) => t.key === key)?.rows ?? [];
  const append = (field: "sdwanMembers" | "srcAddresses" | "dstAddresses", value: string) => {
    const values =
      form
        .getValues(field)
        ?.split(/[,،\s]+/)
        .filter(Boolean) ?? [];
    form.setValue(
      field,
      [
        ...new Set([
          ...(field === "sdwanMembers" ? values.filter((v) => +v !== 0) : values),
          value,
        ]),
      ].join(", "),
      { shouldValidate: true },
    );
  };
  if (action.startsWith("ha."))
    return (
      <div className="grid gap-3">
        <p className="text-xs leading-6 text-muted-foreground">
          پیش‌نمایش، تنظیم و وضعیت فعلی HA را از تجهیز می‌خواند. فقط فیلدهای این فرم تغییر می‌کنند؛
          heartbeat و گذرواژهٔ فعلی حفظ می‌شوند. ذخیرهٔ تنظیم به معنی تشکیل سالم کلاستر نیست.
        </p>
        {action === "ha.configure" && (
          <>
            <label className="grid gap-2">
              حالت HA
              <Controller
                control={form.control}
                name="haMode"
                rules={{ required: "حالت HA را انتخاب کنید." }}
                render={({ field }) => (
                  <Select
                    label="حالت HA"
                    disabled={busy}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    options={[
                      { value: "standalone", label: "مستقل (Standalone)" },
                      { value: "a-p", label: "Active-Passive" },
                      { value: "a-a", label: "Active-Active" },
                    ]}
                  />
                )}
              />
            </label>
            <label className="grid gap-2">
              نام گروه
              <Input
                {...form.register("haGroup", {
                  required: "نام گروه را وارد کنید.",
                  maxLength: { value: 32, message: "نام گروه حداکثر ۳۲ نویسه باشد." },
                })}
              />
            </label>
          </>
        )}
        <label className="grid gap-2">
          Priority {action === "ha.configure" ? "(اختیاری؛ خالی برای حفظ مقدار فعلی)" : ""}
          <Input
            dir="ltr"
            inputMode="numeric"
            placeholder="0–255"
            {...form.register("haPriority", {
              required: action === "ha.priority" ? "Priority را وارد کنید." : false,
              validate: (v) =>
                !v || (/^\d{1,3}$/.test(v) && +v <= 255) || "Priority باید بین صفر و ۲۵۵ باشد.",
            })}
          />
        </label>
      </div>
    );
  if (action === "sdwanZone.create")
    return (
      <p className="text-xs text-muted-foreground">
        Zone جدید SD-WAN با اولویت ترتیب تنظیم اعضا ساخته می‌شود. Zone موجود بازنویسی نمی‌شود.
      </p>
    );
  if (action === "sdwanMember.create")
    return (
      <div className="grid gap-3">
        <label className="grid gap-2">
          رابط
          <Controller
            control={form.control}
            name="dstInterface"
            rules={{ required: "رابط را انتخاب کنید." }}
            render={({ field }) => (
              <Select
                label="رابط عضو SD-WAN"
                disabled={busy}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={rows("interfaces").map((r) => ({
                  value: String(r.name),
                  label: String(r.name),
                  icon: <Network size={15} />,
                }))}
              />
            )}
          />
        </label>
        <label className="grid gap-2">
          Zone موجود
          <Input dir="ltr" placeholder="virtual-wan-link" {...form.register("sdwanZone")} />
          <Select
            label="انتخاب Zone از موجودی قبلی"
            disabled={busy}
            value=""
            onValueChange={(v) => form.setValue("sdwanZone", v)}
            options={rows("sdwanZones").map((r) => ({
              value: String(r.id ?? r.name),
              label: String(r.name),
              icon: <Network size={15} />,
            }))}
          />
          <span className="text-xs text-muted-foreground">
            خالی معادل virtual-wan-link است؛ وجود Zone و آزادبودن رابط هنگام پیش‌نمایش بررسی می‌شود.
          </span>
        </label>
        <label className="grid gap-2">
          Gateway (اختیاری)
          <Input dir="ltr" placeholder="192.0.2.1" {...form.register("gateway")} />
        </label>
      </div>
    );
  return (
    <div className="grid gap-3">
      {action === "sdwanHealth.create" && (
        <label className="grid gap-2">
          سرور بررسی ping
          <Input
            dir="ltr"
            placeholder="192.0.2.1 یا probe.example.com"
            {...form.register("probeServer", { required: "سرور بررسی را وارد کنید." })}
          />
        </label>
      )}
      <label className="grid gap-2">
        {action === "sdwanRule.create"
          ? "شناسهٔ اعضا به ترتیب اولویت"
          : "شناسهٔ اعضای مورد بررسی (اختیاری)"}
        <Input
          dir="ltr"
          placeholder={action === "sdwanRule.create" ? "2, 1" : "0"}
          {...form.register("sdwanMembers", {
            required: action === "sdwanRule.create" ? "حداقل یک عضو انتخاب کنید." : false,
          })}
        />
        <Select
          label="افزودن عضو از موجودی قبلی"
          disabled={busy}
          value=""
          onValueChange={(v) => append("sdwanMembers", v)}
          options={rows("sdwanMembers").map((r) => ({
            value: String(r.id ?? r.name),
            label: `${r.id ?? r.name} · ${r.interface ?? ""}`,
            icon: <Network size={15} />,
          }))}
        />
        <span className="text-xs text-muted-foreground">
          {action === "sdwanRule.create"
            ? "قانون دستی ساخته می‌شود؛ اولین شناسه بالاترین اولویت را دارد."
            : "خالی یا صفر یعنی همهٔ اعضا. ساخت بررسی به معنی سالم‌بودن مسیرها نیست."}
        </span>
      </label>
      {action === "sdwanRule.create" &&
        (
          [
            ["srcAddresses", "مرجع آدرس مبدأ"],
            ["dstAddresses", "مرجع آدرس مقصد"],
          ] as const
        ).map(([field, label]) => (
          <label key={field} className="grid gap-2">
            {label}
            <Input dir="ltr" placeholder="all" {...form.register(field)} />
            <Select
              label={`افزودن ${label}`}
              disabled={busy}
              value=""
              onValueChange={(v) => append(field, v)}
              options={[
                { value: "all", label: "همه (all)" },
                ...rows("addresses")
                  .concat(rows("addressGroups"))
                  .map((r) => ({
                    value: String(r.name),
                    label: String(r.name),
                    icon: <Activity size={15} />,
                  })),
              ]}
            />
            <span className="text-xs text-muted-foreground">
              نام مرجع موجود، جداشده با ویرگول؛ مقدار خالی معادل all است.
            </span>
          </label>
        ))}
    </div>
  );
}

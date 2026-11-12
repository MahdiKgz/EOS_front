"use client";
import { useState } from "react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { Network } from "lucide-react";
import type { FortiActionInput, FortiCollection } from "@/entities/device";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
export function FortigateVdomFields({
  form,
  collection,
  busy,
}: {
  form: UseFormReturn<FortiActionInput>;
  collection?: FortiCollection | null;
  busy: boolean;
}) {
  const action = useWatch({ control: form.control, name: "action" }),
    [short, setShort] = useState(false),
    [description, setDescription] = useState(false);
  if (action === "vdom.moveInterface")
    return (
      <div className="grid gap-3">
        <label className="grid gap-2">
          VDOM مقصد
          <Controller
            control={form.control}
            name="targetVdom"
            rules={{ required: "VDOM مقصد را انتخاب کنید." }}
            render={({ field }) => (
              <Select
                label="VDOM مقصد"
                disabled={busy}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={(collection?.tables.find((t) => t.key === "vdoms")?.rows ?? []).map(
                  (row) => ({
                    value: String(row.name),
                    label: String(row.name),
                    icon: <Network size={15} />,
                  }),
                )}
                emptyMessage="ابتدا قابلیت‌های تجهیز را تازه‌سازی کنید؛ مقصد باید از قبل وجود داشته باشد."
              />
            )}
          />
        </label>
        <p className="text-xs leading-6 text-muted-foreground">
          رابط به VDOM مقصد منتقل می‌شود. اگر رابط در تنظیمات دیگر استفاده شده باشد، دستگاه انتقال
          را رد می‌کند؛ وابستگی‌ها خودکار پاک نمی‌شوند.
        </p>
      </div>
    );
  if (action === "vdom.update")
    return (
      <div className="grid gap-3">
        <p className="text-xs text-muted-foreground">
          فیلدهای موردنظر را انتخاب کنید. مقدار خالی در فیلد انتخاب‌شده، آن مقدار را پاک می‌کند؛
          فیلد انتخاب‌نشده حفظ می‌شود.
        </p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={short}
            disabled={busy}
            onChange={(e) => {
              setShort(e.target.checked);
              if (e.target.checked) form.setValue("vdomShortName", "");
              else form.unregister("vdomShortName");
            }}
          />
          تغییر نام کوتاه
        </label>
        {short && (
          <label className="grid gap-2">
            نام کوتاه
            <Input
              maxLength={11}
              {...form.register("vdomShortName", {
                maxLength: { value: 11, message: "نام کوتاه حداکثر ۱۱ نویسه باشد." },
              })}
            />
          </label>
        )}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={description}
            disabled={busy}
            onChange={(e) => {
              setDescription(e.target.checked);
              if (e.target.checked) form.setValue("vdomDescription", "");
              else form.unregister("vdomDescription");
            }}
          />
          تغییر توضیح
        </label>
        {description && (
          <label className="grid gap-2">
            توضیح
            <Input
              maxLength={127}
              {...form.register("vdomDescription", {
                maxLength: { value: 127, message: "توضیح حداکثر ۱۲۷ نویسه باشد." },
              })}
            />
          </label>
        )}
      </div>
    );
  return (
    <p className="text-xs leading-6 text-muted-foreground">
      {action === "vdom.create"
        ? "VDOM تازه در حالت چندـVDOM موجود ساخته می‌شود؛ حالت عمومی دستگاه خودکار تغییر نمی‌کند. تأیید داخلی ساخت توسط دستگاه، در همان اجرای تأییدشده پاسخ داده می‌شود."
        : "VDOM ریشه یا مدیریت قابل حذف نیست. در پیش‌نمایش، تعداد رابط‌ها و حساب‌های مرتبط نمایش داده می‌شود؛ دستگاه وابستگی‌های مانع را کنترل می‌کند و هیچ مرجعی خودکار پاک نمی‌شود."}
    </p>
  );
}

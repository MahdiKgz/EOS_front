"use client";
import { useState } from "react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";
import { KeyRound, RefreshCw } from "lucide-react";
import { useDeviceSecretsQuery, type FortiActionInput } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { DeviceSecretLibrary } from "./device-secret-library";
export function FortigateAdminFields({
  form,
  busy,
}: {
  form: UseFormReturn<FortiActionInput>;
  busy: boolean;
}) {
  const action = useWatch({ control: form.control, name: "action" }),
    [library, setLibrary] = useState(false);
  const query = useDeviceSecretsQuery(undefined, { skip: action !== "admin.create" });
  return (
    <div className="grid gap-3">
      <p className="text-xs text-muted-foreground">
        تنظیم حساب‌ها و دسترسی مدیریتی در سطح کل تجهیز است. قطع ارتباط به معنی موفقیت عملیات نیست.
      </p>
      {action.endsWith(".create") && (
        <>
          <label className="grid gap-2">
            پروفایل دسترسی
            <Input
              dir="ltr"
              placeholder="prof_admin"
              {...form.register("adminProfile", {
                required: "نام پروفایل را وارد کنید.",
                maxLength: 35,
              })}
            />
            <span className="text-xs text-muted-foreground">
              نام دقیق پروفایل موجود؛ وجود آن از دستگاه بررسی می‌شود.
            </span>
          </label>
          <label className="grid gap-2">
            VDOMهای حساب
            <Input dir="ltr" placeholder="root" {...form.register("accountVdoms")} />
            <span className="text-xs text-muted-foreground">
              با ویرگول جدا کنید؛ مقدار خالی معادل root است.
            </span>
          </label>
        </>
      )}
      {action === "admin.create" && (
        <>
          <div className="flex items-center justify-between">
            <span>گذرواژه از مخزن شخصی</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="تازه‌سازی گذرواژه‌ها"
                disabled={busy || query.isFetching}
                onClick={() => void query.refetch()}
              >
                <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setLibrary(true)}
              >
                <KeyRound size={15} />
                مدیریت گذرواژه‌ها
              </Button>
            </div>
          </div>
          <Controller
            control={form.control}
            name="adminSecretId"
            rules={{ required: "گذرواژهٔ ذخیره‌شده را انتخاب کنید." }}
            render={({ field }) => (
              <Select
                label="گذرواژهٔ حساب مدیریتی"
                disabled={busy || query.isLoading}
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={(query.data ?? [])
                  .filter((item) => item.purpose === "admin_password")
                  .map((item) => ({
                    value: item.id,
                    label: item.name,
                    icon: <KeyRound size={15} />,
                  }))}
                emptyMessage={
                  query.isLoading ? "در حال دریافت…" : "ابتدا یک گذرواژه در مخزن شخصی ذخیره کنید."
                }
              />
            )}
          />
          {query.error && (
            <p role="alert" className="text-xs text-destructive">
              {apiErrorMessage(query.error)}
            </p>
          )}
        </>
      )}
      {action === "apiUser.create" && (
        <p className="text-xs text-muted-foreground">
          این عملیات فقط پیکربندی حساب API را می‌سازد. کلید API تولید یا نمایش داده نمی‌شود.
        </p>
      )}
      {action === "admin.trusthost" && (
        <label className="grid gap-2">
          آدرس یا شبکهٔ مجاز ورود (trusthost1)
          <Input
            dir="ltr"
            placeholder="192.0.2.0/24"
            {...form.register("value", { required: "آدرس مجاز را وارد کنید." })}
          />
        </label>
      )}
      {action === "admin.disable" && (
        <p className="text-xs text-muted-foreground">
          روش‌های console، GUI، SSH و Telnet غیرفعال می‌شوند. این فرمان به FortiOS ۸ یا جدیدتر نیاز
          دارد؛ نسخهٔ زنده قبل از ساخت پیش‌نمایش بررسی می‌شود.
        </p>
      )}
      {action === "management.httpsPort" && (
        <label className="grid gap-2">
          پورت HTTPS مدیریت
          <Input
            dir="ltr"
            inputMode="numeric"
            {...form.register("value", {
              required: "پورت را وارد کنید.",
              validate: (v) =>
                (/^\d+$/.test(v) && +v >= 1 && +v <= 65535) || "پورت باید بین ۱ تا ۶۵۵۳۵ باشد.",
            })}
          />
        </label>
      )}
      {action === "management.disableService" && (
        <>
          <label className="grid gap-2">
            سرویس مدیریتی
            <Controller
              control={form.control}
              name="value"
              rules={{ required: "سرویس را انتخاب کنید." }}
              render={({ field }) => (
                <Select
                  label="سرویس مدیریتی"
                  disabled={busy}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  options={[
                    { value: "telnet", label: "Telnet" },
                    { value: "ssh-v1", label: "SSH نسخهٔ ۱" },
                    { value: "ssh-password", label: "ورود SSH با گذرواژه" },
                    { value: "scp", label: "SCP" },
                  ]}
                />
              )}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            برای برداشتن دسترسی HTTP، HTTPS یا SSH از یک رابط، در تب رابط‌ها «دسترسی مدیریتی رابط»
            را انتخاب کنید.
          </p>
        </>
      )}
      {library && (
        <DeviceSecretLibrary
          purpose="admin_password"
          onClose={() => setLibrary(false)}
          onSaved={(item) => form.setValue("adminSecretId", item.id, { shouldValidate: true })}
        />
      )}
    </div>
  );
}

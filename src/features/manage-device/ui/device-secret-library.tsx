"use client";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { KeyRound, LoaderCircle, Pencil, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useDeviceSecretsQuery,
  useSaveDeviceSecretMutation,
  useDeleteDeviceSecretMutation,
  type DeviceSecret,
} from "@/entities/device";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/api/error-message";
export function DeviceSecretLibrary({
  purpose,
  onClose,
  onSaved,
}: {
  purpose: DeviceSecret["purpose"];
  onClose: () => void;
  onSaved: (secret: DeviceSecret) => void;
}) {
  const [open, setOpen] = useState(true),
    [editing, setEditing] = useState<DeviceSecret>(),
    [removing, setRemoving] = useState<DeviceSecret>(),
    [error, setError] = useState("");
  const query = useDeviceSecretsQuery(),
    [save, saving] = useSaveDeviceSecretMutation(),
    [remove, deleting] = useDeleteDeviceSecretMutation();
  const busy = saving.isLoading || deleting.isLoading,
    formId = useId(),
    lock = useRef(false);
  const form = useForm<{ name: string; value: string }>({ defaultValues: { name: "", value: "" } });
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatedDialog
      open={open}
      title={purpose === "admin_password" ? "گذرواژه‌های مدیریتی من" : "کلیدهای پیش‌اشتراکی من"}
      description="مقدار رمزنگاری می‌شود و دوباره نمایش داده نمی‌شود. هنگام ویرایش باید مقدار را دوباره وارد کنید."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex flex-wrap gap-2">
          <Button type="submit" form={formId} disabled={busy || !!removing}>
            {busy && <LoaderCircle size={15} className="animate-spin" />}
            {editing ? "ذخیرهٔ تغییرات" : "ذخیرهٔ مورد جدید"}
          </Button>
          {editing && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setEditing(undefined);
                form.reset({ name: "", value: "" });
              }}
            >
              انصراف از ویرایش
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-4 text-sm">
        <div className="flex items-center justify-between">
          <span>مخزن شخصی</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label="تازه‌سازی مخزن"
            disabled={busy || query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
        {query.isLoading && <p role="status">در حال دریافت…</p>}
        {query.error && (
          <p role="alert" className="text-destructive">
            {apiErrorMessage(query.error)}
          </p>
        )}
        {!query.isLoading &&
          !query.error &&
          !query.data?.some((item) => item.purpose === purpose) && (
            <p className="text-muted-foreground">هنوز موردی ذخیره نکرده‌اید.</p>
          )}
        {query.data
          ?.filter((item) => item.purpose === purpose)
          .map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border p-2">
              <KeyRound size={16} />
              <span className="flex-1">{item.name}</span>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`ویرایش ${item.name}`}
                disabled={busy}
                onClick={() => {
                  setEditing(item);
                  setRemoving(undefined);
                  form.reset({ name: item.name, value: "" });
                  setError("");
                }}
              >
                <Pencil size={15} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`حذف ${item.name}`}
                disabled={busy}
                onClick={() => {
                  setRemoving(item);
                  setError("");
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          ))}
        {removing && (
          <div className="grid gap-2 rounded-lg border border-destructive p-3">
            <p>
              «{removing.name}» حذف شود؟ پیش‌نمایش‌هایی که از آن استفاده کرده‌اند قابل اجرا نخواهند
              بود.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  setError("");
                  try {
                    await remove({ id: removing.id, revision: removing.revision }).unwrap();
                    if (editing?.id === removing.id) {
                      setEditing(undefined);
                      form.reset({ name: "", value: "" });
                    }
                    setRemoving(undefined);
                    toast.success("حذف شد.");
                  } catch (e) {
                    setError(apiErrorMessage(e));
                  } finally {
                    lock.current = false;
                  }
                }}
              >
                تأیید حذف
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setRemoving(undefined)}>
                انصراف
              </Button>
            </div>
          </div>
        )}
        <form
          id={formId}
          className="grid gap-3"
          onSubmit={(event) => {
            event.stopPropagation();
            void form.handleSubmit(async (values) => {
              if (lock.current || removing) return;
              lock.current = true;
              setError("");
              try {
                const result = await save({
                  id: editing?.id,
                  body: {
                    ...values,
                    name: values.name.trim(),
                    purpose,
                    revision: editing?.revision,
                  },
                }).unwrap();
                form.reset({ name: "", value: "" });
                setEditing(undefined);
                onSaved(result);
                toast.success("در مخزن شخصی ذخیره شد.");
              } catch (e) {
                setError(apiErrorMessage(e));
              } finally {
                lock.current = false;
              }
            })(event);
          }}
        >
          <fieldset disabled={busy} className="grid gap-3">
            <label className="grid gap-2">
              نام
              <Input
                autoComplete="off"
                {...form.register("name", {
                  required: "نام را وارد کنید.",
                  validate: (v) => v.trim().length >= 2 || "نام حداقل دو نویسه باشد.",
                  maxLength: { value: 120, message: "نام حداکثر ۱۲۰ نویسه باشد." },
                })}
              />
            </label>
            <label className="grid gap-2">
              {purpose === "admin_password" ? "گذرواژه" : "کلید پیش‌اشتراکی"}
              <Input
                type="password"
                autoComplete="new-password"
                dir="ltr"
                {...form.register("value", {
                  required: "مقدار را وارد کنید.",
                  maxLength: { value: 2048, message: "مقدار حداکثر ۲۰۴۸ نویسه باشد." },
                  validate: (v) => !/\p{Cc}/u.test(v) || "نویسهٔ کنترلی مجاز نیست.",
                })}
              />
            </label>
          </fieldset>
          {Object.entries(form.formState.errors).map(([key, value]) => (
            <p key={key} className="text-destructive text-xs">
              {value.message}
            </p>
          ))}
        </form>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </div>
    </AnimatedDialog>,
    document.body,
  );
}

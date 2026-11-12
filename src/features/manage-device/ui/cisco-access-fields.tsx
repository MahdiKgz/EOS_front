"use client";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { KeyRound, LoaderCircle, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCiscoEnableCredentialsQuery,
  useSaveCiscoEnableCredentialMutation,
  useDeleteCiscoEnableCredentialMutation,
  type CiscoAccessOptions,
  type EnableCredential,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Select } from "@/shared/ui/select";
export const defaultCiscoAccess: CiscoAccessOptions = {
  compatibilityProfile: "modern",
  enableCredentialId: null,
};
export function CiscoAccessFields({
  value = defaultCiscoAccess,
  onChange,
  disabled = false,
  needsOwnCredential = false,
  onBusyChange,
}: {
  value?: CiscoAccessOptions;
  onChange: (value: CiscoAccessOptions) => void;
  disabled?: boolean;
  needsOwnCredential?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const query = useCiscoEnableCredentialsQuery();
  const [library, setLibrary] = useState(false);
  return (
    <section className="grid gap-3 rounded-lg border p-3 text-sm">
      <h3 className="flex items-center gap-2 font-medium">
        <ShieldCheck size={16} />
        دسترسی Cisco
      </h3>
      <label className="grid gap-2">
        پروفایل SSH
        <Select
          label="پروفایل SSH در Cisco"
          value={value.compatibilityProfile}
          onValueChange={(profile) =>
            onChange({
              ...value,
              compatibilityProfile: profile as CiscoAccessOptions["compatibilityProfile"],
            })
          }
          disabled={disabled}
          options={[
            {
              value: "modern",
              label: "استاندارد",
              description: "الگوریتم‌های پیش‌فرض SSH",
              icon: <ShieldCheck size={16} />,
            },
            {
              value: "legacy_cisco",
              label: "سازگاری با Cisco قدیمی",
              description: "اجازهٔ صریح الگوریتم‌های قدیمی برای همین تجهیز",
              icon: <KeyRound size={16} />,
            },
          ]}
        />
      </label>
      {value.compatibilityProfile === "legacy_cisco" && (
        <p className="text-xs text-muted-foreground">
          الگوریتم‌های قدیمی RSA، SHA-1 و CBC فقط برای اتصال این تجهیز مجاز می‌شوند. بررسی کلید
          میزبان همچنان الزامی است.
        </p>
      )}
      <div className="flex items-center justify-between gap-2">
        <span>اعتبارنامهٔ جداگانهٔ enable</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={disabled}
          onClick={() => {
            setLibrary(true);
            onBusyChange?.(true);
          }}
        >
          <KeyRound size={14} />
          مدیریت اعتبارنامه‌ها
        </Button>
      </div>
      <Select
        label="اعتبارنامه enable"
        value={value.enableCredentialId ?? ""}
        onValueChange={(id) => onChange({ ...value, enableCredentialId: id || null })}
        disabled={disabled || query.isFetching}
        options={[
          { value: "", label: "بدون اعتبارنامهٔ enable" },
          ...(query.data ?? []).map((item) => ({
            value: item.id,
            label: item.name,
            icon: <KeyRound size={15} />,
          })),
        ]}
      />
      {query.isLoading && <p role="status">در حال دریافت اعتبارنامه‌ها…</p>}
      {query.error && (
        <div className="flex items-center justify-between gap-2" role="alert">
          <span>{apiErrorMessage(query.error)}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="دریافت دوبارهٔ اعتبارنامه‌های enable"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={15} />
          </Button>
        </div>
      )}
      {!query.isFetching && !query.error && !query.data?.length && (
        <p className="text-xs text-muted-foreground">
          اعتبارنامهٔ enable ذخیره نشده است. از مدیریت اعتبارنامه‌ها یک مورد بسازید.
        </p>
      )}
      {needsOwnCredential && (
        <p role="alert" className="text-xs text-destructive">
          اعتبارنامهٔ فعلی متعلق به کاربر دیگری است. برای تغییر تنظیمات یا اجرای اتصال، اعتبارنامهٔ
          خودتان را انتخاب کنید.
        </p>
      )}
      <p className="text-xs leading-6 text-muted-foreground">
        اگر ورود SSH در سطح کاربر باشد، گذرواژهٔ enable برای رسیدن به سطح مدیریتی استفاده می‌شود.
        این گذرواژه از رمز ورود SSH مستقل است و در ترمینال دستی ارسال خودکار نمی‌شود.
      </p>
      {library &&
        createPortal(
          <EnableLibrary
            onClose={() => {
              setLibrary(false);
              onBusyChange?.(false);
            }}
            onSaved={(id) => onChange({ ...value, enableCredentialId: id })}
            onDeleted={(id) => {
              if (id === value.enableCredentialId) onChange({ ...value, enableCredentialId: null });
            }}
          />,
          document.body,
        )}
    </section>
  );
}
function EnableLibrary({
  onClose,
  onSaved,
  onDeleted,
}: {
  onClose: () => void;
  onSaved: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const editorId = useId();
  const [open, setOpen] = useState(true),
    [editing, setEditing] = useState<EnableCredential | "new" | null>(null),
    [deleting, setDeleting] = useState<EnableCredential | null>(null);
  const [editorBusy, setEditorBusy] = useState(false),
    lock = useRef(false);
  const [remove, { isLoading: removing }] = useDeleteCiscoEnableCredentialMutation();
  const query = useCiscoEnableCredentialsQuery();
  const busy = editorBusy || removing;
  return (
    <AnimatedDialog
      open={open}
      title="اعتبارنامه‌های enable"
      description="گذرواژه‌ها رمزگذاری می‌شوند و دوباره نمایش داده نمی‌شوند."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        editing ? (
          <div className="flex gap-2">
            <Button type="submit" form={editorId} disabled={busy}>
              {editorBusy && <LoaderCircle size={15} className="animate-spin" />}ذخیره
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              انصراف
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        <div className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              setEditing("new");
              setDeleting(null);
            }}
          >
            <Plus size={15} />
            اعتبارنامه جدید
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="دریافت دوبارهٔ اعتبارنامه‌ها"
            disabled={busy || query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
          </Button>
        </div>
        {query.error && <p role="alert">{apiErrorMessage(query.error)}</p>}
        {query.isLoading && <p role="status">در حال دریافت…</p>}
        {!query.isFetching && !query.error && !query.data?.length && (
          <p className="text-sm text-muted-foreground">اعتبارنامه‌ای ذخیره نشده است.</p>
        )}
        {query.data?.map((item) => (
          <div
            className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
            key={item.id}
          >
            <span>{item.name}</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`ویرایش ${item.name}`}
                disabled={busy}
                onClick={() => {
                  setEditing(item);
                  setDeleting(null);
                }}
              >
                <Pencil size={15} />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`حذف ${item.name}`}
                disabled={busy}
                onClick={() => {
                  setDeleting(item);
                  setEditing(null);
                }}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          </div>
        ))}
        {deleting && (
          <div className="grid gap-3 rounded-lg border border-destructive p-3 text-sm" role="alert">
            <p>
              اعتبارنامهٔ «{deleting.name}» حذف شود؟ تأیید اتصال و برنامهٔ پایش تجهیزات وابسته
              بی‌اعتبار می‌شود.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={async () => {
                  if (lock.current) return;
                  lock.current = true;
                  try {
                    await remove(deleting.id).unwrap();
                    onDeleted(deleting.id);
                    setDeleting(null);
                    toast.success("اعتبارنامه حذف شد.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  } finally {
                    lock.current = false;
                  }
                }}
              >
                {removing && <LoaderCircle size={15} className="animate-spin" />}حذف
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setDeleting(null)}
              >
                انصراف
              </Button>
            </div>
          </div>
        )}
        {editing && (
          <EnableEditor
            key={editing === "new" ? "new" : editing.id}
            formId={editorId}
            credential={editing === "new" ? undefined : editing}
            onBusy={setEditorBusy}
            onSaved={(id) => {
              onSaved(id);
              setEditing(null);
            }}
          />
        )}
      </div>
    </AnimatedDialog>
  );
}
function EnableEditor({
  credential,
  onBusy,
  onSaved,
  formId,
}: {
  credential?: EnableCredential;
  onBusy: (busy: boolean) => void;
  onSaved: (id: string) => void;
  formId: string;
}) {
  const form = useForm<{ name: string; password: string }>({
      defaultValues: { name: credential?.name ?? "", password: "" },
    }),
    lock = useRef(false);
  const [save, { isLoading }] = useSaveCiscoEnableCredentialMutation();
  return (
    <form
      id={formId}
      className="grid gap-4 border-t pt-4 text-sm"
      onSubmit={(event) =>
        void form.handleSubmit(async (body) => {
          if (lock.current) return;
          lock.current = true;
          onBusy(true);
          try {
            const request = save({ id: credential?.id, body });
            let result;
            try {
              result = await request.unwrap();
            } finally {
              request.reset();
            }
            form.reset();
            onSaved(result.id);
            toast.success("اعتبارنامه ذخیره شد.");
          } catch (error) {
            form.setError("root", { message: apiErrorMessage(error) });
          } finally {
            lock.current = false;
            onBusy(false);
          }
        })(event)
      }
    >
      <fieldset disabled={isLoading} className="grid gap-3">
        <label className="grid gap-2">
          نام اعتبارنامه
          <Input
            {...form.register("name", {
              required: "نام الزامی است.",
              minLength: { value: 2, message: "نام حداقل دو نویسه باشد." },
              maxLength: 120,
            })}
          />
        </label>
        <label className="grid gap-2">
          گذرواژهٔ enable
          <PasswordInput
            autoComplete="new-password"
            {...form.register("password", {
              required: "گذرواژه الزامی است.",
              maxLength: 1024,
              validate: (value) => !/[\r\n\0]/.test(value) || "گذرواژه باید در یک خط باشد.",
            })}
          />
        </label>
        {credential && (
          <p className="text-xs text-muted-foreground">برای ویرایش، گذرواژه را دوباره وارد کنید.</p>
        )}
      </fieldset>
      {Object.entries(form.formState.errors).map(([key, error]) => (
        <p key={key} role="alert" className="text-destructive">
          {error?.message}
        </p>
      ))}
    </form>
  );
}

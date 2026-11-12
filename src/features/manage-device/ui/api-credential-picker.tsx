"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { KeyRound, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useApiCredentialsQuery,
  useSaveApiCredentialMutation,
  useDeleteApiCredentialMutation,
  type ApiCredential,
  type ApiCredentialInput,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Select } from "@/shared/ui/select";

export function ApiCredentialPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const query = useApiCredentialsQuery();
  const [library, setLibrary] = useState(false);
  return (
    <div className="grid gap-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span>اعتبارنامهٔ API</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          disabled={disabled}
          onClick={() => setLibrary(true)}
        >
          <KeyRound size={15} />
          مدیریت اعتبارنامه‌ها
        </Button>
      </div>
      <Select
        label="اعتبارنامهٔ API"
        value={value}
        onValueChange={onChange}
        options={(query.data ?? []).map((item) => ({
          value: item.id,
          label: item.name,
          description: item.username,
          icon: <KeyRound size={16} />,
        }))}
        disabled={disabled || query.isFetching}
        placeholder={query.isFetching ? "در حال دریافت…" : "انتخاب اعتبارنامه"}
        emptyMessage="اعتبارنامه‌ای موجود نیست؛ از مدیریت اعتبارنامه‌ها یک مورد بسازید."
      />
      {query.error && (
        <div role="alert">
          <p>{apiErrorMessage(query.error)}</p>
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            تلاش دوباره
          </Button>
        </div>
      )}
      <p className="text-xs leading-6 text-muted-foreground">
        حساب کاربری باید به API و موجودی تجهیز دسترسی داشته باشد. اتصال با HTTPS بررسی می‌شود. برای
        گواهی اختصاصی، گواهی عمومی PEM را هنگام ساخت اعتبارنامه وارد کنید.
      </p>
      {library &&
        createPortal(
          <ApiCredentialDialog onClose={() => setLibrary(false)} onSaved={onChange} />,
          document.body,
        )}
    </div>
  );
}
function ApiCredentialDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [open, setOpen] = useState(true),
    [editing, setEditing] = useState<ApiCredential | "new" | null>(null),
    [deleting, setDeleting] = useState<ApiCredential | null>(null),
    [busy, setBusy] = useState(false);
  const query = useApiCredentialsQuery();
  const [remove, removing] = useDeleteApiCredentialMutation();
  const locked = busy || removing.isLoading;
  return (
    <AnimatedDialog
      open={open}
      title="اعتبارنامه‌های API"
      description="گذرواژه رمزنگاری می‌شود. ویرایش اعتبارنامه به ورود دوبارهٔ اطلاعات اتصال نیاز دارد."
      busy={locked}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        editing ? (
          <div className="flex gap-2">
            <Button type="submit" form="api-credential-form" disabled={locked}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}ذخیره اعتبارنامه
            </Button>
            <Button variant="outline" disabled={locked} onClick={() => setEditing(null)}>
              انصراف
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        <Button
          className="w-fit"
          variant="outline"
          disabled={locked}
          onClick={() => {
            setEditing("new");
            setDeleting(null);
          }}
        >
          <Plus size={16} />
          اعتبارنامه جدید
        </Button>
        {query.isLoading && <p role="status">در حال دریافت…</p>}
        {query.error && <p role="alert">{apiErrorMessage(query.error)}</p>}
        {!query.isFetching && !query.data?.length && (
          <p className="text-sm text-muted-foreground">هنوز اعتبارنامه‌ای ثبت نشده است.</p>
        )}
        {query.data?.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
          >
            <div>
              {item.name}
              <small className="mt-1 block text-muted-foreground">
                <bdi>{item.username}</bdi>
              </small>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                aria-label={`ویرایش ${item.name}`}
                disabled={locked}
                onClick={() => {
                  setEditing(item);
                  setDeleting(null);
                }}
              >
                <Pencil size={15} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`حذف ${item.name}`}
                disabled={locked}
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
            <p>اعتبارنامهٔ «{deleting.name}» حذف شود؟ تأیید اتصال تجهیزات وابسته پاک می‌شود.</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={locked}
                onClick={async () => {
                  try {
                    await remove(deleting.id).unwrap();
                    setDeleting(null);
                    toast.success("اعتبارنامه حذف شد.");
                  } catch (error) {
                    toast.error(apiErrorMessage(error));
                  }
                }}
              >
                {removing.isLoading ? "در حال حذف…" : "حذف اعتبارنامه"}
              </Button>
              <Button variant="outline" disabled={locked} onClick={() => setDeleting(null)}>
                انصراف
              </Button>
            </div>
          </div>
        )}
        {editing && (
          <ApiCredentialEditor
            key={editing === "new" ? "new" : editing.id}
            credential={editing === "new" ? undefined : editing}
            onBusy={setBusy}
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
function ApiCredentialEditor({
  credential,
  onBusy,
  onSaved,
}: {
  credential?: ApiCredential;
  onBusy: (value: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const form = useForm<ApiCredentialInput>({
    defaultValues: {
      name: credential?.name ?? "",
      username: credential?.username ?? "",
      password: "",
      caCertificate: "",
      tlsFingerprint: "",
    },
  });
  const submitting = useRef(false);
  const [save] = useSaveApiCredentialMutation();
  return (
    <form
      id="api-credential-form"
      className="grid gap-4 border-t pt-4"
      onSubmit={(event) => {
        void form.handleSubmit(async (body) => {
          if (submitting.current) return;
          submitting.current = true;
          onBusy(true);
          try {
            const result = await save({ id: credential?.id, body }).unwrap();
            form.reset();
            onSaved(result.id);
            toast.success("اعتبارنامه ذخیره شد.");
          } catch (error) {
            form.setError("root", { message: apiErrorMessage(error) });
          } finally {
            submitting.current = false;
            onBusy(false);
          }
        })(event);
      }}
    >
      <fieldset
        disabled={form.formState.isSubmitting}
        className="grid gap-4 text-sm sm:grid-cols-2"
      >
        <label className="grid gap-2">
          نام اعتبارنامه
          <Input
            {...form.register("name", {
              required: "نام اعتبارنامه الزامی است.",
              minLength: { value: 2, message: "نام حداقل دو نویسه باشد." },
              maxLength: 120,
            })}
          />
        </label>
        <label className="grid gap-2">
          نام کاربری
          <Input
            dir="ltr"
            autoComplete="off"
            {...form.register("username", { required: "نام کاربری الزامی است.", maxLength: 128 })}
          />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          گذرواژه
          <PasswordInput
            className="h-10"
            autoComplete="new-password"
            {...form.register("password", { required: "گذرواژه الزامی است.", maxLength: 1024 })}
          />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          اثر انگشت SHA-256 گواهی Sophos، اختیاری
          <Input
            dir="ltr"
            autoComplete="off"
            placeholder="SHA256:..."
            {...form.register("tlsFingerprint", { maxLength: 103 })}
          />
          <small className="text-muted-foreground">
            اثر انگشت کامل گواهی را از دستگاه یا مدیر شبکه بگیرید. برای Sophos می‌توانید آن را به
            جای گواهی عمومی وارد کنید. ESXi و MikroTik از گواهی عمومی یا مراجع مورد اعتماد سرور
            استفاده می‌کنند.
          </small>
        </label>
        <label className="grid gap-2 sm:col-span-2">
          گواهی عمومی CA یا هاست، اختیاری
          <textarea
            className="rounded-md border bg-background p-3 text-xs"
            dir="ltr"
            rows={5}
            autoComplete="off"
            spellCheck={false}
            placeholder="-----BEGIN CERTIFICATE-----"
            {...form.register("caCertificate", { maxLength: 16384 })}
          />
          <small className="text-muted-foreground">
            خالی باشد، گواهی با مراجع مورد اعتماد سرور بررسی می‌شود. هنگام ویرایش، گواهی اختصاصی را
            دوباره وارد کنید.
          </small>
        </label>
      </fieldset>
      {Object.entries(form.formState.errors).map(([key, error]) => (
        <p key={key} role="alert" className="text-sm text-destructive">
          {error?.message}
        </p>
      ))}
    </form>
  );
}

"use client";
import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { KeyRound, LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  useSnmpCredentialsQuery,
  useSaveSnmpCredentialMutation,
  useDeleteSnmpCredentialMutation,
  type SnmpCredential,
  type SnmpCredentialInput,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Select } from "@/shared/ui/select";

export function SnmpCredentialDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState<SnmpCredential | "new" | null>(null);
  const [deleting, setDeleting] = useState<SnmpCredential | null>(null);
  const [busy, setBusy] = useState(false);
  const query = useSnmpCredentialsQuery();
  const [remove, removal] = useDeleteSnmpCredentialMutation();
  const blocked = busy || removal.isLoading;
  return (
    <AnimatedDialog
      open={open}
      title="اعتبارنامه‌های SNMPv3"
      description="کلیدهای احراز هویت و رمزنگاری با AES ذخیره می‌شوند و دوباره نمایش داده نمی‌شوند."
      busy={blocked}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        editing ? (
          <div className="flex gap-2">
            <Button form="snmp-secret-form" type="submit" disabled={blocked}>
              {busy && <LoaderCircle className="animate-spin" size={16} />}ذخیره اعتبارنامه
            </Button>
            <Button variant="outline" disabled={blocked} onClick={() => setEditing(null)}>
              انصراف
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="grid gap-4">
        {query.isLoading ? (
          <p role="status">در حال دریافت اعتبارنامه‌ها…</p>
        ) : query.error ? (
          <div role="alert">
            <p>{apiErrorMessage(query.error)}</p>
            <Button variant="outline" onClick={() => void query.refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : (
          <>
            <Button
              className="w-fit"
              variant="outline"
              disabled={blocked}
              onClick={() => {
                setEditing("new");
                setDeleting(null);
              }}
            >
              <Plus size={16} />
              اعتبارنامه جدید
            </Button>
            {!query.data?.length && (
              <p className="text-sm text-muted-foreground">
                هنوز اعتبارنامهٔ SNMPv3 ثبت نکرده‌اید.
              </p>
            )}
            {query.data?.map((item) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                key={item.id}
              >
                <span className="flex items-center gap-2 text-sm">
                  <KeyRound size={16} />
                  <span>
                    {item.name}
                    <small className="mt-1 block text-muted-foreground">
                      <bdi>
                        {item.username} · {item.authProtocol} / AES
                      </bdi>
                    </small>
                  </span>
                </span>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`ویرایش ${item.name}`}
                    disabled={blocked}
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
                    disabled={blocked}
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
          </>
        )}
        {deleting && (
          <div className="grid gap-3 rounded-lg border border-destructive p-3" role="alert">
            <p className="text-sm">
              اعتبارنامهٔ «{deleting.name}» حذف شود؟ کانال‌های وابسته تا انتخاب اعتبارنامه و تست
              دوباره، تأییدشده نخواهند بود.
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                disabled={blocked}
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
                {removal.isLoading ? "در حال حذف…" : "حذف اعتبارنامه"}
              </Button>
              <Button variant="outline" disabled={blocked} onClick={() => setDeleting(null)}>
                انصراف
              </Button>
            </div>
          </div>
        )}
        {editing && (
          <SnmpSecretForm
            key={editing === "new" ? "new" : editing.id}
            credential={editing === "new" ? undefined : editing}
            onBusy={setBusy}
            onSaved={(id) => {
              setEditing(null);
              onSaved?.(id);
            }}
          />
        )}
      </div>
    </AnimatedDialog>
  );
}
function SnmpSecretForm({
  credential,
  onBusy,
  onSaved,
}: {
  credential?: SnmpCredential;
  onBusy: (busy: boolean) => void;
  onSaved: (id: string) => void;
}) {
  const submitting = useRef(false);
  const [save] = useSaveSnmpCredentialMutation();
  const form = useForm<SnmpCredentialInput>({
    defaultValues: {
      name: credential?.name ?? "",
      username: credential?.username ?? "",
      authProtocol: credential?.authProtocol ?? "SHA",
      authPassword: "",
      privacyPassword: "",
    },
  });
  const busy = form.formState.isSubmitting;
  return (
    <form
      id="snmp-secret-form"
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
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm">
          نام اعتبارنامه
          <Input
            {...form.register("name", { required: "نام اعتبارنامه الزامی است.", maxLength: 120 })}
          />
        </label>
        <label className="grid gap-2 text-sm">
          نام کاربری SNMP
          <Input
            dir="ltr"
            autoComplete="off"
            {...form.register("username", {
              required: "نام کاربری الزامی است.",
              pattern: {
                value: /^[a-zA-Z0-9_.-]{1,64}$/,
                message: "نام کاربری SNMP معتبر وارد کنید.",
              },
            })}
          />
        </label>
        <div className="grid gap-2 text-sm">
          <label htmlFor="snmp-auth-protocol">احراز هویت</label>
          <Controller
            name="authProtocol"
            control={form.control}
            render={({ field }) => (
              <Select
                id="snmp-auth-protocol"
                label="الگوریتم احراز هویت"
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: "SHA", label: "SHA", icon: <KeyRound size={16} /> },
                  { value: "SHA256", label: "SHA-256", icon: <KeyRound size={16} /> },
                ]}
                disabled={busy}
              />
            )}
          />
        </div>
        <div className="grid content-center gap-1 text-sm">
          <span>رمزنگاری: AES-128</span>
          <small className="text-muted-foreground">سطح امنیت: authPriv</small>
        </div>
        <label className="grid gap-2 text-sm">
          گذرواژهٔ احراز هویت
          <PasswordInput
            className="h-10"
            autoComplete="new-password"
            {...form.register("authPassword", {
              required: "گذرواژهٔ احراز هویت الزامی است.",
              minLength: { value: 8, message: "گذرواژه‌ها حداقل ۸ نویسه باشند." },
              maxLength: 1024,
            })}
          />
        </label>
        <label className="grid gap-2 text-sm">
          گذرواژهٔ رمزنگاری
          <PasswordInput
            className="h-10"
            autoComplete="new-password"
            {...form.register("privacyPassword", {
              required: "گذرواژهٔ رمزنگاری الزامی است.",
              minLength: { value: 8, message: "گذرواژه‌ها حداقل ۸ نویسه باشند." },
              maxLength: 1024,
            })}
          />
        </label>
      </fieldset>
      {credential && (
        <p className="text-xs text-muted-foreground">
          برای ویرایش، هر دو گذرواژه را دوباره وارد کنید. کانال‌های وابسته به تست دوباره نیاز خواهند
          داشت.
        </p>
      )}
      {Object.entries(form.formState.errors).map(([key, error]) => (
        <p key={key} role="alert" className="text-sm text-destructive">
          {error?.message}
        </p>
      ))}
    </form>
  );
}

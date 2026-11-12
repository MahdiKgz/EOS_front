"use client";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/shared/api/error-message";
import {
  type DeviceCredential,
  useDeviceCredentialsQuery,
  useSaveSshCredentialMutation,
  useDeleteSshCredentialMutation,
} from "@/entities/device";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

type CredentialFields = {
  libraryName: string;
  libraryUsername: string;
  libraryHostKey: string;
  libraryPassword: string;
  libraryPrivateKey: string;
};

export function CredentialLibrary({
  onSaved,
  onDeleted,
  disabled = false,
  createOnOpen = false,
  onBusyChange,
}: {
  onSaved?: (id: string) => void;
  onDeleted?: (id: string) => void;
  disabled?: boolean;
  createOnOpen?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { data, error: loadError, isFetching, refetch } = useDeviceCredentialsQuery();
  const [editing, setEditing] = useState<DeviceCredential | null | undefined>(
    createOnOpen ? null : undefined,
  );
  const [method, setMethod] = useState("password");
  const [pendingDelete, setPendingDelete] = useState<DeviceCredential>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<CredentialFields>({
    defaultValues: {
      libraryName: "",
      libraryUsername: "",
      libraryHostKey: "",
      libraryPassword: "",
      libraryPrivateKey: "",
    },
  });
  const [save] = useSaveSshCredentialMutation(),
    [removeCredential] = useDeleteSshCredentialMutation();
  function edit(item: DeviceCredential | null) {
    setEditing(item);
    setMethod("password");
    form.reset({
      libraryName: item?.name ?? "",
      libraryUsername: item?.username ?? "",
      libraryHostKey: "",
      libraryPassword: "",
      libraryPrivateKey: "",
    });
  }
  const lock = useRef(false);

  async function mutate(remove?: DeviceCredential) {
    if (lock.current) return;
    const value = (name: keyof CredentialFields) => form.getValues(name) ?? "";
    const body = {
      operation: "verify",
      name: value("libraryName").trim(),
      username: value("libraryUsername").trim(),
      hostKey: value("libraryHostKey").trim().split(/\s+/).slice(0, 2).join(" "),
      ...(method === "password"
        ? { password: value("libraryPassword") }
        : { privateKey: value("libraryPrivateKey") }),
    };
    if (
      !remove &&
      (!body.name ||
        !body.username ||
        !body.hostKey ||
        !("password" in body ? body.password : body.privateKey.trim()))
    ) {
      setError(
        "نام اعتبارنامه، نام کاربری، کلید عمومی میزبان و گذرواژه یا کلید خصوصی را وارد کنید.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const id = remove?.id ?? editing?.id;
      const result = remove
        ? await removeCredential(remove.id).unwrap()
        : await save({ id, body: { ...body, operation: "verify" } }).unwrap();
      if (remove) {
        onDeleted?.(remove.id);
        setPendingDelete(undefined);
        toast.success("اعتبارنامه حذف شد.");
      } else {
        setEditing(undefined);
        if ("id" in result) onSaved?.(result.id);
        form.reset();
        toast.success("اعتبارنامه ذخیره شد.");
      }
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <section
      aria-label="مدیریت اعتبارنامه‌ها"
      className="grid gap-3 text-sm"
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          event.target instanceof HTMLInputElement &&
          editing !== undefined
        ) {
          event.preventDefault();
          event.stopPropagation();
          if (!busy && !disabled) void form.handleSubmit(() => mutate())();
        }
      }}
    >
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={busy || disabled}
        onClick={() => {
          edit(null);
          setPendingDelete(undefined);
          setError("");
        }}
      >
        ساخت اعتبارنامه
      </Button>
      {isFetching && <p role="status">در حال دریافت اعتبارنامه‌ها…</p>}
      {loadError && (
        <Button type="button" variant="outline" onClick={() => void refetch()}>
          تلاش دوباره برای دریافت اعتبارنامه‌ها
        </Button>
      )}
      {!isFetching && data?.length === 0 && (
        <p className="text-muted-foreground">اعتبارنامه‌ای ثبت نشده است.</p>
      )}
      {data?.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
          <span className="me-auto">
            {item.name} · <bdi>{item.username}</bdi>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || disabled}
            onClick={() => {
              edit(item);
              setPendingDelete(undefined);
              setError("");
            }}
          >
            ویرایش
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy || disabled}
            onClick={() => {
              setPendingDelete(item);
              setEditing(undefined);
              setError("");
            }}
          >
            حذف
          </Button>
        </div>
      ))}
      {pendingDelete && (
        <div className="grid gap-2 rounded-lg border p-3">
          <p>اعتبارنامه «{pendingDelete.name}» حذف و از تجهیزات مرتبط جدا شود؟</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              disabled={busy || disabled}
              onClick={() => void mutate(pendingDelete)}
            >
              تأیید حذف
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setPendingDelete(undefined)}
            >
              انصراف
            </Button>
          </div>
        </div>
      )}
      {editing !== undefined && (
        <div key={editing?.id ?? "new"} className="grid gap-2 rounded-lg border p-3">
          <label>
            نام اعتبارنامه
            <Input {...form.register("libraryName")} maxLength={120} disabled={busy || disabled} />
          </label>
          <label>
            نام کاربری SSH
            <Input
              {...form.register("libraryUsername")}
              dir="ltr"
              maxLength={64}
              disabled={busy || disabled}
            />
          </label>
          <label>
            کلید عمومی میزبان
            <Input
              {...form.register("libraryHostKey")}
              dir="ltr"
              maxLength={2048}
              placeholder="ssh-ed25519 AAAA…"
              disabled={busy || disabled}
            />
          </label>
          <label className="grid gap-1">
            روش احراز هویت
            <Select
              label="روش احراز هویت"
              value={method}
              onValueChange={setMethod}
              disabled={busy || disabled}
              options={[
                { value: "password", label: "گذرواژه", icon: <KeyRound size={16} /> },
                { value: "key", label: "کلید خصوصی", icon: <KeyRound size={16} /> },
              ]}
            />
          </label>
          {method === "password" ? (
            <label className="grid gap-1">
              گذرواژه SSH
              <Input
                type="password"
                {...form.register("libraryPassword")}
                dir="ltr"
                maxLength={1024}
                autoComplete="new-password"
                disabled={busy || disabled}
              />
            </label>
          ) : (
            <label className="grid gap-1">
              کلید خصوصی بدون عبارت عبور
              <textarea
                className="rounded-md border bg-background p-2"
                {...form.register("libraryPrivateKey")}
                dir="ltr"
                rows={3}
                maxLength={12000}
                autoComplete="off"
                spellCheck={false}
                disabled={busy || disabled}
              />
            </label>
          )}
          <Button
            type="button"
            className="w-fit"
            disabled={busy || disabled}
            onClick={() => void form.handleSubmit(() => mutate())()}
          >
            {busy && <LoaderCircle size={16} className="animate-spin" />}
            {busy ? "در حال ذخیره…" : "ذخیره اعتبارنامه"}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}

export function CredentialLibraryDialog({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  return (
    <AnimatedDialog
      open={open}
      title="مدیریت اعتبارنامه‌ها"
      description="ساخت، ویرایش و حذف اعتبارنامه‌های SSH حساب کاربری"
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
    >
      <CredentialLibrary onBusyChange={setBusy} />
    </AnimatedDialog>
  );
}

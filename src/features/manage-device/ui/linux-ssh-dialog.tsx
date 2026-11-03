"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Device } from "@/entities/device";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";

const options = [
  { value: "verify", label: "تأیید ورود مدیریتی" },
  { value: "interfaces", label: "رابط‌ها و آدرس‌های شبکه" },
  { value: "monitoring", label: "وضعیت حافظه، دیسک و بار سیستم" },
  { value: "backup", label: "نسخه تنظیمات پایه شبکه" },
  { value: "diagnostics", label: "مسیرها و پورت‌های در حال شنود" },
];
type Result = { output: string; checkedAt: string; saved?: boolean };

export function LinuxSshDialog({ device, onClose }: { device: Device; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [operation, setOperation] = useState("verify");
  const [useSaved, setUseSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>();
  const lock = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const fields = new FormData(event.currentTarget);
    lock.current = true;
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const response = await fetch(`/api/devices/${device.id}/linux-ssh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation,
          ...(useSaved
            ? { useSaved: true }
            : {
                saveConnection: fields.get("saveConnection") === "on",
                username: String(fields.get("username") ?? "").trim(),
                hostKey: String(fields.get("hostKey") ?? "")
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .join(" "),
                privateKey: String(fields.get("privateKey") ?? ""),
              }),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          typeof data.message === "string" ? data.message : "اطلاعات اتصال را بررسی کنید.",
        );
      setResult(data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "عملیات SSH انجام نشد.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function download(output: string) {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `device-${device.id}-network-config.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <AnimatedDialog
      open={open}
      title={`مدیریت SSH · ${device.name}`}
      description="کلید عمومی میزبان را از منبع مورد اعتماد بگیرید. در صورت انتخاب ذخیره، اتصال پس از تأیید ورود رمزنگاری و ثبت می‌شود."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
    >
      <form onSubmit={(event) => void submit(event)} autoComplete="off">
        <fieldset disabled={busy} className="grid gap-3 text-sm">
          <Select
            label="عملیات SSH"
            options={options}
            value={operation}
            onValueChange={(value) => {
              setOperation(value);
              setResult(undefined);
              setError("");
            }}
            disabled={busy}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useSaved}
              onChange={(event) => {
                setUseSaved(event.target.checked);
                setResult(undefined);
                setError("");
              }}
            />
            استفاده از اتصال ذخیره‌شده
          </label>
          {!useSaved && (
            <>
              <label className="grid gap-1">
                نام کاربری SSH
                <Input dir="ltr" name="username" required maxLength={64} />
              </label>
              <label className="grid gap-1">
                کلید عمومی میزبان
                <Input
                  dir="ltr"
                  name="hostKey"
                  required
                  maxLength={2048}
                  placeholder="ssh-ed25519 AAAA…"
                />
              </label>
              <label className="grid gap-1">
                کلید خصوصی بدون عبارت عبور
                <textarea
                  name="privateKey"
                  dir="ltr"
                  required
                  maxLength={12000}
                  spellCheck={false}
                  rows={3}
                  className="rounded-md border bg-background p-2 font-mono"
                />
              </label>
              {operation === "verify" && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="saveConnection" />
                  ذخیره اتصال پس از تأیید
                </label>
              )}
            </>
          )}
          <Button type="submit" className="w-fit">
            {busy ? "در حال اجرای عملیات…" : "اجرا"}
          </Button>
        </fieldset>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-4 grid gap-2" role="status">
          <p className="text-sm">
            {result.saved
              ? "اتصال تأیید و ذخیره شد."
              : operation === "verify"
                ? "ورود مدیریتی به Linux تأیید شد."
                : "داده از تجهیز دریافت شد."}
          </p>
          <pre dir="ltr" className="max-h-64 overflow-auto rounded-md bg-background p-3 text-xs">
            {result.output}
          </pre>
          {operation === "backup" && (
            <Button className="w-fit" variant="outline" onClick={() => download(result.output)}>
              دانلود نسخه تنظیمات
            </Button>
          )}
        </div>
      )}
    </AnimatedDialog>
  );
}

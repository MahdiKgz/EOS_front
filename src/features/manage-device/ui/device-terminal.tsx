"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import type { Terminal } from "@xterm/xterm";
import type { FitAddon } from "@xterm/addon-fit";
import {
  ArrowLeft,
  Eraser,
  LoaderCircle,
  PlugZap,
  Power,
  RefreshCw,
  TerminalSquare,
} from "lucide-react";
import {
  useTerminalInfoQuery,
  usePreviewTerminalMutation,
  useOpenTerminalMutation,
  useReadTerminalMutation,
  useInputTerminalMutation,
  useResizeTerminalMutation,
  useCloseTerminalMutation,
  type TerminalPreview,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import "@xterm/xterm/css/xterm.css";

type Phase = "idle" | "checking" | "connecting" | "connected" | "recovering" | "closed";
const labels: Record<Phase, string> = {
  idle: "آمادهٔ اتصال",
  checking: "در حال بررسی…",
  connecting: "در حال اتصال…",
  connected: "متصل",
  recovering: "دریافت دوبارهٔ خروجی…",
  closed: "نشست بسته است",
};
const reasons: Record<string, string> = {
  user_disconnected: "اتصال به درخواست شما قطع شد.",
  remote_closed: "تجهیز نشست را بست.",
  browser_disconnected: "ارتباط مرورگر با نشست قطع شد.",
  idle_timeout: "نشست به‌دلیل نداشتن ورودی پایان یافت.",
  session_expired: "مهلت نشست پایان یافت.",
  authorization_changed: "دسترسی یا تنظیمات اتصال تغییر کرد.",
  service_stopped: "سرویس دوباره راه‌اندازی شد.",
  TERMINAL_OUTPUT_LIMIT: "حجم خروجی به سقف نشست رسید.",
};

export function DeviceTerminal({ id }: { id: string }) {
  const info = useTerminalInfoQuery(id);
  const [prepare, preparing] = usePreviewTerminalMutation(),
    [open, opening] = useOpenTerminalMutation();
  const [read] = useReadTerminalMutation(),
    [input] = useInputTerminalMutation();
  const [resize] = useResizeTerminalMutation(),
    [close] = useCloseTerminalMutation();
  const [state, setState] = useState<Phase>("idle"),
    [error, setError] = useState(""),
    [reason, setReason] = useState("");
  const [preview, setPreview] = useState<TerminalPreview>(),
    [confirmOpen, setConfirmOpen] = useState(false);
  const [paste, setPaste] = useState<string>(),
    [pasteOpen, setPasteOpen] = useState(false),
    [ready, setReady] = useState(false);
  const screen = useRef<HTMLDivElement>(null),
    term = useRef<Terminal | null>(null),
    fit = useRef<FitAddon | null>(null);
  const mounted = useRef(false),
    generation = useRef(0),
    phase = useRef<Phase>("idle");
  const live = useRef<{ id: string; cursor: number; sequence: number } | null>(null),
    pending = useRef("");
  const inputTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    queue = useRef(Promise.resolve());
  const change = useCallback((next: Phase) => {
    phase.current = next;
    if (mounted.current) setState(next);
    if (term.current) term.current.options.disableStdin = next !== "connected";
  }, []);
  const stop = useCallback(async () => {
    generation.current++;
    const session = live.current;
    live.current = null;
    pending.current = "";
    if (inputTimer.current) {
      clearTimeout(inputTimer.current);
      inputTimer.current = null;
    }
    if (session)
      await close({ deviceId: id, sessionId: session.id })
        .unwrap()
        .catch(() => {});
  }, [close, id]);
  const send = useCallback(
    (data: string) => {
      const session = live.current;
      if (!session || phase.current !== "connected") return;
      if (new TextEncoder().encode(data).length > 32768) {
        setError("ورودی نباید بیشتر از ۳۲ کیلوبایت باشد.");
        return;
      }
      queue.current = queue.current.then(async () => {
        if (live.current !== session) return;
        const request = input({
          deviceId: id,
          sessionId: session.id,
          sequence: ++session.sequence,
          data,
        });
        try {
          await request.unwrap();
        } catch (e) {
          if (live.current === session) {
            setError(apiErrorMessage(e));
            change("closed");
            void stop();
          }
        } finally {
          request.reset();
        }
      });
    },
    [id, input, change, stop],
  );
  const enqueue = useCallback(
    (data: string) => {
      if (!live.current || phase.current !== "connected") return;
      if (data.length > 4096 || (data.length > 1 && /[\r\n]/.test(data))) {
        if (pending.current) {
          send(pending.current);
          pending.current = "";
        }
        setPaste(data);
        setPasteOpen(true);
        return;
      }
      pending.current += data;
      if (new TextEncoder().encode(pending.current).length > 32768) {
        pending.current = "";
        setError("حجم ورودی بیش از حد مجاز است.");
        return;
      }
      if (!inputTimer.current)
        inputTimer.current = setTimeout(() => {
          const bytes = pending.current;
          pending.current = "";
          inputTimer.current = null;
          send(bytes);
        }, 70);
    },
    [send],
  );
  useEffect(() => {
    mounted.current = true;
    let disposed = false;
    const box = screen.current;
    let observer: ResizeObserver | undefined, subscription: { dispose: () => void } | undefined;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    void Promise.all([import("@xterm/xterm"), import("@xterm/addon-fit")])
      .then(([{ Terminal }, { FitAddon }]) => {
        if (disposed || !box) return;
        const css = getComputedStyle(box);
        const terminal = new Terminal({
          cursorBlink: true,
          scrollback: 2000,
          fontSize: 14,
          fontFamily: "monospace",
          disableStdin: true,
          allowProposedApi: false,
          theme: {
            background: css.getPropertyValue("--background").trim(),
            foreground: css.getPropertyValue("--foreground").trim(),
            cursor: css.getPropertyValue("--primary").trim(),
          },
          linkHandler: { activate: () => {} },
        });
        const addon = new FitAddon();
        terminal.loadAddon(addon);
        terminal.open(box);
        term.current = terminal;
        fit.current = addon;
        terminal.parser.registerOscHandler(52, () => true);
        subscription = terminal.onData(enqueue);
        observer = new ResizeObserver(() => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (disposed || box.clientWidth < 40 || box.clientHeight < 40) return;
            addon.fit();
            terminal.resize(
              Math.max(20, Math.min(240, terminal.cols)),
              Math.max(5, Math.min(80, terminal.rows)),
            );
            const session = live.current;
            if (session && phase.current === "connected")
              void resize({
                deviceId: id,
                sessionId: session.id,
                cols: terminal.cols,
                rows: terminal.rows,
              })
                .unwrap()
                .catch(() => {});
          }, 150);
        });
        observer.observe(box);
        setReady(true);
      })
      .catch(() => {
        if (!disposed) setError("بارگذاری نمایشگر ترمینال انجام نشد. صفحه را تازه کنید.");
      });
    const pagehide = () => {
      void stop();
    };
    window.addEventListener("pagehide", pagehide);
    return () => {
      disposed = true;
      mounted.current = false;
      void stop();
      observer?.disconnect();
      clearTimeout(resizeTimer);
      subscription?.dispose();
      term.current?.dispose();
      term.current = null;
      fit.current = null;
      window.removeEventListener("pagehide", pagehide);
    };
  }, [id, enqueue, resize, stop]);
  const busy = preparing.isLoading || opening.isLoading;
  const active = state === "connected" || state === "recovering";
  async function previewConnection() {
    if (busy || live.current) return;
    setError("");
    setReason("");
    change("checking");
    const token = ++generation.current;
    try {
      const result = await prepare(id).unwrap();
      if (mounted.current && generation.current === token) {
        setPreview(result);
        setConfirmOpen(true);
        change("idle");
      }
    } catch (e) {
      if (mounted.current && generation.current === token) {
        setError(apiErrorMessage(e));
        change("idle");
      }
    }
  }
  async function connect() {
    if (!preview || busy || live.current) return;
    change("connecting");
    setError("");
    const token = ++generation.current;
    try {
      const result = await open({
        deviceId: id,
        previewId: preview.previewId,
        cols: term.current?.cols ?? 80,
        rows: term.current?.rows ?? 24,
      }).unwrap();
      if (!mounted.current || generation.current !== token) {
        await close({ deviceId: id, sessionId: result.id });
        return;
      }
      const session = { id: result.id, cursor: 0, sequence: 0 };
      live.current = session;
      queue.current = Promise.resolve();
      term.current?.reset();
      change("connected");
      setConfirmOpen(false);
      void info.refetch();
      term.current?.focus();
      let failures = 0;
      while (mounted.current && live.current === session) {
        const request = read({ deviceId: id, sessionId: session.id, cursor: session.cursor });
        try {
          const chunk = await request.unwrap();
          if (live.current !== session) break;
          failures = 0;
          change("connected");
          if (chunk.truncated) {
            term.current?.reset();
            term.current?.writeln("[Earlier output left the session buffer]");
          }
          if (chunk.data) {
            const bytes = Uint8Array.from(atob(chunk.data), (c) => c.charCodeAt(0));
            await new Promise<void>((resolve) =>
              term.current ? term.current.write(bytes, resolve) : resolve(),
            );
          }
          session.cursor = chunk.cursor;
          if (chunk.state === "closed" && !chunk.hasMore) {
            live.current = null;
            change("closed");
            setReason(
              reasons[chunk.reason ?? ""] ?? "نشست پایان یافت؛ برای ادامه دوباره متصل شوید.",
            );
            void info.refetch();
            break;
          }
        } catch (e) {
          if (live.current !== session) break;
          const status = (e as { status?: unknown }).status;
          if (++failures >= 3 || (typeof status === "number" && status < 500)) {
            setError(apiErrorMessage(e));
            change("closed");
            void stop();
            break;
          }
          change("recovering");
        } finally {
          request.reset();
        }
        await new Promise((resolve) => setTimeout(resolve, document.hidden ? 1500 : 1000));
      }
    } catch (e) {
      if (mounted.current && generation.current === token) {
        change("closed");
        setConfirmOpen(false);
        setError(apiErrorMessage(e));
        toast.error(apiErrorMessage(e));
      }
    }
  }
  return (
    <main className="mx-auto grid w-full min-w-0 max-w-6xl gap-4 p-4 sm:p-8">
      <Link
        href={`/dashboard/assets/devices/${id}`}
        className="inline-flex items-center gap-1 justify-self-end text-sm text-primary"
      >
        بازگشت <ArrowLeft size={16} />
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <TerminalSquare size={20} /> ترمینال تجهیز
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {info.data?.device.name ?? "در حال دریافت اطلاعات…"}
          </p>
        </div>
        <span role="status" className="text-sm text-primary">
          {labels[state]}
        </span>
      </header>
      {info.error ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm">
          <p>{apiErrorMessage(info.error)}</p>
          <Button variant="outline" disabled={info.isFetching} onClick={() => void info.refetch()}>
            <RefreshCw size={16} />
            تلاش دوباره
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <bdi className="break-all font-mono text-xs">
              {info.data
                ? `${info.data.username ?? "SSH"}@${info.data.device.host}:${info.data.device.port}`
                : "SSH / CLI"}
            </bdi>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                aria-label="پاک کردن نمای ترمینال"
                disabled={!ready}
                onClick={() => term.current?.clear()}
              >
                <Eraser size={16} />
              </Button>
              {active ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    change("closed");
                    setReason(reasons.user_disconnected);
                    void stop().then(() => info.refetch());
                  }}
                >
                  <Power size={16} />
                  قطع اتصال
                </Button>
              ) : (
                <Button
                  disabled={
                    !ready || busy || !info.data?.supported || !info.data.credentialsConfigured
                  }
                  onClick={() => void previewConnection()}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <PlugZap size={16} />
                  )}
                  بررسی و اتصال
                </Button>
              )}
            </div>
          </div>
          <section
            aria-label="ترمینال SSH"
            dir="ltr"
            className="min-w-0 overflow-hidden rounded-xl border bg-background p-2"
          >
            <div ref={screen} className="h-[min(60dvh,600px)] min-h-64 w-full min-w-0" />
          </section>
          <div dir="ltr" aria-label="کلیدهای کمکی ترمینال" className="flex flex-wrap gap-2">
            {[
              ["Ctrl+C", "\u0003"],
              ["Tab", "\t"],
              ["Esc", "\u001b"],
              ["↑", "\u001b[A"],
              ["↓", "\u001b[B"],
              ["Ctrl+D", "\u0004"],
            ].map(([label, data]) => (
              <Button
                key={label}
                variant="outline"
                disabled={state !== "connected"}
                onClick={() => {
                  enqueue(data);
                  term.current?.focus();
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          {!info.isLoading && info.data && !info.data.credentialsConfigured && (
            <p className="text-sm text-muted-foreground">
              ابتدا از مدیریت SSH تجهیز، اعتبارنامه و کلید هویت را ذخیره کنید.
            </p>
          )}
          <p className="text-xs leading-7 text-muted-foreground">
            فرمان‌ها با سطح دسترسی حساب تجهیز اجرا می‌شوند. با خروج از صفحه نشست قطع می‌شود. فقط
            شروع و پایان نشست در سوابق ذخیره می‌شود.
          </p>
          {reason && (
            <p role="status" className="text-sm">
              {reason}
            </p>
          )}
          <section className="rounded-xl border bg-card p-4">
            <h2 className="mb-3 font-semibold">سوابق نشست‌ها</h2>
            {!info.data?.events.length ? (
              <p className="text-sm text-muted-foreground">هنوز نشستی ثبت نشده است.</p>
            ) : (
              <ul className="grid gap-3 text-xs">
                {info.data.events.map((event) => (
                  <li key={event.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                    <span>
                      {
                        {
                          requested: "درخواست اتصال",
                          connected: "اتصال برقرار شد",
                          closed: "نشست بسته شد",
                        }[event.action]
                      }{" "}
                      · {event.actorName}
                      {event.reason ? ` · ${reasons[event.reason] ?? "اتصال پایان یافت"}` : ""}
                    </span>
                    <time dateTime={event.occurredAt}>
                      {new Date(event.occurredAt).toLocaleString("fa-IR")}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {preview && (
        <ConfirmTerminal
          open={confirmOpen}
          preview={preview}
          busy={opening.isLoading}
          onClose={() => setConfirmOpen(false)}
          onExited={() => setPreview(undefined)}
          onConnect={() => void connect()}
        />
      )}
      {paste !== undefined && (
        <PasteTerminal
          open={pasteOpen}
          value={paste}
          onClose={() => setPasteOpen(false)}
          onExited={() => setPaste(undefined)}
          onSend={(data) => {
            send(data);
            setPasteOpen(false);
            term.current?.focus();
          }}
        />
      )}
    </main>
  );
}

function ConfirmTerminal({
  open,
  preview,
  busy,
  onClose,
  onExited,
  onConnect,
}: {
  open: boolean;
  preview: TerminalPreview;
  busy: boolean;
  onClose: () => void;
  onExited: () => void;
  onConnect: () => void;
}) {
  const form = useForm<{ confirmed: boolean }>({ defaultValues: { confirmed: false } });
  const confirmed = useWatch({ control: form.control, name: "confirmed" });
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const delay = Math.max(0, new Date(preview.expiresAt).getTime() - Date.now());
    const timer = setTimeout(() => setExpired(true), delay);
    return () => clearTimeout(timer);
  }, [preview.expiresAt]);
  return (
    <AnimatedDialog
      open={open}
      title="اتصال به ترمینال تجهیز"
      description="مقصد و حساب SSH ذخیره‌شده را بررسی کنید."
      busy={busy}
      onClose={onClose}
      onExited={onExited}
      footer={
        <div className="flex gap-2">
          <Button form="terminal-confirm" type="submit" disabled={busy || expired || !confirmed}>
            {busy ? "در حال اتصال…" : "تأیید و اتصال"}
          </Button>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            انصراف
          </Button>
        </div>
      }
    >
      <form
        id="terminal-confirm"
        className="grid gap-4 text-sm"
        onSubmit={form.handleSubmit(onConnect)}
      >
        <strong>{preview.device.name}</strong>
        <bdi className="break-all font-mono text-xs">
          {preview.username}@{preview.device.host}:{preview.device.port}
        </bdi>
        <p className="text-muted-foreground">اثر انگشت کلید هویت ثبت‌شده</p>
        <bdi className="break-all font-mono text-xs">{preview.fingerprint}</bdi>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            disabled={busy || expired}
            {...form.register("confirmed", { required: "مقصد اتصال را تأیید کنید." })}
          />
          اتصال به این تجهیز را تأیید می‌کنم.
        </label>
        {form.formState.errors.confirmed && (
          <p role="alert" className="text-destructive">
            {form.formState.errors.confirmed.message}
          </p>
        )}
        {expired && (
          <p role="alert" className="text-destructive">
            پیش‌نمایش منقضی شد؛ پنجره را ببندید و دوباره بررسی کنید.
          </p>
        )}
      </form>
    </AnimatedDialog>
  );
}
function PasteTerminal({
  open,
  value,
  onClose,
  onExited,
  onSend,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onExited: () => void;
  onSend: (data: string) => void;
}) {
  const form = useForm<{ data: string }>({ defaultValues: { data: value } });
  return (
    <AnimatedDialog
      open={open}
      title="ارسال متن به ترمینال"
      description="متن چندخطی ممکن است بلافاصله روی تجهیز اجرا شود. پیش از ارسال آن را بررسی کنید."
      onClose={onClose}
      onExited={onExited}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="terminal-paste">
            ارسال متن
          </Button>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
        </div>
      }
    >
      <form id="terminal-paste" onSubmit={form.handleSubmit(({ data }) => onSend(data))}>
        <textarea
          dir="ltr"
          className="min-h-48 w-full rounded-lg border bg-background p-3 font-mono text-xs"
          {...form.register("data", {
            required: true,
            validate: (data) =>
              new TextEncoder().encode(data).length <= 32768 || "حداکثر حجم ورودی ۳۲ کیلوبایت است.",
          })}
        />
        {form.formState.errors.data && (
          <p role="alert" className="text-sm text-destructive">
            {form.formState.errors.data.message ?? "متن را وارد کنید."}
          </p>
        )}
      </form>
    </AnimatedDialog>
  );
}

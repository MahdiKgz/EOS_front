"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Activity, Globe2, KeyRound, LoaderCircle, Terminal } from "lucide-react";
import toast from "react-hot-toast";
import {
  useConfigureDeviceChannelMutation,
  useDeviceCredentialsQuery,
  useSnmpCredentialsQuery,
  useApiCredentialsQuery,
  channelMethods,
  type ChannelInput,
  type DeviceChannels,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { CredentialLibraryDialog } from "./credential-library";
import { ApiCredentialPicker } from "./api-credential-picker";
import { SnmpCredentialDialog } from "./snmp-credential-dialog";

export function DeviceChannelDialog({
  id,
  data,
  host,
  onClose,
}: {
  id: string;
  data: DeviceChannels;
  host: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true),
    [library, setLibrary] = useState(false);
  const groupId = useId(),
    formId = useId(),
    reduced = useReducedMotion();
  const initial = data.secondary;
  const initialConfiguration =
    initial && data.availableMethods.includes(initial.method) ? initial : undefined;
  const initialMethod = initialConfiguration?.method ?? data.availableMethods[0] ?? "snmpv3";
  const submitting = useRef(false);
  const form = useForm<ChannelInput>({
    defaultValues: {
      revision: initial?.revision,
      method: initialMethod,
      credentialId: initialConfiguration?.credentialId ?? "",
      host: initial?.host ?? "",
      port: initialConfiguration?.port ?? channelMethods[initialMethod].port,
      priority: initial?.priority ?? 2,
    },
  });
  const method = useWatch({ control: form.control, name: "method" });
  const ssh = useDeviceCredentialsQuery(undefined, { skip: method !== "ssh" });
  const snmp = useSnmpCredentialsQuery(undefined, { skip: method !== "snmpv3" });
  const isApi = method === "soap_api" || method === "rest_api";
  const api = useApiCredentialsQuery(undefined, { skip: !isApi });
  const credentials = isApi ? api : method === "ssh" ? ssh : snmp;
  const [save, saving] = useConfigureDeviceChannelMutation();
  const busy = saving.isLoading || form.formState.isSubmitting;
  return (
    <>
      <AnimatedDialog
        open={open}
        title="تنظیم کانال ثانویه"
        description="تنظیمات ابتدا ذخیره می‌شوند؛ فعال‌شدن کانال به تست موفق اتصال نیاز دارد."
        busy={busy}
        onClose={() => setOpen(false)}
        onExited={onClose}
        footer={
          <div className="flex gap-2">
            <Button type="submit" form={formId} disabled={busy || credentials.isFetching}>
              {busy && <LoaderCircle size={16} className="animate-spin" />}ذخیره تنظیمات
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
              انصراف
            </Button>
          </div>
        }
      >
        <form
          id={formId}
          className="grid gap-5"
          onSubmit={(event) => {
            void form.handleSubmit(async (body) => {
              if (submitting.current) return;
              submitting.current = true;
              try {
                await save({
                  id,
                  body: { ...body, host: body.host?.trim() || undefined },
                }).unwrap();
                toast.success("تنظیمات ذخیره شد؛ اتصال کانال را تست کنید.");
                setOpen(false);
              } catch (error) {
                form.setError("root", { message: apiErrorMessage(error) });
              } finally {
                submitting.current = false;
              }
            })(event);
          }}
        >
          <LayoutGroup id={groupId}>
            <div
              className="flex gap-2 rounded-lg border bg-background p-1"
              role="tablist"
              aria-label="روش اتصال ثانویه"
            >
              {data.availableMethods.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={method === item}
                  className="relative flex h-10 flex-1 items-center justify-center gap-2 rounded-md text-sm"
                  disabled={busy}
                  onClick={() => {
                    form.setValue("method", item);
                    form.setValue("credentialId", "");
                    form.setValue("port", channelMethods[item].port);
                  }}
                >
                  {method === item && (
                    <motion.span
                      className="absolute inset-0 rounded-md border border-primary bg-primary/10"
                      layoutId="channel-method"
                      transition={{ duration: reduced ? 0 : 0.35 }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {item === "ssh" ? (
                      <Terminal size={16} />
                    ) : item === "snmpv3" ? (
                      <Activity size={16} />
                    ) : (
                      <Globe2 size={16} />
                    )}
                    {channelMethods[item].label}
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>
          <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              آدرس کانال
              <Input
                dir="ltr"
                placeholder={host}
                autoComplete="off"
                {...form.register("host", { maxLength: 253 })}
              />
              <small className="text-muted-foreground">
                خالی باشد، آدرس مدیریت تجهیز استفاده می‌شود.
              </small>
            </label>
            <label className="grid content-start gap-2 text-sm">
              پورت
              <Input
                type="number"
                min={1}
                max={65535}
                dir="ltr"
                {...form.register("port", {
                  required: true,
                  valueAsNumber: true,
                  min: { value: 1, message: "پورت معتبر وارد کنید." },
                  max: { value: 65535, message: "پورت معتبر وارد کنید." },
                })}
              />
            </label>
            {isApi ? (
              <div className="sm:col-span-2">
                <Controller
                  name="credentialId"
                  control={form.control}
                  rules={{ required: "اعتبارنامهٔ کانال را انتخاب کنید." }}
                  render={({ field }) => (
                    <ApiCredentialPicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={busy}
                    />
                  )}
                />
              </div>
            ) : (
              <div className="grid gap-2 text-sm sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={`${formId}-credential`}>اعتبارنامهٔ ذخیره‌شده</label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    disabled={busy}
                    onClick={() => setLibrary(true)}
                  >
                    <KeyRound size={15} />
                    مدیریت اعتبارنامه‌ها
                  </Button>
                </div>
                {credentials.error ? (
                  <div role="alert">
                    <p>{apiErrorMessage(credentials.error)}</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void credentials.refetch()}
                    >
                      تلاش دوباره
                    </Button>
                  </div>
                ) : (
                  <Controller
                    name="credentialId"
                    control={form.control}
                    rules={{ required: "اعتبارنامهٔ کانال را انتخاب کنید." }}
                    render={({ field }) => (
                      <Select
                        id={`${formId}-credential`}
                        label="اعتبارنامه کانال"
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        options={(credentials.data ?? []).map((item) => ({
                          value: item.id,
                          label: item.name,
                          description: item.username,
                          icon: <KeyRound size={16} />,
                        }))}
                        disabled={busy || credentials.isFetching}
                        placeholder={
                          credentials.isFetching ? "در حال دریافت…" : "انتخاب اعتبارنامه"
                        }
                        emptyMessage="اعتبارنامه‌ای موجود نیست؛ از مدیریت اعتبارنامه‌ها یک مورد بسازید."
                      />
                    )}
                  />
                )}
              </div>
            )}
            <div className="grid gap-2 text-sm sm:col-span-2">
              <label htmlFor={`${formId}-priority`}>اولویت منبع گردآوری</label>
              <Controller
                name="priority"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id={`${formId}-priority`}
                    label="اولویت کانال"
                    value={String(field.value)}
                    onValueChange={(value) => field.onChange(Number(value))}
                    options={[
                      { value: "2", label: "اولویت دوم؛ پس از کانال اصلی" },
                      { value: "1", label: "اولویت اول؛ برای گردآوری خواندنی" },
                    ]}
                    disabled={busy}
                  />
                )}
              />
            </div>
          </fieldset>
          <p className="text-xs leading-6 text-muted-foreground">
            {method === "snmpv3"
              ? "دسترسی UDP به پورت SNMP و کاربر authPriv با SHA یا SHA-256 و AES باید روی تجهیز فعال باشد. تست، نام سیستم، زمان روشن‌بودن و تعداد رابط‌ها را می‌خواند."
              : method === "ssh"
                ? "SSH روی هاست ESXi باید فعال باشد. اعتبارنامه شامل گذرواژه یا کلید خصوصی و کلید عمومی معتبر میزبان است. پورت API برای این اتصال استفاده نمی‌شود."
                : method === "soap_api"
                  ? "SOAP از موجودی هاست ESXi با HTTPS استفاده می‌کند. پورت و گواهی این کانال مستقل از اتصال SSH اصلی است."
                  : "RouterOS 7، فعال‌بودن www-ssl و مجوزهای rest-api/read لازم است. این کانال موجودی را با HTTPS می‌خواند."}
          </p>
          {Object.entries(form.formState.errors).map(([key, error]) => (
            <p key={key} role="alert" className="text-sm text-destructive">
              {error?.message}
            </p>
          ))}
        </form>
      </AnimatedDialog>
      {library &&
        (method === "snmpv3" ? (
          <SnmpCredentialDialog
            onClose={() => setLibrary(false)}
            onSaved={(value) => form.setValue("credentialId", value, { shouldValidate: true })}
          />
        ) : (
          <CredentialLibraryDialog
            onClose={() => {
              setLibrary(false);
              void ssh.refetch();
            }}
          />
        ))}
    </>
  );
}

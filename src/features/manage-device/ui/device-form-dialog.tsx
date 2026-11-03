"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Network, RefreshCw, Server } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  DeviceIcon,
  deviceTypeLabels,
  environmentLabels,
  type Device,
  type DeviceInput,
  type DeviceType,
  useCreateDeviceMutation,
  useDeviceCompaniesQuery,
  useDeviceCredentialsQuery,
  useUpdateDeviceMutation,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { CredentialLibrary } from "./credential-library";
import styles from "./device-form.module.css";
type FormValues = Omit<DeviceInput, "tags"> & { tagsText: string };
const vendors: Record<DeviceType, string> = {
  linux_edge: "Linux",
  esxi: "VMware",
  mikrotik: "MikroTik",
  fortigate: "Fortinet",
  pfsense: "Netgate",
  generic_syslog_source: "Generic",
  generic_firewall: "Generic",
  nvr: "Hikvision",
  dvr: "Dahua",
};
const families = [
  { value: "linux", label: "Linux", description: "سرور Linux با SSH", type: "linux_edge" },
  { value: "cisco", label: "Cisco", description: "Cisco IOS / IOS-XE", type: "generic_firewall" },
  { value: "fortinet", label: "FortiGate", description: "فایروال FortiGate", type: "fortigate" },
  { value: "mikrotik", label: "MikroTik", description: "MikroTik RouterOS", type: "mikrotik" },
  {
    value: "sophos",
    label: "Sophos Firewall",
    description: "Sophos Firewall XML API",
    type: "generic_firewall",
  },
  { value: "vmware", label: "VMware ESXi", description: "هاست VMware ESXi", type: "esxi" },
  { value: "netgate", label: "pfSense", description: "فایروال pfSense", type: "pfsense" },
  {
    value: "generic",
    label: "سایر سازنده‌ها",
    description: "تجهیز عمومی یا منبع Syslog",
    type: "generic_firewall",
  },
] as const;
function deviceInput(values: FormValues): DeviceInput {
  const { tagsText, ...rest } = values;
  return {
    name: rest.name.trim(),
    vendor: rest.vendor.trim(),
    type: rest.type,
    host: rest.host.trim(),
    managementPort: rest.managementPort,
    protocol: rest.protocol,
    environment: rest.environment,
    tags: [
      ...new Set(
        tagsText
          .split(/[,،]/)
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ],
  };
}

const steps = ["مشخصات و روش اتصال", "اعتبارنامه و تست اتصال", "بازبینی و ثبت نهایی"] as const;

export function DeviceFormDialog({ device, onClose }: { device?: Device; onClose: () => void }) {
  const [open, setOpen] = useState(true),
    [category, setCategory] = useState<"network" | "recorder">(
      device && ["nvr", "dvr"].includes(device.type) ? "recorder" : "network",
    );
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<{ device: DeviceInput; verified: boolean }>();
  const [testing, setTesting] = useState(false);
  const [companyId, setCompanyId] = useState(device?.companyId ?? "");
  const [credentialId, setCredentialId] = useState("");
  const [credentialMode, setCredentialMode] = useState<"existing" | "new" | "manage">("existing");
  const [credentialBusy, setCredentialBusy] = useState(false);
  const companies = useDeviceCompaniesQuery(undefined, { skip: !!device });
  const credentials = useDeviceCredentialsQuery(undefined, { skip: !!device });
  const selectedCompany =
    companies.data?.find((item) => item.id === companyId) ??
    (!companyId ? companies.data?.[0] : undefined);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const formId = useId();
  const reduced = useReducedMotion();
  const [create, { isLoading: creating }] = useCreateDeviceMutation();
  const [update, { isLoading: updating }] = useUpdateDeviceMutation();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    trigger,
    setValue,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormValues>({
    mode: "onChange",
    defaultValues: device
      ? { ...device, vendor: device.vendor.toLowerCase(), tagsText: device.tags.join(", ") }
      : {
          name: "",
          vendor: "linux",
          type: "linux_edge",
          host: "",
          managementPort: 22,
          protocol: "ssh",
          environment: "lab",
          tagsText: "",
        },
  });
  const type = useWatch({ control, name: "type" });
  const protocol = useWatch({ control, name: "protocol" });
  const isRecorder = (type === "nvr" || type === "dvr") && protocol === "api";
  const canTestSsh = type === "linux_edge" && protocol === "ssh";
  const canTest = canTestSsh || isRecorder;
  const recorderFields = useRef<HTMLDivElement>(null);
  const formBusy = creating || updating || isSubmitting || testing;
  const busy = formBusy || credentialBusy;

  function draftInput(values: FormValues): DeviceInput {
    return {
      ...deviceInput(values),
      ...(device
        ? {}
        : {
            companyId: selectedCompany?.id,
            accessRoute: "direct",
            credentialId: canTestSsh && credentialId ? credentialId : undefined,
          }),
    };
  }

  async function goToStep(next: number) {
    if (busy || next === step || (next === 2 && !review)) return;
    if (next > step && !(await trigger())) return;
    if (next > step && !selectedCompany) {
      setError("شرکت مالک تجهیز را انتخاب کنید.");
      return;
    }
    setError("");
    if (
      next > step &&
      review &&
      JSON.stringify(draftInput(getValues())) !== JSON.stringify(review.device)
    ) {
      setReview(undefined);
      setStep(1);
      return;
    }
    setStep(next);
  }

  async function reviewDevice(verify: boolean) {
    if (busy || lock.current || !(await trigger())) return;
    if (lock.current) return;
    const draft = draftInput(getValues());
    if (!draft.companyId) {
      setError("شرکت مالک تجهیز را انتخاب کنید.");
      return;
    }
    setError("");
    if (!verify) {
      setReview({ device: draft, verified: false });
      setStep(2);
      return;
    }
    if (!canTest) return;
    if (canTestSsh && !draft.credentialId) {
      setError("اعتبارنامه موجود را انتخاب کنید یا یک اعتبارنامه بسازید.");
      return;
    }
    const recorder = isRecorder
      ? {
          username:
            recorderFields.current
              ?.querySelector<HTMLInputElement>('[name="recorderUsername"]')
              ?.value.trim() ?? "",
          password:
            recorderFields.current?.querySelector<HTMLInputElement>('[name="recorderPassword"]')
              ?.value ?? "",
          https:
            recorderFields.current?.querySelector<HTMLInputElement>('[name="recorderHttps"]')
              ?.checked ?? false,
        }
      : undefined;
    if (recorder && (!recorder.username || !recorder.password)) {
      setError("نام کاربری و گذرواژه ضبط‌کننده را وارد کنید.");
      return;
    }
    lock.current = true;
    setTesting(true);
    try {
      const response = await fetch("/api/devices/draft-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device: draft,
          recorder,
        }),
      });
      const result = await response.json();
      if (!response.ok || result.verified !== true)
        throw new Error(
          typeof result.message === "string"
            ? result.message
            : "تست اتصال انجام نشد. اعتبارنامه را بررسی کنید.",
        );
      setReview({ device: draft, verified: true });
      setStep(2);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تست اتصال انجام نشد.");
    } finally {
      lock.current = false;
      setTesting(false);
    }
  }
  function chooseCategory(next: "network" | "recorder") {
    if (next === category) return;
    setCategory(next);
    setCredentialId("");
    setStep(0);
    setReview(undefined);
    setError("");
    chooseType(next === "recorder" ? "nvr" : "linux_edge");
  }
  function chooseType(type: DeviceType) {
    setValue("type", type, { shouldValidate: true });
    setValue("vendor", vendors[type].toLowerCase(), { shouldValidate: true });
    const protocol = ["nvr", "dvr", "esxi"].includes(type)
      ? "api"
      : type === "generic_syslog_source"
        ? "syslog"
        : "ssh";
    setValue("protocol", protocol, { shouldValidate: true });
    setValue(
      "managementPort",
      type === "nvr" || type === "dvr"
        ? 80
        : protocol === "api"
          ? 443
          : protocol === "syslog"
            ? 514
            : 22,
      {
        shouldValidate: true,
      },
    );
  }
  async function submit(values: FormValues) {
    if (testing || credentialBusy || lock.current || (!device && (step !== 2 || !review))) return;
    lock.current = true;
    setError("");
    const body = draftInput(values);
    try {
      if (device) await update({ id: device.id, body }).unwrap();
      else await create(body).unwrap();
      toast.success(device ? "اطلاعات تجهیز به‌روز شد." : "تجهیز در فهرست ثبت شد.");
      setOpen(false);
    } catch (err) {
      const message = apiErrorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      lock.current = false;
    }
  }
  return (
    <AnimatedDialog
      open={open}
      title={device ? "ویرایش تجهیز" : "افزودن تجهیز"}
      description="مشخصات تجهیز را برای ثبت در فهرست دارایی‌ها وارد کنید."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className={styles.actions}>
          {!device && step > 0 && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void goToStep(step - 1)}
            >
              مرحله قبل
            </Button>
          )}
          {!device && step === 0 && (
            <Button type="button" disabled={busy} onClick={() => void goToStep(1)}>
              ادامه
            </Button>
          )}
          {!device && step === 1 && (
            <>
              {canTest && (
                <Button type="button" disabled={busy} onClick={() => void reviewDevice(true)}>
                  {testing ? "در حال تست…" : "تست اتصال و ادامه"}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void reviewDevice(false)}
              >
                ادامه بدون تست
              </Button>
            </>
          )}
          {(device || step === 2) && (
            <Button form={formId} type="submit" disabled={!isValid || busy || !open}>
              {busy && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" />}
              {busy ? "در حال ذخیره…" : device ? "ذخیره تغییرات" : "ثبت نهایی تجهیز"}
            </Button>
          )}
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          void handleSubmit(submit)(event);
        }}
        noValidate
        aria-busy={busy}
      >
        <fieldset disabled={formBusy || !open} className={styles.fieldset}>
          {!device && (
            <LayoutGroup id={formId}>
              <div className={styles.tabs} role="tablist" aria-label="نوع ثبت تجهیز">
                {(
                  [
                    ["network", "تجهیز شبکه / سرور", Network],
                    ["recorder", "ضبط‌کننده NVR / DVR", Server],
                  ] as const
                ).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    disabled={busy}
                    aria-selected={category === key}
                    aria-controls={`${formId}-panel`}
                    id={`${formId}-${key}`}
                    tabIndex={category === key ? 0 : -1}
                    onClick={() => chooseCategory(key)}
                    onKeyDown={(event) => {
                      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                        event.preventDefault();
                        const next =
                          event.key === "Home"
                            ? "network"
                            : event.key === "End"
                              ? "recorder"
                              : category === "network"
                                ? "recorder"
                                : "network";
                        chooseCategory(next);
                        event.currentTarget.parentElement
                          ?.querySelector<HTMLButtonElement>(`[id="${formId}-${next}"]`)
                          ?.focus();
                      }
                    }}
                  >
                    {category === key && (
                      <motion.span
                        layoutId="device-tab"
                        className={styles.tabIndicator}
                        transition={{ duration: reduced ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
                      />
                    )}
                    <Icon size={17} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          )}
          <div
            id={!device ? `${formId}-panel` : undefined}
            role={!device ? "tabpanel" : undefined}
            aria-labelledby={!device ? `${formId}-${category}` : undefined}
          >
            {!device && (
              <nav aria-label="مراحل افزودن تجهیز" className={styles.steps}>
                {steps.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    aria-current={step === index ? "step" : undefined}
                    disabled={busy || (index === 2 && !review)}
                    onClick={() => void goToStep(index)}
                  >
                    <span>{(index + 1).toLocaleString("fa-IR")}</span>
                    {label}
                  </button>
                ))}
              </nav>
            )}
            <div
              className={!device ? styles.stepContent : undefined}
              hidden={!device && step !== 0}
            >
              {!device && (
                <div className={styles.grid + " mb-4"}>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="relative pe-6">
                      شرکت مالک تجهیز
                      <Button
                        type="button"
                        variant="ghost"
                        className="absolute end-0 top-1/2 size-5 -translate-y-1/2 p-0"
                        disabled={busy || companies.isFetching}
                        aria-label="دریافت دوباره شرکت‌ها"
                        title="دریافت دوباره شرکت‌ها"
                        onClick={() => void companies.refetch()}
                      >
                        <RefreshCw
                          size={12}
                          aria-hidden="true"
                          className={
                            companies.isFetching
                              ? "animate-spin motion-reduce:animate-none"
                              : undefined
                          }
                        />
                      </Button>
                    </div>
                    <Select
                      label="شرکت مالک تجهیز"
                      options={(companies.data ?? []).map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                      value={selectedCompany?.id ?? ""}
                      onValueChange={(id) => {
                        setCompanyId(id);
                        setReview(undefined);
                      }}
                      disabled={companies.isFetching || busy}
                      placeholder="انتخاب شرکت"
                      emptyMessage={
                        companies.error
                          ? "دریافت شرکت‌ها انجام نشد."
                          : "شرکتی در فضای کاری ثبت نشده است."
                      }
                    />
                  </div>
                  <label>
                    مسیر دسترسی
                    <Select
                      label="مسیر دسترسی"
                      options={[
                        { value: "direct", label: "مستقیم" },
                        { value: "vpn", label: "از طریق VPN", disabled: true },
                      ]}
                      value="direct"
                      onValueChange={() => undefined}
                    />
                    <span className={styles.optional}>
                      اتصال از طریق VPN هنوز در این نسخه فعال نیست.
                    </span>
                  </label>
                </div>
              )}
              <div className={styles.grid}>
                <label>
                  نام تجهیز
                  <input
                    autoComplete="off"
                    {...register("name", {
                      required: "نام تجهیز را وارد کنید.",
                      validate: (v) => v.trim().length >= 2 || "حداقل ۲ کاراکتر وارد کنید.",
                      maxLength: { value: 120, message: "حداکثر ۱۲۰ کاراکتر مجاز است." },
                    })}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <span className={styles.error}>{errors.name.message}</span>}
                </label>
                <label>
                  نوع تجهیز
                  <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                      <Select
                        label="نوع تجهیز"
                        value={field.value}
                        onBlur={field.onBlur}
                        disabled={busy || !open}
                        onValueChange={(value) => chooseType(value as DeviceType)}
                        options={Object.entries(deviceTypeLabels)
                          .filter(([key]) =>
                            category === "recorder"
                              ? ["nvr", "dvr"].includes(key)
                              : !["nvr", "dvr"].includes(key),
                          )
                          .map(([value, label]) => ({
                            value,
                            label,
                            icon: <DeviceIcon type={value} />,
                          }))}
                      />
                    )}
                  />
                </label>
                <label>
                  خانواده محصول / سازنده
                  <Controller
                    control={control}
                    name="vendor"
                    rules={{ required: true }}
                    render={({ field }) => {
                      const entries =
                        category === "recorder"
                          ? [
                              {
                                value: "hikvision",
                                label: "Hikvision",
                                description: "ضبط‌کننده Hikvision",
                              },
                              { value: "dahua", label: "Dahua", description: "ضبط‌کننده Dahua" },
                              {
                                value: "other",
                                label: "سایر سازنده‌ها",
                                description: "ضبط‌کننده عمومی",
                              },
                            ]
                          : families;
                      const available = [
                        ...entries.map((option) => ({
                          ...option,
                          icon: (
                            <DeviceIcon
                              vendor={option.value}
                              type={category === "recorder" ? "nvr" : undefined}
                            />
                          ),
                        })),
                        ...(!entries.some((option) => option.value === field.value)
                          ? [
                              {
                                value: field.value,
                                label: field.value,
                                icon: <DeviceIcon vendor={field.value} />,
                              },
                            ]
                          : []),
                      ];
                      return (
                        <Select
                          label="خانواده محصول / سازنده"
                          value={field.value}
                          onBlur={field.onBlur}
                          disabled={busy || !open}
                          options={available}
                          onValueChange={(value) => {
                            const family = families.find((item) => item.value === value);
                            if (category === "network" && family) chooseType(family.type);
                            field.onChange(value);
                          }}
                        />
                      );
                    }}
                  />
                </label>
                <label>
                  محیط
                  <Controller
                    control={control}
                    name="environment"
                    render={({ field }) => (
                      <Select
                        label="محیط"
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={busy || !open}
                        options={Object.entries(environmentLabels).map(([value, label]) => ({
                          value,
                          label,
                        }))}
                      />
                    )}
                  />
                </label>
                <label className={styles.wide}>
                  آدرس IP یا نام میزبان
                  <input
                    dir="ltr"
                    autoComplete="off"
                    placeholder="192.168.1.1 یا router.example.com"
                    {...register("host", {
                      required: "آدرس تجهیز را وارد کنید.",
                      maxLength: { value: 253, message: "آدرس بیش از حد طولانی است." },
                      validate: (value) => {
                        const v = value.trim();
                        return (
                          z.ipv4().safeParse(v).success ||
                          z.ipv6().safeParse(v).success ||
                          (/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
                            v,
                          ) &&
                            (!/^[\d.]+$/.test(v) ||
                              (v.split(".").length === 4 &&
                                v.split(".").every((n) => Number(n) <= 255)))) ||
                          "آدرس معتبر وارد کنید."
                        );
                      },
                    })}
                    aria-invalid={!!errors.host}
                  />
                  {errors.host && <span className={styles.error}>{errors.host.message}</span>}
                </label>
                <label>
                  پروتکل
                  <Controller
                    control={control}
                    name="protocol"
                    render={({ field }) => (
                      <Select
                        label="پروتکل"
                        value={field.value}
                        onBlur={field.onBlur}
                        disabled={busy || !open}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue(
                            "managementPort",
                            (
                              { ssh: 22, api: 443, syslog: 514, agent: 8443 } as Record<
                                string,
                                number
                              >
                            )[value],
                            { shouldValidate: true },
                          );
                        }}
                        options={["ssh", "api", "syslog", "agent"].map((value) => ({
                          value,
                          label: value.toUpperCase(),
                        }))}
                      />
                    )}
                  />
                </label>
                <label>
                  پورت مدیریت
                  <input
                    type="number"
                    dir="ltr"
                    min={1}
                    max={65535}
                    {...register("managementPort", {
                      valueAsNumber: true,
                      required: "پورت را وارد کنید.",
                      validate: (v) =>
                        (Number.isInteger(v) && v >= 1 && v <= 65535) ||
                        "پورت باید بین ۱ تا ۶۵۵۳۵ باشد.",
                    })}
                    aria-invalid={!!errors.managementPort}
                  />
                  {errors.managementPort && (
                    <span className={styles.error}>{errors.managementPort.message}</span>
                  )}
                </label>
                <label className={styles.wide}>
                  برچسب‌ها <span className={styles.optional}>اختیاری؛ با ویرگول جدا کنید</span>
                  <input
                    placeholder="مرکزی، طبقه اول"
                    {...register("tagsText", {
                      validate: (value) => {
                        const tags = value
                          .split(/[,،]/)
                          .map((t) => t.trim())
                          .filter(Boolean);
                        return (
                          (tags.length <= 25 && tags.every((t) => t.length <= 40)) ||
                          "حداکثر ۲۵ برچسب، هرکدام تا ۴۰ کاراکتر مجاز است."
                        );
                      },
                    })}
                    aria-invalid={!!errors.tagsText}
                  />
                  {errors.tagsText && (
                    <span className={styles.error}>{errors.tagsText.message}</span>
                  )}
                </label>
              </div>
            </div>
            {!device && (
              <div className={styles.stepContent} hidden={step !== 1}>
                {isRecorder ? (
                  <div
                    ref={recorderFields}
                    className={styles.grid}
                    onChange={() => setReview(undefined)}
                  >
                    <label>
                      نام کاربری ضبط‌کننده
                      <input name="recorderUsername" dir="ltr" maxLength={128} autoComplete="off" />
                    </label>
                    <label>
                      گذرواژه ضبط‌کننده
                      <input
                        name="recorderPassword"
                        type="password"
                        dir="ltr"
                        maxLength={1024}
                        autoComplete="new-password"
                      />
                    </label>
                    <div className={styles.wide}>
                      <label className="!flex-row items-center">
                        <input className="!size-4 !min-h-0" type="checkbox" name="recorderHttps" />
                        استفاده از HTTPS برای ONVIF
                      </label>
                      <p className={styles.hint}>
                        این اطلاعات فقط برای تست اتصال ONVIF استفاده می‌شود.
                      </p>
                    </div>
                  </div>
                ) : canTestSsh ? (
                  <div className="grid gap-4">
                    <div className={styles.tabs} aria-label="روش انتخاب اعتبارنامه">
                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={credentialMode === "existing"}
                        onClick={() => setCredentialMode("existing")}
                      >
                        اعتبارنامه موجود
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        aria-pressed={credentialMode === "new"}
                        onClick={() => setCredentialMode("new")}
                      >
                        ساخت در همین مرحله
                      </button>
                    </div>
                    {credentialMode === "existing" ? (
                      <Select
                        label="اعتبارنامه"
                        value={credentialId}
                        options={(credentials.data ?? []).map((item) => ({
                          value: item.id,
                          label: item.name + " · " + item.username,
                        }))}
                        onValueChange={(id) => {
                          setCredentialId(id);
                          setReview(undefined);
                        }}
                        placeholder="انتخاب اعتبارنامه"
                        emptyMessage={
                          credentials.error
                            ? "دریافت اعتبارنامه‌ها انجام نشد."
                            : "هنوز اعتبارنامه‌ای ثبت نشده است."
                        }
                        disabled={credentials.isFetching || busy}
                      />
                    ) : (
                      <CredentialLibrary
                        key={credentialMode}
                        createOnOpen={credentialMode === "new"}
                        onBusyChange={setCredentialBusy}
                        disabled={formBusy}
                        onSaved={(id) => {
                          setCredentialId(id);
                          setReview(undefined);
                          setCredentialMode("existing");
                        }}
                        onDeleted={(id) => {
                          if (id === credentialId) {
                            setCredentialId("");
                            setReview(undefined);
                          }
                        }}
                      />
                    )}
                    {credentials.error && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void credentials.refetch()}
                      >
                        تلاش دوباره برای دریافت اعتبارنامه‌ها
                      </Button>
                    )}
                    {credentialMode === "existing" && credentials.data?.length === 0 && (
                      <p className={styles.hint}>
                        اعتبارنامه‌ای ثبت نشده است. می‌توانید در همین مرحله یکی بسازید.
                      </p>
                    )}
                    <button
                      type="button"
                      className="w-fit text-sm text-primary"
                      disabled={busy}
                      onClick={() =>
                        setCredentialMode(credentialMode === "manage" ? "existing" : "manage")
                      }
                    >
                      مدیریت اعتبارنامه‌ها
                    </button>
                    <p className={styles.hint}>
                      اعتبارنامه رمزنگاری می‌شود و فقط شناسه آن به تجهیز متصل می‌شود.
                    </p>
                  </div>
                ) : (
                  <p className={styles.hint}>
                    تست اعتبارنامه برای این نوع اتصال هنوز فعال نیست. می‌توانید بدون تست ادامه دهید.
                  </p>
                )}
              </div>
            )}
            {!device && step === 2 && review && (
              <section className={styles.stepContent} aria-label="بازبینی تجهیز">
                <dl className={styles.review}>
                  <div>
                    <dt>نام تجهیز</dt>
                    <dd>{review.device.name}</dd>
                  </div>
                  <div>
                    <dt>سازنده و نوع</dt>
                    <dd>
                      <bdi>
                        {review.device.vendor} · {deviceTypeLabels[review.device.type]}
                      </bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>آدرس و پورت</dt>
                    <dd>
                      <bdi>
                        {review.device.host} · {review.device.managementPort}
                      </bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>روش اتصال</dt>
                    <dd>{review.device.protocol.toUpperCase()}</dd>
                  </div>
                  <div>
                    <dt>محیط</dt>
                    <dd>{environmentLabels[review.device.environment]}</dd>
                  </div>
                  <div>
                    <dt>برچسب‌ها</dt>
                    <dd>{review.device.tags.join("، ") || "—"}</dd>
                  </div>
                  <div>
                    <dt>شرکت مالک</dt>
                    <dd>{selectedCompany?.name}</dd>
                  </div>
                  <div>
                    <dt>مسیر دسترسی</dt>
                    <dd>مستقیم</dd>
                  </div>
                  <div>
                    <dt>اعتبارنامه</dt>
                    <dd>
                      {review.device.credentialId
                        ? (credentials.data?.find((item) => item.id === review.device.credentialId)
                            ?.name ?? "اعتبارنامه انتخاب‌شده")
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>نتیجه تست</dt>
                    <dd>{review.verified ? "ورود مدیریتی تأیید شد" : "بدون تست اعتبارنامه"}</dd>
                  </div>
                </dl>
              </section>
            )}
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
          </div>
        </fieldset>
      </form>
    </AnimatedDialog>
  );
}

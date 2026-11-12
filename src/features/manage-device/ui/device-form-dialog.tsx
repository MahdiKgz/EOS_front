"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Network, RefreshCw, Server } from "lucide-react";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  DeviceIcon,
  deviceApiKind,
  deviceTypeLabels,
  environmentLabels,
  type Device,
  type DeviceInput,
  type DeviceType,
  useCreateDeviceMutation,
  useRegistrationDraftQuery,
  useSaveRegistrationDraftMutation,
  useDeleteRegistrationDraftMutation,
  useVerifyDraftConnectionMutation,
  type RecorderConnectionInput,
  useDeviceCompaniesQuery,
  useDeviceCredentialsQuery,
  useUpdateDeviceMutation,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Select } from "@/shared/ui/select";
import { Button } from "@/shared/ui/button";
import { CiscoAccessFields, defaultCiscoAccess } from "./cisco-access-fields";
import { RecorderDiscovery } from "./recorder-discovery";
import { ApiCredentialPicker } from "./api-credential-picker";
import { CredentialLibrary } from "./credential-library";
import styles from "./device-form.module.css";
type FormValues = Omit<DeviceInput, "tags"> & { tagsText: string };
const vendors: Record<DeviceType, string> = {
  linux_edge: "Linux",
  esxi: "VMware",
  mikrotik: "MikroTik",
  fortigate: "Fortinet",
  cisco: "Cisco",
  pfsense: "Netgate",
  generic_syslog_source: "Generic",
  generic_firewall: "Generic",
  nvr: "Hikvision",
  dvr: "Dahua",
  camera: "Hikvision",
};
const families = [
  { value: "linux", label: "Linux", description: "سرور Linux با SSH", type: "linux_edge" },
  { value: "fortinet", label: "FortiGate", description: "فایروال FortiGate", type: "fortigate" },
  { value: "cisco", label: "Cisco", description: "Cisco IOS / IOS-XE", type: "cisco" },
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
    ...(rest.type === "cisco" && rest.protocol === "ssh" && rest.ciscoProfile
      ? { ciscoProfile: rest.ciscoProfile }
      : {}),
    name: rest.name.trim(),
    vendor: rest.vendor.trim(),
    type: rest.type,
    host: rest.host.trim(),
    managementPort: rest.managementPort,
    location: rest.location?.trim() || null,
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

const draftSchema = z.object({
  expiresAt: z.number(),
  revision: z.string().uuid().optional(),
  companyId: z.string().max(64),
  category: z.enum(["network", "recorder"]),
  values: z.object({
    ciscoProfile: z
      .object({
        compatibilityProfile: z.enum(["modern", "legacy_cisco"]),
        enableCredentialId: z.string().uuid().nullable().optional(),
      })
      .optional(),
    name: z.string().max(120),
    vendor: z.string().max(80),
    type: z.custom<DeviceType>(
      (value) => typeof value === "string" && Object.hasOwn(deviceTypeLabels, value),
    ),
    host: z.string().max(253),
    managementPort: z.number().int().min(1).max(65535),
    location: z.string().max(160).nullable().optional(),
    protocol: z.enum(["ssh", "api", "syslog", "agent"]),
    environment: z.enum(["production", "staging", "lab"]),
    tagsText: z.string().max(4096),
  }),
});
type RegistrationDraft = z.infer<typeof draftSchema>;

function readDraft(key: string | undefined) {
  if (!key || typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return undefined;
    const result = draftSchema.safeParse(JSON.parse(raw));
    return result.success && result.data.expiresAt > Date.now() ? result.data : undefined;
  } catch {
    return undefined;
  }
}

export function DeviceFormDialog({
  device,
  onClose,
  draftOwnerId,
  initialCategory = "network",
  initialDevice,
  initialCompanyId,
}: {
  device?: Device;
  onClose: () => void;
  draftOwnerId?: string;
  initialCategory?: "network" | "recorder";
  initialDevice?: Pick<DeviceInput, "type" | "vendor" | "protocol" | "managementPort">;
  initialCompanyId?: string;
}) {
  const draftKey = !device && draftOwnerId ? `eosnet:device-draft:v1:${draftOwnerId}` : undefined;
  const [localDraft, setLocalDraft] = useState(() => readDraft(draftKey));
  const [dismissedRevision, setDismissedRevision] = useState<string>();
  const [draftBusy, setDraftBusy] = useState(false);
  const resumedRevision = useRef<string>(undefined);
  const remoteDraft = useRegistrationDraftQuery(undefined, { skip: !draftKey });
  const [saveRemoteDraft] = useSaveRegistrationDraftMutation(),
    [deleteRemoteDraft] = useDeleteRegistrationDraftMutation();
  const parsedRemoteDraft = draftSchema.safeParse(remoteDraft.data?.draft);
  const pendingRemoteDraft =
    parsedRemoteDraft.success && parsedRemoteDraft.data.revision !== dismissedRevision
      ? parsedRemoteDraft.data
      : undefined;
  const pendingDraft = pendingRemoteDraft ?? localDraft;
  const [open, setOpen] = useState(true),
    [category, setCategory] = useState<"network" | "recorder">(
      device
        ? ["nvr", "dvr", "camera"].includes(device.type)
          ? "recorder"
          : "network"
        : initialCategory,
    );
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<{
    device: DeviceInput;
    verified: boolean;
    verificationToken?: string;
    identity?: Record<string, string>;
  }>();
  const [testing, setTesting] = useState(false);
  const [companyId, setCompanyId] = useState(device?.companyId ?? initialCompanyId ?? "");
  const [credentialId, setCredentialId] = useState("");
  const [apiCredentialId, setApiCredentialId] = useState(device?.apiCredentialId ?? "");
  const [credentialMode, setCredentialMode] = useState<"existing" | "new" | "manage">("existing");
  const [credentialBusy, setCredentialBusy] = useState(false);
  const companies = useDeviceCompaniesQuery();
  const credentials = useDeviceCredentialsQuery(undefined, { skip: !!device });
  const selectedCompany =
    companies.data?.find((item) => item.id === companyId) ??
    (!companyId && !device ? companies.data?.[0] : undefined);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const formId = useId();
  const reduced = useReducedMotion();
  const [create, { isLoading: creating }] = useCreateDeviceMutation();
  const [update, { isLoading: updating }] = useUpdateDeviceMutation();
  const {
    register,
    reset,
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
          ciscoProfile: defaultCiscoAccess,
          name: "",
          vendor: initialCategory === "recorder" ? "hikvision" : "linux",
          type: initialCategory === "recorder" ? "nvr" : "linux_edge",
          host: "",
          managementPort: initialCategory === "recorder" ? 80 : 22,
          location: "",
          protocol: initialCategory === "recorder" ? "api" : "ssh",
          environment: "lab",
          tagsText: "",
          ...initialDevice,
        },
  });
  const type = useWatch({ control, name: "type" });
  const protocol = useWatch({ control, name: "protocol" });
  const vendor = useWatch({ control, name: "vendor" });
  const isRecorder = ["nvr", "dvr", "camera"].includes(type) && protocol === "api";
  const canTestSsh =
    ["linux_edge", "mikrotik", "pfsense", "esxi", "fortigate", "cisco"].includes(type) &&
    protocol === "ssh";
  const canTestApi = !!deviceApiKind({ type, vendor, protocol });
  const canTest = canTestSsh || isRecorder || canTestApi;
  const recorderForm = useForm<{
    username: string;
    password: string;
    https: boolean;
    saveConnection: boolean;
    onvifPath: string;
    rtspPath: string;
  }>({
    defaultValues: {
      username: "",
      password: "",
      https: false,
      saveConnection: false,
      onvifPath: "/onvif/device_service",
      rtspPath: "",
    },
  });
  const [verifyDraft] = useVerifyDraftConnectionMutation();
  const formBusy = creating || updating || isSubmitting || testing;
  const [discovering, setDiscovering] = useState(false);
  const [recorderMode, setRecorderMode] =
    useState<NonNullable<RecorderConnectionInput["mode"]>>("auto");
  const busy = formBusy || credentialBusy || discovering || draftBusy;

  function draftInput(values: FormValues): DeviceInput {
    return {
      ...deviceInput(values),
      apiCredentialId: canTestApi && apiCredentialId ? apiCredentialId : undefined,
      ...(device
        ? { companyId: selectedCompany?.id }
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
    if (canTestApi && !draft.apiCredentialId) {
      setError("اعتبارنامهٔ API را انتخاب کنید یا یک مورد بسازید.");
      return;
    }
    if (canTestSsh && !draft.credentialId) {
      setError("اعتبارنامه موجود را انتخاب کنید یا یک اعتبارنامه بسازید.");
      return;
    }
    const connection = recorderForm.getValues();
    const recorder: RecorderConnectionInput | undefined = isRecorder
      ? {
          username: connection.username.trim(),
          password: connection.password,
          https: !["dvrip", "rtsp"].includes(recorderMode ?? "") && connection.https,
          mode: recorderMode,
          onvifPath: ["onvif", "auto"].includes(recorderMode ?? "")
            ? connection.onvifPath.trim()
            : undefined,
          rtspPath: recorderMode === "rtsp" ? connection.rtspPath.trim() : undefined,
        }
      : undefined;
    if (recorder && (!recorder.username || !recorder.password)) {
      setError("نام کاربری و گذرواژه ضبط‌کننده را وارد کنید.");
      return;
    }
    lock.current = true;
    setTesting(true);
    try {
      const request = verifyDraft({
        device: draft,
        recorder,
        saveRecorderConnection: recorder ? connection.saveConnection : undefined,
      });
      let result;
      try {
        result = await request.unwrap();
      } finally {
        request.reset();
      }
      setReview({
        device: draft,
        verified: true,
        identity: result.identity,
        verificationToken: result.verificationToken,
      });
      setStep(2);
    } catch (failure) {
      setError(apiErrorMessage(failure));
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
    setRecorderMode(type === "camera" ? "onvif" : "auto");
    setValue("type", type, { shouldValidate: true });
    setValue("vendor", vendors[type].toLowerCase(), { shouldValidate: true });
    const protocol = ["nvr", "dvr", "camera", "esxi"].includes(type)
      ? "api"
      : type === "generic_syslog_source"
        ? "syslog"
        : "ssh";
    setValue("protocol", protocol, { shouldValidate: true });
    setValue(
      "managementPort",
      ["nvr", "dvr", "camera"].includes(type)
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
  function clearLocalDraft() {
    if (!draftKey) return;
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // Older local drafts may be unavailable.
    }
  }

  async function deleteDraft(revision: string) {
    const request = deleteRemoteDraft(revision);
    try {
      await request.unwrap();
    } finally {
      request.reset();
    }
  }

  async function discardDraft() {
    if (draftBusy || lock.current) return;
    setDraftBusy(true);
    try {
      if (pendingDraft?.revision) await deleteDraft(pendingDraft.revision);
      clearLocalDraft();
      setDismissedRevision(pendingDraft?.revision);
      setLocalDraft(undefined);
    } catch {
      toast.error("حذف پیش‌نویس انجام نشد.");
    } finally {
      setDraftBusy(false);
    }
  }

  async function saveDraft() {
    if (!draftKey || draftBusy || lock.current) return;
    const draft = draftSchema.safeParse({
      category,
      companyId: selectedCompany?.id ?? companyId,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      values: getValues(),
    });
    if (!draft.success) {
      toast.error("برای ذخیرهٔ پیش‌نویس، مشخصات و پورت تجهیز را بررسی کنید.");
      return;
    }
    setDraftBusy(true);
    try {
      const { category, companyId, values } = draft.data;
      const request = saveRemoteDraft({ category, companyId, values });
      try {
        await request.unwrap();
      } finally {
        request.reset();
      }
      clearLocalDraft();
      toast.success("پیش‌نویس در حساب شما ذخیره شد.");
      setOpen(false);
    } catch {
      toast.error("ذخیرهٔ پیش‌نویس انجام نشد. دوباره تلاش کنید.");
    } finally {
      setDraftBusy(false);
    }
  }

  function resumeDraft(draft: RegistrationDraft) {
    resumedRevision.current = draft.revision;
    reset(draft.values);
    setRecorderMode(draft.values.type === "camera" ? "onvif" : "auto");
    setCategory(draft.category);
    setCompanyId(draft.companyId);
    setCredentialId("");
    setApiCredentialId("");
    setReview(undefined);
    setError("");
    setStep(0);
    setDismissedRevision(draft.revision);
    setLocalDraft(undefined);
  }

  async function submit(values: FormValues) {
    if (testing || credentialBusy || lock.current || (!device && (step !== 2 || !review))) return;
    lock.current = true;
    setError("");
    const body = draftInput(values);
    try {
      if (device) await update({ id: device.id, body }).unwrap();
      else {
        await create({
          ...body,
          verificationToken: review?.verificationToken,
          draftRevision: resumedRevision.current,
        }).unwrap();
        clearLocalDraft();
      }
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
          {draftKey && (
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => void saveDraft()}
            >
              ذخیرهٔ پیش‌نویس
            </Button>
          )}
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      {pendingDraft && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
          <span className="me-auto">
            پیش‌نویس {pendingDraft.values.name || "تجهیز"} برای ادامه موجود است.
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => resumeDraft(pendingDraft)}
          >
            ادامهٔ پیش‌نویس
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void discardDraft()}>
            حذف پیش‌نویس
          </Button>
        </div>
      )}
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
                    ["recorder", "دوربین / NVR / DVR", Server],
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
                {device && selectedCompany && selectedCompany.id !== device.companyId && (
                  <p className={styles.optional}>
                    با تغییر شرکت، اتصال ذخیره‌شده و تأیید قبلی پاک می‌شوند.
                  </p>
                )}
                {!device && (
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
                )}
              </div>
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
                              ? ["nvr", "dvr", "camera"].includes(key)
                              : !["nvr", "dvr", "camera"].includes(key),
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
                            if (category === "network" && family) {
                              chooseType(family.type);
                              if (value === "sophos") {
                                setValue("protocol", "api", { shouldValidate: true });
                                setValue("managementPort", 4444, { shouldValidate: true });
                              }
                            }
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
                {!device && isRecorder && (
                  <div className={styles.wide}>
                    <RecorderDiscovery
                      key={selectedCompany?.id}
                      companyId={selectedCompany?.id}
                      onBusy={setDiscovering}
                      onSelect={({ host, port, https }) => {
                        setValue("host", host, { shouldValidate: true });
                        setValue("managementPort", port, { shouldValidate: true });
                        recorderForm.setValue("https", https);
                        setRecorderMode("onvif");
                        setReview(undefined);
                      }}
                    />
                  </div>
                )}
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
                              {
                                ssh: 22,
                                api: /^sophos(?:[ _-]firewall)?$/i.test(vendor) ? 4444 : 443,
                                syslog: 514,
                                agent: 8443,
                              } as Record<string, number>
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
                  محل نصب <span className={styles.optional}>اختیاری</span>
                  <input
                    placeholder="مثلاً ورودی ساختمان"
                    {...register("location", {
                      maxLength: { value: 160, message: "حداکثر ۱۶۰ کاراکتر مجاز است." },
                    })}
                    aria-invalid={!!errors.location}
                  />
                  {errors.location && (
                    <span className={styles.error}>{errors.location.message}</span>
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
                  <div className={styles.grid} onChange={() => setReview(undefined)}>
                    <label>
                      نام کاربری ضبط‌کننده
                      <input
                        {...recorderForm.register("username")}
                        dir="ltr"
                        maxLength={128}
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      گذرواژه ضبط‌کننده
                      <input
                        {...recorderForm.register("password")}
                        type="password"
                        dir="ltr"
                        maxLength={1024}
                        autoComplete="new-password"
                      />
                    </label>
                    <div className={styles.wide}>
                      <Select
                        label="روش اتصال ضبط‌کننده"
                        value={recorderMode}
                        onValueChange={(value) =>
                          setRecorderMode(value as NonNullable<RecorderConnectionInput["mode"]>)
                        }
                        options={[
                          ...(type === "camera" ? [] : [{ value: "auto", label: "تشخیص خودکار" }]),
                          { value: "onvif", label: "ONVIF" },
                          ...(type === "camera"
                            ? []
                            : [
                                { value: "appweb", label: "AppWeb" },
                                { value: "dvrip", label: "DVRIP" },
                              ]),
                          { value: "rtsp", label: "RTSP" },
                        ]}
                        disabled={busy}
                      />
                      {["onvif", "auto"].includes(recorderMode ?? "") && (
                        <label>
                          مسیر سرویس ONVIF
                          <input
                            {...recorderForm.register("onvifPath")}
                            dir="ltr"
                            maxLength={256}
                          />
                        </label>
                      )}
                      {recorderMode === "rtsp" && (
                        <label>
                          مسیر جریان RTSP
                          <input
                            dir="ltr"
                            {...recorderForm.register("rtspPath")}
                            maxLength={512}
                            placeholder="/stream"
                          />
                        </label>
                      )}
                      <label className="!flex-row items-center">
                        <input
                          className="!size-4 !min-h-0"
                          type="checkbox"
                          {...recorderForm.register("https")}
                          disabled={["dvrip", "rtsp"].includes(recorderMode ?? "")}
                        />
                        استفاده از HTTPS
                      </label>
                      <label className="!flex-row items-center">
                        <input
                          className="!size-4 !min-h-0"
                          type="checkbox"
                          {...recorderForm.register("saveConnection")}
                        />
                        ذخیرهٔ امن اتصال پس از ثبت تجهیز
                      </label>
                    </div>
                  </div>
                ) : canTestApi ? (
                  <ApiCredentialPicker
                    value={apiCredentialId}
                    onChange={(id) => {
                      setApiCredentialId(id);
                      setReview(undefined);
                    }}
                    disabled={busy}
                  />
                ) : canTestSsh ? (
                  <div className="grid gap-4">
                    {type === "cisco" && (
                      <Controller
                        control={control}
                        name="ciscoProfile"
                        render={({ field }) => (
                          <CiscoAccessFields
                            value={field.value}
                            disabled={busy}
                            onBusyChange={setCredentialBusy}
                            onChange={(value) => {
                              field.onChange(value);
                              setReview(undefined);
                            }}
                          />
                        )}
                      />
                    )}
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
                    <dt>محل نصب</dt>
                    <dd>{review.device.location || "—"}</dd>
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
                  {[
                    ["Manufacturer", "سازندهٔ شناسایی‌شده"],
                    ["Model", "مدل شناسایی‌شده"],
                    ["FirmwareVersion", "نسخهٔ نرم‌افزار"],
                  ].map(([key, label]) => {
                    const value = review.identity?.[key];
                    return value ? (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd dir="auto">{value}</dd>
                      </div>
                    ) : null;
                  })}
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

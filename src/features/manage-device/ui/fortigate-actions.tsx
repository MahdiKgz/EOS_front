"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LoaderCircle, Network, Plus, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  isFortiPolicyCreate,
  fortiObjectActionLabels,
  fortiActionResources,
  fortiResourceTables,
  useDeviceActionsQuery,
  usePreviewDeviceActionMutation,
  useExecuteDeviceActionMutation,
  useVerifyDeviceActionMutation,
  type FortiActionInput,
  type ActionPreview,
  type ActionOutcome,
  type FortiCollection,
} from "@/entities/device";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { apiErrorMessage } from "@/shared/api/error-message";
import { FortigateVdomFields } from "./fortigate-vdom-fields";
import { FortigateClusterFields } from "./fortigate-cluster-fields";
import { FortigateAdminFields } from "./fortigate-admin-fields";
import { FortigateNetworkFields } from "./fortigate-network-fields";
import { FortigatePolicyFields } from "./fortigate-policy-fields";
const actions: Record<FortiActionInput["action"], string> = {
  ...fortiObjectActionLabels,
  "interface.alias": "تغییر alias",
  "interface.role": "تغییر نقش رابط",
  "interface.state": "فعال/غیرفعال‌کردن رابط",
  "interface.ip": "تغییر IP و mask",
  "interface.vlan": "ساخت رابط VLAN",
  "interface.allowaccess": "دسترسی مدیریتی رابط",
};
const previewLabels: Record<string, string> = {
  exists: "وجود هدف",
  "short-name": "نام کوتاه",
  description: "توضیح",
  "group-name": "نام گروه HA",
  priority: "Priority",
  "priority-members": "اعضا به ترتیب اولویت",
  "service-sla-tie-break": "اولویت انتخاب عضو Zone",
  members: "اعضای مورد بررسی",
  mode: "حالت",
  interface: "رابط",
  zone: "Zone",
  protocol: "پروتکل",
  src: "مراجع مبدأ",
  __password: "گذرواژه از مخزن شخصی",
  accprofile: "پروفایل دسترسی",
  vdom: "VDOMهای حساب",
  trusthost1: "شبکهٔ مجاز ورود",
  "admin-sport": "پورت HTTPS مدیریت",
  "disallowed-login-methods": "روش‌های ورود غیرفعال",
  __sourceName: "شیء آدرس مبدأ خودکار",
  __sourceSubnet: "شبکهٔ آدرس مبدأ خودکار",
  __before: "Policy بعدی در ترتیب",
  __after: "Policy قبلی در ترتیب",
  dst: "شبکهٔ مقصد",
  gateway: "Gateway",
  device: "رابط خروجی",
  primary: "DNS اصلی",
  secondary: "DNS دوم",
  ntpsync: "همگام‌سازی NTP",
  server: "سرور",
  "orig-addr": "مرجع مبدأ",
  "dst-addr": "مرجع مقصد",
  srcintf: "رابط مبدأ",
  dstintf: "رابط مقصد",
  srcaddr: "آدرس مبدأ",
  dstaddr: "آدرس مقصد",
  comments: "توضیح",
  name: "نام",
  service: "سرویس",
  schedule: "زمان‌بندی",
};
const states: Record<string, string> = {
  preview: "پیش‌نمایش",
  running: "در حال اجرا",
  succeeded: "تأیید شد",
  failed: "ناموفق",
  verification_failed: "عدم تطابق نتیجه",
  verification_pending: "نتیجهٔ اجرا تأیید نشده",
};
export function FortigateActions({
  id,
  companyId,
  canWrite,
  collection,
}: {
  id: string;
  companyId?: string | null;
  canWrite: boolean;
  collection?: FortiCollection | null;
}) {
  const [verify, verifyState] = useVerifyDeviceActionMutation();
  const [dialog, setDialog] = useState(false),
    query = useDeviceActionsQuery(
      { id, companyId },
      { pollingInterval: 15000, skipPollingIfUnfocused: true },
    );
  const items = query.currentData?.companyId === (companyId ?? null) ? query.currentData.items : [];
  return (
    <section className="grid gap-3 rounded-lg border bg-background p-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Settings2 size={16} />
          عملیات FortiGate
        </h3>
        {canWrite && (
          <Button size="sm" variant="outline" onClick={() => setDialog(true)}>
            <Plus size={15} />
            عملیات جدید
          </Button>
        )}
      </header>
      <p className="text-xs leading-6 text-muted-foreground">
        تنظیم فعلی از تجهیز خوانده می‌شود. پس از پیش‌نمایش و یک تأیید، تغییر ارسال و نتیجه با خواندن
        دوباره بررسی می‌شود.
      </p>
      {query.error && (
        <p role="alert" className="text-xs text-destructive">
          {apiErrorMessage(query.error)}
        </p>
      )}
      {query.isLoading && (
        <p role="status" className="text-xs">
          در حال دریافت سوابق…
        </p>
      )}
      {!!items?.length && (
        <details className="rounded-md border p-3">
          <summary className="cursor-pointer text-xs">سوابق عملیات</summary>
          <div className="mt-3 grid gap-2 text-xs">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap justify-between gap-2 border-b pb-2">
                <span>{actions[item.action as keyof typeof actions] ?? item.action}</span>
                <span>{states[item.status] ?? item.status}</span>
                <span>{item.actorName ?? "—"}</span>
                <bdi>
                  {item.targetName}
                  {item.targetId ? ` (#${item.targetId})` : ""} · {item.vdom}
                </bdi>
                {canWrite && item.canVerify && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifyState.isLoading}
                    onClick={async () => {
                      try {
                        const result = await verify({ id, planId: item.id }).unwrap();
                        if (result.verified) toast.success("نتیجهٔ عملیات تأیید شد.");
                        else toast.error("تنظیم مورد انتظار تأیید نشد.");
                      } catch (error) {
                        toast.error(apiErrorMessage(error));
                      }
                    }}
                  >
                    بررسی نتیجه
                  </Button>
                )}
                <time>{new Date(item.createdAt).toLocaleString("fa-IR")}</time>
              </div>
            ))}
          </div>
        </details>
      )}
      {dialog && (
        <FortiActionDialog id={id} collection={collection} onClose={() => setDialog(false)} />
      )}
    </section>
  );
}
function FortiActionDialog({
  id,
  collection,
  onClose,
}: {
  id: string;
  collection?: FortiCollection | null;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true),
    [preview, setPreview] = useState<ActionPreview>(),
    [outcome, setOutcome] = useState<ActionOutcome>(),
    [error, setError] = useState("");
  const form = useForm<FortiActionInput>({
      defaultValues: {
        action: "interface.alias",
        name: "",
        value: "",
        vdom: collection?.system.currentVdom ?? "root",
        parent: "",
        vlanId: "",
        addressType: "subnet",
        serviceProtocol: "TCP",
        intrazone: "deny",
        start: "09:00",
        end: "17:00",
      },
    }),
    action = useWatch({ control: form.control, name: "action" }),
    formId = useId(),
    lock = useRef(false),
    reduced = useReducedMotion();
  const [createPreview, pendingPreview] = usePreviewDeviceActionMutation(),
    [execute, pendingExecute] = useExecuteDeviceActionMutation(),
    busy = pendingPreview.isLoading || pendingExecute.isLoading;
  const [resource, setResource] = useState<keyof typeof fortiActionResources>("interface");
  const adminResource = ["admin", "apiUser", "management"].includes(resource);
  const clusterResource = ["ha", "sdwanZone", "sdwanMember", "sdwanHealth", "sdwanRule"].includes(
    resource,
  );
  const globalResource =
    adminResource ||
    resource === "vdom" ||
    resource === "ha" ||
    resource === "dns" ||
    resource === "ntp";
  const networkResource = ["snat", "route", "dns", "ntp"].includes(resource);
  const automaticNetworkTarget =
    action === "snat.create" || action === "route.create" || action === "sdwanMember.create";
  const targetName = useWatch({ control: form.control, name: "name" });
  const addressType = useWatch({ control: form.control, name: "addressType" }) ?? "subnet",
    serviceProtocol = useWatch({ control: form.control, name: "serviceProtocol" }) ?? "TCP";
  const selectedObjects = (
    collection?.tables.find(
      (table) =>
        table.key ===
        (action === "vdom.moveInterface" ? "interfaces" : fortiResourceTables[resource]),
    )?.rows ?? []
  ).map((row) => ({
    value: String(resource === "policy" ? row.id : row.name),
    label:
      resource === "policy"
        ? `${row.id} · ${row.name ?? ""}`
        : resource === "route"
          ? `${row.name} · ${row.dst ?? ""} → ${row.gateway ?? ""}`
          : String(row.name),
    icon: <Network size={15} />,
  }));
  const valueLabel =
    resource === "ipPool"
      ? "شروع مخزن (IPv4)"
      : resource === "address"
        ? addressType === "subnet"
          ? "IPv4 / CIDR"
          : addressType === "iprange"
            ? "IP شروع"
            : addressType === "geography"
              ? "کد کشور (دو حرف)"
              : "نام دامنه"
        : resource === "service"
          ? serviceProtocol === "UDP"
            ? "پورت‌های UDP"
            : "پورت‌های TCP"
          : resource === "schedule"
            ? "روزها (نام انگلیسی، جداشده با ویرگول)"
            : "اعضا، جداشده با ویرگول";
  const interfaces = (
    collection?.tables.find((table) => table.key === "interfaces")?.rows ?? []
  ).map((row) => ({
    value: String(row.name),
    label: String(row.name),
    icon: <Network size={15} />,
  }));
  return (
    <AnimatedDialog
      open={open}
      title="عملیات FortiGate"
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex flex-wrap gap-2">
          {!preview ? (
            <Button type="submit" form={formId} disabled={busy}>
              {busy && <LoaderCircle size={15} className="animate-spin" />}دریافت پیش‌نمایش
            </Button>
          ) : outcome ? (
            <Button
              onClick={() => {
                setPreview(undefined);
                setOutcome(undefined);
                setError("");
              }}
              disabled={busy}
            >
              پیش‌نمایش تازه
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={async () => {
                if (lock.current) return;
                lock.current = true;
                setError("");
                try {
                  const result = await execute({ id, planId: preview.id }).unwrap();
                  setOutcome(result);
                  if (result.status === "succeeded" && result.verified)
                    toast.success("تغییر تنظیمات اجرا و تأیید شد.");
                  else toast.error("نتیجهٔ عملیات تأیید نشد. وضعیت را بررسی کنید.");
                } catch (e) {
                  setError(apiErrorMessage(e));
                  const status = (e as { status?: unknown })?.status;
                  setOutcome({
                    id: preview.id,
                    status:
                      typeof status === "number" && status < 500
                        ? "failed"
                        : "verification_pending",
                    connectorInvoked: false,
                    verified: false,
                  });
                } finally {
                  lock.current = false;
                }
              }}
            >
              {busy && <LoaderCircle size={15} className="animate-spin" />}تأیید و اجرا
            </Button>
          )}
          {preview && !outcome && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setPreview(undefined);
                setError("");
              }}
            >
              بازگشت
            </Button>
          )}
        </div>
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={preview ? "preview" : "form"}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduced ? 0 : -8 }}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {!preview ? (
            <form
              id={formId}
              className="grid gap-4 text-sm"
              onSubmit={(event) =>
                void form.handleSubmit(async (values) => {
                  if (lock.current) return;
                  lock.current = true;
                  setError("");
                  try {
                    const body: FortiActionInput = {
                      action: values.action,
                      name: values.name,
                      value: values.value ?? "",
                      vdom: globalResource ? undefined : values.vdom || undefined,
                      ...(resource === "vdom"
                        ? {
                            targetVdom:
                              values.action === "vdom.moveInterface"
                                ? values.targetVdom
                                : undefined,
                            vdomShortName:
                              values.action === "vdom.update" ? values.vdomShortName : undefined,
                            vdomDescription:
                              values.action === "vdom.update" ? values.vdomDescription : undefined,
                          }
                        : {}),
                      ...(clusterResource
                        ? {
                            haMode: values.haMode || undefined,
                            haGroup: values.haGroup || undefined,
                            haPriority: values.haPriority || undefined,
                            sdwanZone: values.sdwanZone || undefined,
                            sdwanMembers: values.sdwanMembers || undefined,
                            probeServer: values.probeServer || undefined,
                            dstInterface: values.dstInterface || undefined,
                            gateway: values.gateway || undefined,
                            srcAddresses: values.srcAddresses || undefined,
                            dstAddresses: values.dstAddresses || undefined,
                          }
                        : {}),
                      ...(adminResource
                        ? {
                            adminProfile: values.adminProfile || undefined,
                            accountVdoms: values.accountVdoms || undefined,
                            adminSecretId:
                              values.action === "admin.create" ? values.adminSecretId : undefined,
                          }
                        : {}),
                      ...(networkResource
                        ? {
                            srcInterface: values.srcInterface || undefined,
                            dstInterface: values.dstInterface || undefined,
                            srcAddresses: values.srcAddresses || undefined,
                            dstAddresses: values.dstAddresses || undefined,
                            sourceCidr: values.sourceCidr || undefined,
                            policyStatus: values.policyStatus || undefined,
                            destinationCidr: values.destinationCidr || undefined,
                            gateway: values.gateway || undefined,
                            primaryDns: values.primaryDns || undefined,
                            secondaryDns: values.secondaryDns || undefined,
                            ntpServer: values.ntpServer || undefined,
                          }
                        : {}),
                      ...(resource === "policy"
                        ? {
                            srcInterface: values.srcInterface || undefined,
                            dstInterface: values.dstInterface || undefined,
                            srcAddresses: values.srcAddresses || undefined,
                            dstAddresses: values.dstAddresses || undefined,
                            services: values.services || undefined,
                            schedule: values.schedule || undefined,
                            policyAction: values.policyAction || undefined,
                            nat: values.nat,
                            logTraffic: values.logTraffic || undefined,
                            policyStatus: values.policyStatus || undefined,
                            sourceCidr: values.sourceCidr || undefined,
                            relativeTo: values.relativeTo || undefined,
                            position:
                              values.action === "policy.move"
                                ? values.position || "before"
                                : undefined,
                          }
                        : {}),
                      ...(resource === "vip"
                        ? {
                            externalIp: values.externalIp || undefined,
                            mappedIp: values.mappedIp || undefined,
                            externalPort: values.externalPort || undefined,
                            mappedPort: values.mappedPort || undefined,
                            parent: values.parent || undefined,
                          }
                        : resource === "ipPool"
                          ? { endIp: values.endIp || undefined }
                          : resource === "address"
                            ? { addressType: values.addressType ?? "subnet", endIp: values.endIp }
                            : resource === "service"
                              ? {
                                  serviceProtocol: values.serviceProtocol ?? "TCP",
                                  udpPorts: values.udpPorts,
                                }
                              : resource === "schedule"
                                ? { start: values.start, end: values.end }
                                : resource === "zone" &&
                                    (values.action === "zone.create" ||
                                      values.action === "zone.update")
                                  ? { intrazone: values.intrazone ?? "deny" }
                                  : {}),
                      ...(values.action === "interface.vlan"
                        ? { parent: values.parent, vlanId: values.vlanId }
                        : {}),
                    };
                    setPreview(await createPreview({ id, body }).unwrap());
                  } catch (e) {
                    setError(apiErrorMessage(e));
                  } finally {
                    lock.current = false;
                  }
                })(event)
              }
            >
              <div
                className="mb-4 flex flex-wrap gap-1 rounded-lg border bg-background p-1"
                role="tablist"
                aria-label="نوع تنظیمات"
              >
                {Object.entries(fortiActionResources).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={resource === key}
                    disabled={busy}
                    className="relative rounded-md px-3 py-2 text-xs"
                    onClick={() => {
                      setResource(key as keyof typeof fortiActionResources);
                      form.clearErrors();
                      form.unregister(
                        [
                          "value",
                          "endIp",
                          "udpPorts",
                          "start",
                          "end",
                          "parent",
                          "vlanId",
                          "externalIp",
                          "mappedIp",
                          "externalPort",
                          "mappedPort",
                        ],
                        {
                          keepValue: true,
                        },
                      );
                      form.setValue(
                        "action",
                        Object.keys(actions).find((action) =>
                          action.startsWith(key + "."),
                        ) as FortiActionInput["action"],
                      );
                      for (const field of [
                        "srcInterface",
                        "dstInterface",
                        "srcAddresses",
                        "dstAddresses",
                        "services",
                        "schedule",
                        "policyAction",
                        "nat",
                        "logTraffic",
                        "policyStatus",
                        "sourceCidr",
                        "relativeTo",
                        "position",
                        "destinationCidr",
                        "gateway",
                        "primaryDns",
                        "secondaryDns",
                        "ntpServer",
                        "adminProfile",
                        "accountVdoms",
                        "adminSecretId",
                        "targetVdom",
                        "vdomShortName",
                        "vdomDescription",
                        "haMode",
                        "haGroup",
                        "haPriority",
                        "sdwanZone",
                        "sdwanMembers",
                        "probeServer",
                      ] as const)
                        form.unregister(field);
                      form.setValue(
                        "name",
                        key === "dns" || key === "ntp" || key === "management" || key === "ha"
                          ? "system"
                          : key === "sdwanMember"
                            ? "auto-member"
                            : key === "snat"
                              ? "auto-snat"
                              : key === "route"
                                ? "auto-route"
                                : "",
                      );
                      if (
                        ["dns", "ntp", "admin", "apiUser", "management", "ha", "vdom"].includes(key)
                      )
                        form.unregister("vdom");
                      else
                        form.setValue(
                          "vdom",
                          form.getValues("vdom") || collection?.system.currentVdom || "root",
                        );
                      form.setValue("value", "");
                      form.setValue("parent", key === "vip" ? "any" : "");
                      for (const field of [
                        "externalIp",
                        "mappedIp",
                        "externalPort",
                        "mappedPort",
                        "endIp",
                      ] as const)
                        form.setValue(field, undefined);
                    }}
                  >
                    {resource === key && (
                      <motion.span
                        layoutId={formId + "-resource"}
                        className="absolute inset-0 rounded-md border border-primary/50 bg-primary/10"
                        transition={{ duration: reduced ? 0 : 0.3 }}
                      />
                    )}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <fieldset disabled={busy} className="grid gap-4">
                <label className="grid gap-2">
                  نوع عملیات
                  <Controller
                    control={form.control}
                    name="action"
                    render={({ field }) => (
                      <Select
                        label="نوع عملیات"
                        value={field.value}
                        onValueChange={(value) => {
                          form.clearErrors();
                          form.unregister(
                            [
                              "value",
                              "endIp",
                              "udpPorts",
                              "start",
                              "end",
                              "parent",
                              "vlanId",
                              "externalIp",
                              "mappedIp",
                              "externalPort",
                              "mappedPort",
                            ],
                            {
                              keepValue: true,
                            },
                          );
                          for (const field of [
                            "srcInterface",
                            "dstInterface",
                            "srcAddresses",
                            "dstAddresses",
                            "services",
                            "schedule",
                            "policyAction",
                            "nat",
                            "logTraffic",
                            "policyStatus",
                            "sourceCidr",
                            "relativeTo",
                            "position",
                            "destinationCidr",
                            "gateway",
                            "primaryDns",
                            "secondaryDns",
                            "ntpServer",
                            "adminProfile",
                            "accountVdoms",
                            "adminSecretId",
                            "targetVdom",
                            "vdomShortName",
                            "vdomDescription",
                            "haMode",
                            "haGroup",
                            "haPriority",
                            "sdwanZone",
                            "sdwanMembers",
                            "probeServer",
                          ] as const)
                            form.unregister(field);
                          field.onChange(value);
                          form.setValue("parent", value === "vip.create" ? "any" : "");
                          form.setValue(
                            "name",
                            value === "dns.update" ||
                              value === "ntp.update" ||
                              value.startsWith("management.") ||
                              value.startsWith("ha.")
                              ? "system"
                              : value === "sdwanMember.create"
                                ? "auto-member"
                                : value === "snat.create"
                                  ? "auto-snat"
                                  : value === "route.create"
                                    ? "auto-route"
                                    : "",
                          );
                          form.setValue(
                            "value",
                            value === "interface.role"
                              ? "lan"
                              : value === "interface.state"
                                ? "up"
                                : "",
                          );
                        }}
                        options={Object.entries(actions)
                          .filter(([value]) => value.startsWith(resource + "."))
                          .map(([value, label]) => ({
                            value,
                            label,
                            icon: <Settings2 size={15} />,
                          }))}
                      />
                    )}
                  />
                </label>
                {!globalResource && (
                  <label className="grid gap-2">
                    VDOM
                    <Input {...form.register("vdom", { required: "VDOM را وارد کنید." })} />
                  </label>
                )}
                {resource !== "dns" &&
                  resource !== "ntp" &&
                  resource !== "management" &&
                  resource !== "ha" &&
                  !automaticNetworkTarget && (
                    <label className="grid gap-2">
                      {resource === "vdom"
                        ? action === "vdom.moveInterface"
                          ? "نام رابط"
                          : "نام VDOM"
                        : resource === "admin" || resource === "apiUser"
                          ? "نام حساب"
                          : resource === "policy"
                            ? isFortiPolicyCreate(action)
                              ? "نام Policy جدید"
                              : "شناسهٔ Policy"
                            : resource === "route"
                              ? "شناسهٔ مسیر"
                              : action === "interface.vlan"
                                ? "نام VLAN جدید"
                                : resource !== "interface"
                                  ? "نام شیء"
                                  : "رابط هدف"}
                      {resource !== "interface" ? (
                        <div className="grid gap-2">
                          <Input {...form.register("name", { required: "نام هدف لازم است." })} />
                          {!action.endsWith(".create") && !isFortiPolicyCreate(action) && (
                            <Select
                              label="انتخاب از موجودی قبلی"
                              value={targetName ?? ""}
                              onValueChange={(value) => form.setValue("name", value)}
                              options={selectedObjects}
                              emptyMessage="می‌توانید نام دقیق هدف را وارد کنید؛ وجود آن در پیش‌نمایش بررسی می‌شود."
                            />
                          )}
                        </div>
                      ) : action === "interface.vlan" || action.endsWith(".create") ? (
                        <Input {...form.register("name", { required: "نام رابط لازم است." })} />
                      ) : (
                        <Controller
                          control={form.control}
                          name="name"
                          rules={{ required: "رابط را انتخاب کنید." }}
                          render={({ field }) => (
                            <Select
                              label="رابط هدف"
                              value={field.value}
                              onValueChange={field.onChange}
                              options={selectedObjects}
                              emptyMessage="ابتدا موجودی رابط‌ها را تازه‌سازی کنید."
                            />
                          )}
                        />
                      )}
                    </label>
                  )}
                {action === "interface.vlan" && (
                  <>
                    <label className="grid gap-2">
                      رابط والد
                      <Controller
                        control={form.control}
                        name="parent"
                        render={({ field }) => (
                          <Select
                            label="رابط والد"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            options={interfaces}
                          />
                        )}
                      />
                    </label>
                    <label className="grid gap-2">
                      شناسهٔ VLAN
                      <Input inputMode="numeric" {...form.register("vlanId", { required: true })} />
                    </label>
                  </>
                )}
                {resource === "vdom" && (
                  <FortigateVdomFields
                    key={action}
                    form={form}
                    collection={collection}
                    busy={busy}
                  />
                )}
                {clusterResource && (
                  <FortigateClusterFields form={form} collection={collection} busy={busy} />
                )}
                {adminResource && <FortigateAdminFields form={form} busy={busy} />}
                {networkResource && (
                  <FortigateNetworkFields form={form} collection={collection} busy={busy} />
                )}
                {resource === "policy" && (
                  <FortigatePolicyFields form={form} collection={collection} />
                )}
                {resource !== "interface" &&
                  resource !== "policy" &&
                  !networkResource &&
                  !adminResource &&
                  !clusterResource &&
                  resource !== "vdom" &&
                  !action.endsWith(".delete") && (
                    <>
                      {resource === "address" && (
                        <label className="grid gap-2">
                          نوع آدرس
                          <Controller
                            control={form.control}
                            name="addressType"
                            render={({ field }) => (
                              <Select
                                label="نوع آدرس"
                                value={field.value ?? "subnet"}
                                onValueChange={field.onChange}
                                options={[
                                  "subnet",
                                  "iprange",
                                  "fqdn",
                                  "wildcard-fqdn",
                                  "geography",
                                ].map((value) => ({ value, label: value }))}
                              />
                            )}
                          />
                        </label>
                      )}
                      {resource === "service" && (
                        <label className="grid gap-2">
                          پروتکل
                          <Controller
                            control={form.control}
                            name="serviceProtocol"
                            render={({ field }) => (
                              <Select
                                label="پروتکل سرویس"
                                value={field.value ?? "TCP"}
                                onValueChange={field.onChange}
                                options={["TCP", "UDP", "TCP-UDP"].map((value) => ({
                                  value,
                                  label: value,
                                }))}
                              />
                            )}
                          />
                        </label>
                      )}
                      {resource === "vip" ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {(
                            [
                              ["externalIp", "IP خارجی"],
                              ["mappedIp", "IP مقصد"],
                              ["externalPort", "پورت خارجی"],
                              ["mappedPort", "پورت مقصد"],
                            ] as const
                          ).map(([key, label]) => (
                            <label key={key} className="grid gap-2">
                              {label}
                              <Input dir="ltr" {...form.register(key)} />
                            </label>
                          ))}
                          <label className="grid gap-2 sm:col-span-2">
                            رابط دریافت‌کننده
                            <Controller
                              control={form.control}
                              name="parent"
                              render={({ field }) => (
                                <Select
                                  label="رابط دریافت‌کننده"
                                  value={field.value ?? ""}
                                  onValueChange={field.onChange}
                                  options={[
                                    ...(action === "vip.update"
                                      ? [{ value: "", label: "بدون تغییر" }]
                                      : []),
                                    { value: "any", label: "همهٔ رابط‌ها (any)" },
                                    ...interfaces,
                                  ]}
                                />
                              )}
                            />
                          </label>
                          {action === "vip.update" && (
                            <p className="sm:col-span-2 text-xs text-muted-foreground">
                              فقط فیلدهایی که وارد می‌کنید تغییر می‌کنند؛ مقدار خالی حفظ می‌شود.
                            </p>
                          )}
                        </div>
                      ) : (
                        <label className="grid gap-2">
                          {valueLabel}
                          <Input dir="ltr" {...form.register("value")} />
                        </label>
                      )}
                      {resource === "ipPool" && (
                        <label className="grid gap-2">
                          پایان مخزن (IPv4)
                          <Input dir="ltr" {...form.register("endIp")} />
                        </label>
                      )}
                      {resource === "address" && addressType === "iprange" && (
                        <label className="grid gap-2">
                          IP پایان
                          <Input dir="ltr" {...form.register("endIp")} />
                        </label>
                      )}
                      {resource === "service" && serviceProtocol === "TCP-UDP" && (
                        <label className="grid gap-2">
                          پورت‌های UDP
                          <Input dir="ltr" {...form.register("udpPorts")} />
                        </label>
                      )}
                      {resource === "schedule" && (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="grid gap-2">
                            شروع HH:MM
                            <Input dir="ltr" placeholder="09:00" {...form.register("start")} />
                          </label>
                          <label className="grid gap-2">
                            پایان HH:MM
                            <Input dir="ltr" placeholder="17:00" {...form.register("end")} />
                          </label>
                        </div>
                      )}
                      {resource === "zone" &&
                        (action.endsWith(".create") || action.endsWith(".update")) && (
                          <label className="grid gap-2">
                            ترافیک داخل Zone
                            <Controller
                              control={form.control}
                              name="intrazone"
                              render={({ field }) => (
                                <Select
                                  label="ترافیک داخل Zone"
                                  value={field.value ?? "deny"}
                                  onValueChange={field.onChange}
                                  options={[
                                    { value: "deny", label: "مسدود" },
                                    { value: "allow", label: "مجاز" },
                                  ]}
                                />
                              )}
                            />
                          </label>
                        )}
                    </>
                  )}
                {resource === "interface" && (
                  <label className="grid gap-2">
                    {action === "interface.allowaccess"
                      ? "پروتکل‌های مجاز"
                      : action === "interface.alias"
                        ? "Alias"
                        : action === "interface.role"
                          ? "نقش"
                          : action === "interface.state"
                            ? "وضعیت"
                            : "IPv4 / CIDR"}
                    {action === "interface.allowaccess" ? (
                      <Controller
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <div className="grid grid-cols-2 gap-2 rounded-lg border p-3 sm:grid-cols-3">
                            {[
                              "ping",
                              "https",
                              "ssh",
                              "http",
                              "fgfm",
                              "snmp",
                              "radius-acct",
                              "probe-response",
                              "fabric",
                            ].map((protocol) => {
                              const selected = (field.value ?? "").split(/\s+/).filter(Boolean);
                              return (
                                <label key={protocol} className="flex items-center gap-2 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={selected.includes(protocol)}
                                    onChange={(event) =>
                                      field.onChange(
                                        (event.target.checked
                                          ? [...selected, protocol]
                                          : selected.filter((p) => p !== protocol)
                                        ).join(" "),
                                      )
                                    }
                                  />
                                  <bdi>{protocol}</bdi>
                                </label>
                              );
                            })}
                            <p className="col-span-full text-xs text-muted-foreground">
                              بدون انتخاب، دسترسی مدیریتی روی این رابط غیرفعال می‌شود.
                            </p>
                          </div>
                        )}
                      />
                    ) : action === "interface.role" || action === "interface.state" ? (
                      <Controller
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <Select
                            label="مقدار جدید"
                            value={field.value}
                            onValueChange={field.onChange}
                            options={(action === "interface.role"
                              ? ["lan", "wan", "dmz", "undefined"]
                              : ["up", "down"]
                            ).map((value) => ({ value, label: value }))}
                          />
                        )}
                      />
                    ) : (
                      <Input
                        dir="ltr"
                        placeholder={action === "interface.alias" ? "Office LAN" : "192.0.2.1/24"}
                        {...form.register("value", { required: "مقدار جدید را وارد کنید." })}
                      />
                    )}
                  </label>
                )}
              </fieldset>
              {Object.entries(form.formState.errors).map(([key, value]) => (
                <p className="text-destructive text-xs" key={key}>
                  {value.message ?? "ورودی را بررسی کنید."}
                </p>
              ))}
            </form>
          ) : (
            <div className="grid gap-4 text-sm">
              <p>{preview.message}</p>
              {preview.checks && (
                <dl className="grid gap-2 rounded-lg border p-3 text-xs">
                  {Object.entries(preview.checks).map(([key, value]) => (
                    <div className="flex justify-between gap-3" key={key}>
                      <dt>{key}</dt>
                      <dd>
                        <bdi>{value}</bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              <p>
                <bdi>{preview.name}</bdi> · <bdi>{preview.vdom}</bdi>
              </p>
              <dl className="grid gap-2">
                {Object.entries(preview.after).map(([key, value]) => (
                  <div key={key} className="rounded-lg border p-3">
                    <dt>
                      {key === "vdom" && preview.action === "vdom.moveInterface"
                        ? "VDOM مقصد"
                        : (previewLabels[key] ?? key)}
                    </dt>
                    <dd className="mt-2 flex flex-wrap gap-3">
                      <bdi>
                        {key === "exists"
                          ? preview.before[key] === "present"
                            ? "موجود"
                            : "ناموجود"
                          : (preview.before[key] ?? "ثبت نشده")}
                      </bdi>
                      <span>←</span>
                      <bdi>
                        {key === "__password"
                          ? "تنظیم خواهد شد"
                          : key === "exists"
                            ? value === "present"
                              ? "موجود"
                              : "ناموجود"
                            : value}
                      </bdi>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-muted-foreground">
                اعتبار پیش‌نمایش تا {new Date(preview.expiresAt).toLocaleTimeString("fa-IR")}
              </p>
              {outcome && (
                <p role="status" className="rounded-lg border p-3">
                  {states[outcome.status] ?? outcome.status}
                  {outcome.targetId && (
                    <span className="block">
                      شناسهٔ هدف: <bdi>{outcome.targetId}</bdi>
                    </span>
                  )}
                  {outcome.connectorInvoked &&
                    ["failed", "verification_failed"].includes(outcome.status) &&
                    "؛ ممکن است بخشی از تغییرات اعمال شده باشد. وضعیت تجهیز را بررسی کنید؛ بازگردانی خودکار انجام نشده است."}
                  {outcome.status === "verification_pending" &&
                    "؛ پس از بررسی اتصال و موجودی تجهیز، نتیجه را پیگیری کنید."}
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </AnimatedDialog>
  );
}

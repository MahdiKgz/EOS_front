"use client";
import { useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import {
  useVerifyRecorderConnectionMutation,
  type Device,
  type RecorderConnectionInput,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { Select } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

type Values = RecorderConnectionInput & { useSaved: boolean; saveConnection: boolean };
export function RecorderVerificationDialog({
  device,
  onClose,
  onVerified,
}: {
  device: Device;
  onClose: () => void;
  onVerified: () => void;
}) {
  const [open, setOpen] = useState(true),
    [error, setError] = useState("");
  const lock = useRef(false);
  const [verify, { isLoading: busy }] = useVerifyRecorderConnectionMutation();
  const form = useForm<Values>({
    defaultValues: {
      mode: device.type === "camera" ? "onvif" : "auto",
      username: "",
      password: "",
      https: false,
      useSaved: false,
      saveConnection: false,
      onvifPath: "/onvif/device_service",
      rtspPath: "",
    },
  });
  const mode = useWatch({ control: form.control, name: "mode" }),
    useSaved = useWatch({ control: form.control, name: "useSaved" });
  async function submit(values: Values) {
    if (lock.current) return;
    lock.current = true;
    setError("");
    const request = verify({
      id: device.id,
      body: values.useSaved
        ? { useSaved: true }
        : {
            username: values.username.trim(),
            password: values.password,
            mode: values.mode,
            https: !["dvrip", "rtsp"].includes(values.mode ?? "") && values.https,
            saveConnection: values.saveConnection,
            onvifPath: ["auto", "onvif"].includes(values.mode ?? "") ? values.onvifPath : undefined,
            rtspPath: values.mode === "rtsp" ? values.rtspPath : undefined,
          },
    });
    try {
      await request.unwrap();
      onVerified();
      toast.success("نتیجهٔ تأیید اتصال ذخیره شد.");
      setOpen(false);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      request.reset();
      lock.current = false;
    }
  }
  return (
    <AnimatedDialog
      open={open}
      title="تأیید اتصال دوربین / ضبط‌کننده"
      description={`برای تست اتصال به «${device.name}» اطلاعات ورود تجهیز را وارد کنید.`}
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button type="submit" form="verify-recorder" disabled={busy}>
            {busy ? "در حال تست اتصال…" : "تست اتصال"}
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      <form id="verify-recorder" onSubmit={(event) => void form.handleSubmit(submit)(event)}>
        <fieldset disabled={busy} className="grid gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...form.register("useSaved")} />
            استفاده از اتصال ذخیره‌شده
          </label>
          {!useSaved && (
            <>
              <Controller
                name="mode"
                control={form.control}
                render={({ field }) => (
                  <Select
                    label="روش اتصال"
                    value={field.value ?? "onvif"}
                    onValueChange={field.onChange}
                    disabled={busy}
                    options={[
                      ...(device.type === "camera"
                        ? []
                        : [{ value: "auto", label: "تشخیص خودکار" }]),
                      { value: "onvif", label: "ONVIF" },
                      ...(device.type === "camera"
                        ? []
                        : [
                            { value: "appweb", label: "AppWeb" },
                            { value: "dvrip", label: "DVRIP" },
                          ]),
                      { value: "rtsp", label: "RTSP" },
                    ]}
                  />
                )}
              />
              {["auto", "onvif"].includes(mode ?? "") && (
                <label className="grid gap-1">
                  مسیر سرویس ONVIF
                  <Input
                    dir="ltr"
                    maxLength={256}
                    {...form.register("onvifPath", {
                      required: !useSaved && ["auto", "onvif"].includes(mode ?? ""),
                    })}
                  />
                </label>
              )}
              {mode === "rtsp" && (
                <label className="grid gap-1">
                  مسیر جریان RTSP
                  <Input
                    dir="ltr"
                    maxLength={512}
                    placeholder="/stream"
                    {...form.register("rtspPath", { required: !useSaved && mode === "rtsp" })}
                  />
                </label>
              )}
              <label className="grid gap-1">
                نام کاربری
                <Input
                  dir="ltr"
                  maxLength={128}
                  autoComplete="off"
                  {...form.register("username", {
                    validate: (v) => useSaved || !!v.trim() || "نام کاربری را وارد کنید.",
                  })}
                />
              </label>
              <label className="grid gap-1">
                گذرواژه
                <Input
                  type="password"
                  dir="ltr"
                  maxLength={1024}
                  autoComplete="new-password"
                  {...form.register("password", {
                    validate: (v) => useSaved || !!v || "گذرواژه را وارد کنید.",
                  })}
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={["dvrip", "rtsp"].includes(mode ?? "")}
                  {...form.register("https")}
                />
                استفاده از HTTPS
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...form.register("saveConnection")} />
                ذخیرهٔ امن اتصال
              </label>
            </>
          )}
          {Object.values(form.formState.errors).length > 0 && (
            <p role="alert" className="text-destructive">
              اطلاعات الزامی اتصال را کامل کنید.
            </p>
          )}
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </fieldset>
      </form>
    </AnimatedDialog>
  );
}

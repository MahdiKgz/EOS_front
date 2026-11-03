"use client";

import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { Activity, LoaderCircle } from "lucide-react";
import { type Device, statusLabels, useTestDeviceConnectionMutation } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";

const timestamp = new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" });

export function DeviceDetailsDialog({
  device,
  canTest,
  onClose,
}: {
  device: Device;
  canTest: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [testConnection, { data, isLoading }] = useTestDeviceConnectionMutation();
  const lastSeenAt = data ? data.lastSeenAt : device.lastSeenAt;

  useEffect(() => {
    if (!data || !open) return;
    const timeout = setTimeout(() => setOpen(false), 2000);
    return () => clearTimeout(timeout);
  }, [data, open]);

  async function runTest() {
    try {
      const result = await testConnection(device.id).unwrap();
      if (result.reachable) toast.success("وضعیت دسترسی تجهیز به روزرسانی شد");
      else toast.error("پاسخی به پینگ دریافت نشد.");
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }

  return (
    <AnimatedDialog
      open={open}
      title={device.name}
      description="جزئیات تجهیز و بررسی دسترسی از سرور سامانه با ICMP"
      busy={isLoading}
      onClose={() => setOpen(false)}
      onExited={onClose}
    >
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">آدرس مدیریت</dt>
          <dd>
            <bdi>{device.host}</bdi>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">پروتکل و پورت</dt>
          <dd>
            <bdi>
              {device.protocol.toUpperCase()} · {device.managementPort}
            </bdi>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">وضعیت</dt>
          <dd aria-live="polite">{statusLabels[data?.status ?? device.status]}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">آخرین پاسخ موفق</dt>
          <dd>{lastSeenAt ? timestamp.format(new Date(lastSeenAt)) : "—"}</dd>
        </div>
      </dl>
      {canTest && (
        <div className="mt-5 space-y-3" aria-busy={isLoading}>
          <Button
            type="button"
            disabled={isLoading || !!data || !open}
            onClick={() => void runTest()}
          >
            {isLoading ? (
              <LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" />
            ) : (
              <Activity size={16} />
            )}
            {isLoading ? "در حال پینگ…" : "تست اتصال"}
          </Button>
        </div>
      )}
    </AnimatedDialog>
  );
}

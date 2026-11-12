"use client";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { type Device, useArchiveDeviceMutation } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
export function ArchiveDeviceDialog({ device, onClose }: { device: Device; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const [archive, { isLoading }] = useArchiveDeviceMutation();
  const lock = useRef(false);
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    try {
      await archive(device.id).unwrap();
      toast.success("تجهیز بایگانی شد.");
      setOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      lock.current = false;
    }
  }
  return (
    <AnimatedDialog
      open={open}
      title="بایگانی تجهیز"
      description={`«${device.name}» از فهرست تجهیزات فعال خارج می‌شود. اطلاعات ثبت‌شده باقی می‌ماند و مدیر می‌تواند تجهیز را از فهرست بایگانی بازگرداند.`}
      busy={isLoading}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-3">
          <Button
            variant="destructive"
            disabled={isLoading || !open}
            aria-busy={isLoading}
            onClick={() => {
              void submit();
            }}
          >
            {isLoading && <LoaderCircle className="size-4 animate-spin" />}
            {isLoading ? "در حال بایگانی…" : "بایگانی تجهیز"}
          </Button>
          <Button variant="outline" disabled={isLoading} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      {null}
    </AnimatedDialog>
  );
}

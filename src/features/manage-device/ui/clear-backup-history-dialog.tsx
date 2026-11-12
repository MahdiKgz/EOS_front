"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { usePreviewBackupHistoryMutation, useClearBackupHistoryMutation } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";

export type BackupHistorySelection = {
  deviceId?: string;
  companyId?: string;
  event?: string;
  search?: string;
  eventId?: string;
};

export function ClearBackupHistoryDialog({
  selection,
  onClose,
  onCleared,
}: {
  selection: BackupHistorySelection;
  onClose: () => void;
  onCleared: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [preview, { data, error, isLoading: previewing }] = usePreviewBackupHistoryMutation();
  const [clear, { isLoading: clearing }] = useClearBackupHistoryMutation();
  const lock = useRef(false);
  useEffect(() => {
    const request = preview(selection);
    return () => request.abort();
  }, [preview, selection]);
  async function submit() {
    if (lock.current || previewing || error || !data?.selectionToken) return;
    lock.current = true;
    try {
      const result = await clear({
        deviceId: selection.deviceId,
        selectionToken: data.selectionToken,
      }).unwrap();
      toast.success(`${result.deleted.toLocaleString("fa-IR")} سابقه حذف شد.`);
      onCleared();
      setOpen(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
    }
  }
  return (
    <AnimatedDialog
      open={open}
      title={selection.eventId ? "حذف سابقه" : "پاک‌کردن تاریخچه"}
      description="فایل‌های بک‌آپ باقی می‌مانند و پاک‌سازی در ممیزی ثبت می‌شود."
      busy={clearing}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button
            variant="destructive"
            disabled={!data?.selectionToken || !!error || previewing || clearing || !open}
            onClick={() => void submit()}
          >
            {clearing ? "در حال حذف…" : "تأیید حذف سوابق"}
          </Button>
          <Button variant="outline" disabled={clearing} onClick={() => setOpen(false)}>
            انصراف
          </Button>
        </div>
      }
    >
      {previewing ? (
        <p role="status" className="text-sm">
          در حال بررسی سوابق انتخاب‌شده…
        </p>
      ) : error ? (
        <div role="alert" className="grid justify-items-start gap-2 text-sm">
          <p>{apiErrorMessage(error)}</p>
          <Button variant="outline" onClick={() => void preview(selection)}>
            تلاش دوباره
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 text-sm">
          <p>
            {data?.count
              ? `${data.count.toLocaleString("fa-IR")} سابقهٔ مطابق انتخاب فعلی حذف می‌شود. سوابق جدید پس از این انتخاب حفظ می‌شوند.`
              : "سابقهٔ قابل حذفی در این انتخاب وجود ندارد."}
          </p>
          <Button variant="outline" disabled={clearing} onClick={() => void preview(selection)}>
            بررسی دوبارهٔ انتخاب
          </Button>
        </div>
      )}
    </AnimatedDialog>
  );
}

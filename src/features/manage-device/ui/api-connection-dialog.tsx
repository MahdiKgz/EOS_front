"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAssignApiCredentialMutation, type Device } from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { ApiCredentialPicker } from "./api-credential-picker";
export function AssignApiCredential({ device, onClose }: { device: Device; onClose: () => void }) {
  const [open, setOpen] = useState(true);
  const form = useForm<{ credentialId: string }>({
    defaultValues: { credentialId: device.apiCredentialId ?? "" },
  });
  const [assign] = useAssignApiCredentialMutation();
  const formId = useId(),
    lock = useRef(false);
  return (
    <AnimatedDialog
      open={open}
      title="اعتبارنامهٔ اتصال API"
      description="پس از انتخاب اعتبارنامه، از دریافت موجودی برای تست اتصال استفاده کنید."
      busy={form.formState.isSubmitting}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        <div className="flex gap-2">
          <Button form={formId} type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <LoaderCircle size={15} className="animate-spin" />}
            ذخیره اتصال
          </Button>
          <Button
            variant="outline"
            disabled={form.formState.isSubmitting}
            onClick={() => setOpen(false)}
          >
            انصراف
          </Button>
        </div>
      }
    >
      <form
        id={formId}
        className="grid gap-4"
        onSubmit={(event) => {
          void form.handleSubmit(async (body) => {
            if (lock.current) return;
            lock.current = true;
            try {
              await assign({ id: device.id, credentialId: body.credentialId }).unwrap();
              toast.success("اعتبارنامهٔ اتصال ذخیره شد.");
              setOpen(false);
            } catch (error) {
              form.setError("root", { message: apiErrorMessage(error) });
            } finally {
              lock.current = false;
            }
          })(event);
        }}
      >
        <Controller
          name="credentialId"
          control={form.control}
          rules={{ required: "اعتبارنامه را انتخاب کنید." }}
          render={({ field }) => (
            <ApiCredentialPicker
              value={field.value}
              onChange={field.onChange}
              disabled={form.formState.isSubmitting}
            />
          )}
        />
        {Object.entries(form.formState.errors).map(([key, error]) => (
          <p key={key} role="alert" className="text-sm text-destructive">
            {error?.message}
          </p>
        ))}
      </form>
    </AnimatedDialog>
  );
}

"use client";
import { useId, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { LoaderCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCiscoAccessQuery,
  useSaveCiscoAccessMutation,
  type CiscoAccess,
  type CiscoAccessOptions,
} from "@/entities/device";
import { AnimatedDialog } from "@/shared/ui/animated-dialog";
import { Button } from "@/shared/ui/button";
import { apiErrorMessage } from "@/shared/api/error-message";
import { CiscoAccessFields } from "./cisco-access-fields";
export function CiscoAccessDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const formId = useId();
  const query = useCiscoAccessQuery(id),
    [open, setOpen] = useState(true),
    [busy, setBusy] = useState(false),
    [editorVersion, setEditorVersion] = useState(0);
  return (
    <AnimatedDialog
      open={open}
      title="تنظیم اتصال Cisco"
      description="تغییر تنظیمات، تأیید اتصال و برنامهٔ پایش قبلی را بی‌اعتبار می‌کند."
      busy={busy}
      onClose={() => setOpen(false)}
      onExited={onClose}
      footer={
        query.data && !query.error ? (
          <Button type="submit" form={formId} disabled={busy}>
            {busy && <LoaderCircle size={15} className="animate-spin" />}ذخیره تنظیمات
          </Button>
        ) : undefined
      }
    >
      {query.isLoading ? (
        <p role="status">در حال دریافت تنظیمات…</p>
      ) : query.error ? (
        <div className="grid gap-3" role="alert">
          <p>{apiErrorMessage(query.error)}</p>
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw size={15} />
            تلاش دوباره
          </Button>
        </div>
      ) : (
        query.data && (
          <div className="grid gap-3">
            <Button
              type="button"
              className="justify-self-end"
              variant="outline"
              size="icon"
              aria-label="دریافت دوبارهٔ تنظیم اتصال"
              disabled={busy || query.isFetching}
              onClick={async () => {
                try {
                  await query.refetch().unwrap();
                  setEditorVersion((value) => value + 1);
                } catch (error) {
                  toast.error(apiErrorMessage(error));
                }
              }}
            >
              <RefreshCw size={15} className={query.isFetching ? "animate-spin" : ""} />
            </Button>
            <AccessEditor
              key={editorVersion}
              id={id}
              formId={formId}
              data={query.data}
              onBusy={setBusy}
              onSaved={() => setOpen(false)}
            />
          </div>
        )
      )}
    </AnimatedDialog>
  );
}
function AccessEditor({
  id,
  data,
  formId,
  onBusy,
  onSaved,
}: {
  id: string;
  data: CiscoAccess;
  formId: string;
  onBusy: (busy: boolean) => void;
  onSaved: () => void;
}) {
  const [initial] = useState(data);
  const form = useForm<{ access: CiscoAccessOptions }>({
      defaultValues: {
        access: {
          compatibilityProfile: initial.compatibilityProfile,
          enableCredentialId: initial.enableCredentialId,
        },
      },
    }),
    lock = useRef(false);
  const [save, { isLoading }] = useSaveCiscoAccessMutation(),
    [libraryBusy, setLibraryBusy] = useState(false);
  return (
    <form
      id={formId}
      className="grid gap-4"
      onSubmit={(event) =>
        void form.handleSubmit(async ({ access }) => {
          if (lock.current || libraryBusy) return;
          lock.current = true;
          onBusy(true);
          try {
            await save({ id, body: { ...access, revision: initial.revision } }).unwrap();
            toast.success("تنظیم اتصال Cisco ذخیره شد. اتصال را دوباره تست کنید.");
            onSaved();
          } catch (error) {
            form.setError("root", { message: apiErrorMessage(error) });
          } finally {
            lock.current = false;
            onBusy(false);
          }
        })(event)
      }
    >
      <Controller
        control={form.control}
        name="access"
        render={({ field }) => (
          <CiscoAccessFields
            value={field.value}
            onChange={field.onChange}
            disabled={isLoading}
            needsOwnCredential={data.needsOwnCredential && !field.value.enableCredentialId}
            onBusyChange={(busy) => {
              setLibraryBusy(busy);
              onBusy(busy);
            }}
          />
        )}
      />
      {form.formState.errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {form.formState.errors.root.message}
        </p>
      )}
      {!!data.history.length && (
        <div className="grid gap-2 border-t pt-3 text-xs">
          <h3 className="font-medium">آخرین تغییرات اتصال</h3>
          {data.history.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap justify-between gap-2 text-muted-foreground"
            >
              <span>
                {event.actorName} ·{" "}
                {event.action === "enable_credential_deleted"
                  ? "حذف اعتبارنامه"
                  : event.action === "enable_credential_changed"
                    ? "تغییر اعتبارنامه"
                    : "تنظیم پروفایل"}
              </span>
              <time>{new Date(event.occurredAt).toLocaleString("fa-IR")}</time>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

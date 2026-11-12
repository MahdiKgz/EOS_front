"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import {
  useInspectRecorderMutation,
  useRecorderSnapshotMutation,
  useVerifyRecorderStreamMutation,
  type RecorderReport,
} from "@/entities/device";
import { apiErrorMessage } from "@/shared/api/error-message";
import { Button } from "@/shared/ui/button";

const number = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const size = (bytes: number | null) =>
  bytes === null ? "نامشخص" : `${number.format(bytes / 1024 ** 3)} گیگابایت`;

export function RecorderStatus({ id }: { id: string }) {
  const [report, setReport] = useState<RecorderReport>();
  const [getReport, reporting] = useInspectRecorderMutation();
  const [getSnapshot, snapshotting] = useRecorderSnapshotMutation();
  const [verifyStream, streaming] = useVerifyRecorderStreamMutation();
  const lock = useRef(false);
  const busy = reporting.isLoading || snapshotting.isLoading || streaming.isLoading;
  const [preview, setPreview] = useState<{ jpeg: string; name: string }>();
  const [streamStatus, setStreamStatus] = useState("");
  const [error, setError] = useState("");
  async function inspect() {
    if (lock.current) return;
    lock.current = true;
    setError("");
    setReport(undefined);
    setStreamStatus("");
    setPreview(undefined);
    try {
      const data = await getReport(id).unwrap();
      setReport(data);
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      lock.current = false;
    }
  }
  async function inspectProfile(
    profile: { token: string; name: string },
    operation: "snapshot" | "stream",
  ) {
    if (lock.current) return;
    lock.current = true;
    setError("");
    setPreview(undefined);
    setStreamStatus("");
    try {
      const data =
        operation === "stream"
          ? await verifyStream({ id, token: profile.token }).unwrap()
          : await getSnapshot({ id, token: profile.token }).unwrap();
      if (operation === "stream") setStreamStatus(`جریان ویدئویی «${profile.name}» در دسترس است.`);
      else if ("jpeg" in data && typeof data.jpeg === "string")
        setPreview({ jpeg: data.jpeg, name: profile.name });
      else throw new Error("پیش‌نمایش دریافت نشد.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : apiErrorMessage(failure));
    } finally {
      lock.current = false;
    }
  }
  return (
    <section className="grid gap-4 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">کانال‌ها و فضای ذخیره‌سازی</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            وضعیت از اتصال ذخیره‌شده خوانده می‌شود.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void inspect()}>
          {busy ? "در حال دریافت…" : "دریافت وضعیت"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {report && (
        <>
          <p className="text-sm text-muted-foreground">
            {new Date(report.checkedAt).toLocaleString("fa-IR")}
          </p>
          {report.profiles && (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">پروفایل‌های ویدئویی ONVIF</h3>
              {report.profiles.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {report.profiles.map((profile, index) => (
                    <li key={`${profile.token}-${index}`} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <bdi>{profile.name}</bdi>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => void inspectProfile(profile, "snapshot")}
                        >
                          پیش‌نمایش
                        </Button>
                        <Button
                          variant="outline"
                          disabled={busy}
                          onClick={() => void inspectProfile(profile, "stream")}
                        >
                          تست جریان
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                        {profile.width && profile.height ? (
                          <bdi>
                            {profile.width} × {profile.height}
                          </bdi>
                        ) : null}
                        {profile.encoding && <bdi>{profile.encoding}</bdi>}
                        {profile.fps && <span>{number.format(profile.fps)} فریم‌برثانیه</span>}
                        {profile.audioEncoding && (
                          <span>
                            صدا <bdi>{profile.audioEncoding}</bdi>
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">پروفایلی گزارش نشد.</p>
              )}
            </div>
          )}
          {streamStatus && (
            <p role="status" className="text-sm">
              {streamStatus}
            </p>
          )}
          {preview && (
            <Image
              unoptimized
              src={`data:image/jpeg;base64,${preview.jpeg}`}
              alt={`پیش‌نمایش ${preview.name}`}
              width={640}
              height={360}
              className="h-auto max-w-full rounded-md"
            />
          )}
          <h3 className="text-sm font-semibold">کانال‌ها</h3>
          {report.configuredChannels != null && (
            <p className="text-sm">
              تعداد کانال‌های گزارش‌شده {number.format(report.configuredChannels)}
            </p>
          )}
          {report.channels?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {report.channels.map((channel) => (
                <li key={channel.index} className="rounded-md border p-3 text-sm">
                  کانال {number.format(channel.index)} ·{" "}
                  {channel.signalPresent === null
                    ? "سیگنال نامشخص"
                    : channel.signalPresent
                      ? "دارای سیگنال"
                      : "بدون سیگنال"}{" "}
                  ·{" "}
                  {channel.recording === null
                    ? "ضبط نامشخص"
                    : channel.recording
                      ? "در حال ضبط"
                      : "ضبط غیرفعال"}
                  {channel.bitrateBps !== null && (
                    <span> · {number.format(channel.bitrateBps / 1024)} کیلوبیت‌برثانیه</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {report.channels === null ? "اطلاعات کانال‌ها در دسترس نیست." : "کانالی گزارش نشد."}
            </p>
          )}
          <h3 className="text-sm font-semibold">دیسک‌ها</h3>
          {report.disks?.length ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {report.disks.map((disk, index) => (
                <li key={`${disk.id}-${index}`} className="rounded-md border p-3 text-sm">
                  دیسک {number.format(index + 1)} · ظرفیت {size(disk.capacityBytes)} · فضای آزاد{" "}
                  {size(disk.freeBytes)}
                  <span className="block text-muted-foreground">
                    وضعیت گزارش‌شده <bdi>{disk.reportedState}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {report.disks === null ? "اطلاعات دیسک‌ها در دسترس نیست." : "دیسکی گزارش نشد."}
            </p>
          )}
        </>
      )}
    </section>
  );
}

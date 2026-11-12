"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type Candidate = { host: string; port: number; https: boolean };

export function RecorderDiscovery({
  companyId,
  onSelect,
  onBusy,
}: {
  companyId?: string;
  onSelect: (candidate: Candidate) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [cidr, setCidr] = useState("");
  const [port, setPort] = useState("80");
  const [https, setHttps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Candidate[]>();

  async function discover() {
    if (!companyId || busy) return;
    setBusy(true);
    onBusy(true);
    setError("");
    setResults(undefined);
    try {
      const response = await fetch("/api/devices/discover-recorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, cidr: cidr.trim(), port: Number(port), https }),
      });
      const data = await response.json();
      if (!response.ok || !Array.isArray(data))
        throw new Error(typeof data.message === "string" ? data.message : "جست‌وجو انجام نشد.");
      setResults(data);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "جست‌وجو انجام نشد.");
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }

  return (
    <details className="grid gap-3 rounded-lg border p-3 text-sm">
      <summary className="cursor-pointer">کشف ضبط‌کننده در شبکه</summary>
      <div className="mt-3 grid gap-3">
        <label className="grid gap-1">
          شبکهٔ خصوصی
          <Input
            value={cidr}
            onChange={(event) => setCidr(event.target.value)}
            dir="ltr"
            placeholder="192.168.1.0/24"
            maxLength={32}
            disabled={busy}
          />
        </label>
        <label className="grid gap-1">
          پورت ONVIF
          <Input
            value={port}
            onChange={(event) => setPort(event.target.value)}
            dir="ltr"
            type="number"
            min={1}
            max={65535}
            disabled={busy}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={https}
            onChange={(event) => setHttps(event.target.checked)}
            disabled={busy}
          />
          HTTPS
        </label>
        <Button
          type="button"
          variant="outline"
          disabled={
            !companyId ||
            !cidr.trim() ||
            !Number.isInteger(Number(port)) ||
            Number(port) < 1 ||
            Number(port) > 65535 ||
            busy
          }
          onClick={() => void discover()}
        >
          {busy ? "در حال جست‌وجو…" : "جست‌وجوی شبکه"}
        </Button>
        {!companyId && <p>ابتدا شرکت مالک را انتخاب کنید.</p>}
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        {results?.length === 0 && <p role="status">پاسخ قابل شناسایی ONVIF دریافت نشد.</p>}
        {!!results?.length && (
          <ul className="grid max-h-48 gap-2 overflow-auto">
            {results.map((candidate) => (
              <li key={candidate.host}>
                <Button type="button" variant="outline" onClick={() => onSelect(candidate)}>
                  انتخاب{" "}
                  <bdi>
                    {candidate.host}:{candidate.port}
                  </bdi>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}

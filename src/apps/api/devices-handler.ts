import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/shared/auth/backend";
import { SESSION_COOKIE } from "@/shared/auth/config";
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
export async function handleDevices(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  const uuid = /^[a-f0-9-]{36}$/;
  const isDeviceActions =
    uuid.test(path[0] ?? "") &&
    path[1] === "actions" &&
    (path.length === 2 ||
      (path.length === 3 && path[2] === "preview") ||
      (path.length === 4 && uuid.test(path[2]) && ["execute", "verify"].includes(path[3])));
  const isCiscoAccess = path.length === 2 && uuid.test(path[0]) && path[1] === "cisco-access";
  const isMonitoring =
    uuid.test(path[0] ?? "") &&
    path[1] === "monitoring" &&
    (path.length === 2 || (path.length === 3 && path[2] === "collect"));
  const isCapabilities =
    uuid.test(path[0] ?? "") &&
    path[1] === "capabilities" &&
    (path.length === 2 || (path.length === 3 && path[2] === "refresh"));
  const isChannels =
    uuid.test(path[0] ?? "") &&
    path[1] === "connection-channels" &&
    (path.length === 2 ||
      (path.length === 3 && ["state", "test-primary", "test-secondary"].includes(path[2])));
  const isTerminal =
    uuid.test(path[0] ?? "") &&
    path[1] === "terminal" &&
    (path.length === 2 ||
      (path.length === 3 && ["preview", "sessions"].includes(path[2])) ||
      (path.length === 4 && path[2] === "sessions" && uuid.test(path[3])) ||
      (path.length === 5 &&
        path[2] === "sessions" &&
        uuid.test(path[3]) &&
        ["input", "resize", "close"].includes(path[4])));
  const isBackupCatalog = path.length === 1 && path[0] === "backups-catalog";
  const isAssetsOverview = path.length === 1 && path[0] === "assets-overview";
  const isBackupActivity =
    path.length === 1 &&
    ["backup-activity", "backup-activity-preview", "backup-activity-clear"].includes(path[0]);
  const isBackups = path.length === 2 && path[1] === "backups";
  const isBackupFile =
    path.length === 3 && path[1] === "backups" && /^[a-f0-9-]{36}$/.test(path[2]);
  const isBackupReview =
    path.length === 4 &&
    path[1] === "backups" &&
    /^[a-f0-9-]{36}$/.test(path[2]) &&
    path[3] === "review";
  const isBackupUpload = path.length === 2 && path[1] === "backup-upload";
  const isBackupRestores = path.length === 2 && path[1] === "backup-restores";
  const isBackupRestoreExecute =
    path.length === 4 &&
    path[1] === "backup-restores" &&
    /^[a-f0-9-]{36}$/.test(path[2]) &&
    ["execute", "verify"].includes(path[3]);
  const isRegistrationDraft = path.length === 1 && path[0] === "registration-draft";
  const isCatalog =
    path.length === 1 &&
    [
      "companies",
      "credentials",
      "snmp-credentials",
      "api-credentials",
      "cisco-enable-credentials",
      "action-secrets",
    ].includes(path[0]);
  const isCredential =
    path.length === 2 &&
    [
      "credentials",
      "snmp-credentials",
      "api-credentials",
      "cisco-enable-credentials",
      "action-secrets",
    ].includes(path[0]) &&
    /^[a-f0-9-]{36}$/.test(path[1]);
  const isDraftConnection =
    path.length === 1 && ["draft-connection", "discover-recorders"].includes(path[0]);
  const isApiCredential = path.length === 2 && uuid.test(path[0]) && path[1] === "api-credential";
  const isConnectionTest = path.length === 2 && path[1] === "test-connection";
  const isManagementTest =
    path.length === 2 &&
    [
      "api-inventory",
      "esxi-inventory",
      "esxi-ssh-inventory",
      "linux-ssh",
      "verify-recorder",
      "inspect-recorder",
      "recorder-snapshot",
      "verify-recorder-stream",
      "backup-history-preview",
      "backup-history-clear",
      "backup-restore-preview",
    ].includes(path[1]);
  const isRestore = path.length === 2 && path[1] === "restore";
  const isHistory = path.length === 2 && ["history", "inventory-events"].includes(path[1]);
  if (
    (path.length > 1 &&
      !isDeviceActions &&
      !isCiscoAccess &&
      !isCapabilities &&
      !isMonitoring &&
      !isApiCredential &&
      !isChannels &&
      !isTerminal &&
      !isBackups &&
      !isBackupFile &&
      !isBackupReview &&
      !isBackupUpload &&
      !isBackupRestores &&
      !isBackupRestoreExecute &&
      !isConnectionTest &&
      !isHistory &&
      !isRestore &&
      !isManagementTest &&
      !isCredential) ||
    (path.length &&
      !isDraftConnection &&
      !isBackupCatalog &&
      !isAssetsOverview &&
      !isBackupActivity &&
      !isRegistrationDraft &&
      !isCatalog &&
      !isCredential &&
      !/^[a-f0-9-]{36}$/.test(path[0]))
  )
    return json({ message: "مسیر پیدا نشد." }, 404);
  const allowed = isDeviceActions
    ? [path.length === 2 ? "GET" : "POST"]
    : isCiscoAccess
      ? ["GET", "PUT"]
      : isCapabilities
        ? [path.length === 2 ? "GET" : "POST"]
        : isMonitoring
          ? path.length === 2
            ? ["GET", "PUT"]
            : ["POST"]
          : isApiCredential
            ? ["PUT"]
            : isChannels
              ? path.length === 2
                ? ["GET", "PUT"]
                : path[2] === "state"
                  ? ["PUT"]
                  : ["POST"]
              : isAssetsOverview
                ? ["GET"]
                : isTerminal
                  ? [path.length === 2 || path.length === 4 ? "GET" : "POST"]
                  : isBackupActivity
                    ? [path[0] === "backup-activity" ? "GET" : "POST"]
                    : isBackupRestores
                      ? ["GET"]
                      : isBackupRestoreExecute
                        ? ["POST"]
                        : isBackupCatalog
                          ? ["GET"]
                          : isBackupReview
                            ? ["GET"]
                            : isBackupUpload
                              ? ["POST"]
                              : isBackups
                                ? ["GET", "POST"]
                                : isBackupFile
                                  ? ["GET", "DELETE"]
                                  : isRegistrationDraft
                                    ? ["GET", "PUT", "DELETE"]
                                    : isCatalog
                                      ? ["GET", "POST"]
                                      : isCredential
                                        ? ["PUT", "DELETE"]
                                        : isConnectionTest ||
                                            isRestore ||
                                            isManagementTest ||
                                            isDraftConnection
                                          ? ["POST"]
                                          : isHistory
                                            ? ["GET"]
                                            : path.length
                                              ? ["GET", "PUT", "DELETE"]
                                              : ["GET", "POST"];
  if (!allowed.includes(request.method)) return json({ message: "روش درخواست مجاز نیست." }, 405);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "وارد حساب کاربری شوید." }, 401);
  let body: unknown;
  let binary: ArrayBuffer | undefined;
  if (request.method !== "GET") {
    if (request.headers.get("origin") !== request.nextUrl.origin)
      return json({ message: "درخواست معتبر نیست." }, 403);
    if (isBackupUpload) {
      if (request.headers.get("content-type") !== "application/octet-stream" || !request.body)
        return json({ message: "فایل بک‌آپ معتبر نیست." }, 400);
      const maxBytes = 20 * 1024 * 1024;
      if (Number(request.headers.get("content-length")) > maxBytes)
        return json({ message: "حجم فایل نباید بیشتر از ۲۰ مگابایت باشد." }, 413);
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let length = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          length += value.length;
          if (length > maxBytes) {
            await reader.cancel();
            return json({ message: "حجم فایل نباید بیشتر از ۲۰ مگابایت باشد." }, 413);
          }
          chunks.push(value);
        }
      } catch {
        return json({ message: "دریافت فایل کامل نشد. دوباره تلاش کنید." }, 400);
      } finally {
        reader.releaseLock();
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      binary = bytes.buffer;
    } else if (
      (request.method !== "DELETE" || path[0] === "action-secrets") &&
      !isConnectionTest &&
      !isRestore &&
      !isBackups
    ) {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return json({ message: "داده درخواست معتبر نیست." }, 400);
      const raw = await request.text();
      if (
        new TextEncoder().encode(raw).length >
        (isTerminal ? 96 * 1024 : path[0] === "api-credentials" ? 32 * 1024 : 16384)
      )
        return json({ message: "حجم درخواست بیش از حد مجاز است." }, 413);
      try {
        body = JSON.parse(raw);
      } catch {
        return json({ message: "داده درخواست معتبر نیست." }, 400);
      }
    }
  }
  const query = new URLSearchParams();
  const keys = new Set([
    "companyId",
    "inventory",
    "search",
    "type",
    "status",
    "environment",
    "category",
    "sort",
    "direction",
    "page",
    "pageSize",
  ]);
  for (const [key, value] of request.nextUrl.searchParams) {
    if (
      !keys.has(key) &&
      !(isMonitoring && key === "range") &&
      !(isAssetsOverview && key === "filter") &&
      !(isTerminal && path.length === 4 && key === "cursor") &&
      !(isRegistrationDraft && key === "revision") &&
      !(isBackupCatalog && ["companyId", "origin"].includes(key)) &&
      !(isBackupActivity && ["companyId", "event"].includes(key)) &&
      !(isBackups && key === "event")
    )
      return json({ message: "پارامتر درخواست معتبر نیست." }, 400);
    query.append(key, value);
  }
  try {
    const upstream = await backendRequest(
      `/devices${path.length ? `/${path.join("/")}` : ""}${query.size ? `?${query}` : ""}`,
      {
        method: request.method,
        token,
        body,
        binary,
        filename: isBackupUpload ? (request.headers.get("x-backup-filename") ?? "") : undefined,
        timeoutMs: isDeviceActions
          ? 180000
          : isCapabilities && path[2] === "refresh"
            ? 70000
            : isMonitoring && path[2] === "collect"
              ? 240000
              : path[1] === "esxi-ssh-inventory"
                ? 45000
                : path[1] === "esxi-inventory" ||
                    path[1] === "api-inventory" ||
                    path[0] === "draft-connection" ||
                    (isChannels && ["test-primary", "test-secondary"].includes(path[2]))
                  ? 200000
                  : path[3] === "verify"
                    ? 200000
                    : path[1] === "backup-restore-preview"
                      ? 260000
                      : (isBackups && request.method === "POST") ||
                          path[0] === "backup-activity-clear"
                        ? 85000
                        : undefined,
      },
    );
    return json(await upstream.json(), upstream.status);
  } catch {
    return json({ message: "ارتباط با سرویس تجهیزات برقرار نشد. دوباره تلاش کنید." }, 503);
  }
}

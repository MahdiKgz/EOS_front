import "server-only";

export function backendRequest(
  path: string,
  options: {
    token?: string;
    body?: unknown;
    method?: string;
    userAgent?: string;
    timeoutMs?: number;
    binary?: ArrayBuffer;
    filename?: string;
  } = {},
) {
  const base = (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000/api/v1").replace(/\/$/, "");
  return fetch(`${base}${path}`, {
    method: options.method ?? "GET",
    headers: {
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.binary
        ? {
            "Content-Type": "application/octet-stream",
            "X-Backup-Filename": options.filename ?? "",
          }
        : {}),
      ...(options.userAgent ? { "User-Agent": options.userAgent } : {}),
    },
    body: options.binary ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 20000),
  });
}

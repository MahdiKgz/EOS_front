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
  const isCatalog = path.length === 1 && ["companies", "credentials"].includes(path[0]);
  const isCredential =
    path.length === 2 && path[0] === "credentials" && /^[a-f0-9-]{36}$/.test(path[1]);
  const isDraftConnection = path.length === 1 && path[0] === "draft-connection";
  const isConnectionTest = path.length === 2 && path[1] === "test-connection";
  const isLinuxSsh = path.length === 2 && path[1] === "linux-ssh";
  const isHistory = path.length === 2 && path[1] === "history";
  if (
    (path.length > 1 && !isConnectionTest && !isHistory && !isLinuxSsh && !isCredential) ||
    (path.length &&
      !isDraftConnection &&
      !isCatalog &&
      !isCredential &&
      !/^[a-f0-9-]{36}$/.test(path[0]))
  )
    return json({ message: "مسیر پیدا نشد." }, 404);
  const allowed = isCatalog
    ? ["GET", "POST"]
    : isCredential
      ? ["PUT", "DELETE"]
      : isConnectionTest || isLinuxSsh || isDraftConnection
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
  if (request.method !== "GET") {
    if (request.headers.get("origin") !== request.nextUrl.origin)
      return json({ message: "درخواست معتبر نیست." }, 403);
    if (request.method !== "DELETE" && !isConnectionTest) {
      if (!request.headers.get("content-type")?.startsWith("application/json"))
        return json({ message: "داده درخواست معتبر نیست." }, 400);
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > 16384)
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
    if (!keys.has(key)) return json({ message: "پارامتر درخواست معتبر نیست." }, 400);
    query.append(key, value);
  }
  try {
    const upstream = await backendRequest(
      `/devices${path.length ? `/${path.join("/")}` : ""}${query.size ? `?${query}` : ""}`,
      { method: request.method, token, body },
    );
    return json(await upstream.json(), upstream.status);
  } catch {
    return json({ message: "ارتباط با سرویس تجهیزات برقرار نشد. دوباره تلاش کنید." }, 503);
  }
}

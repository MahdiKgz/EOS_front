import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/shared/auth/backend";
import { SESSION_COOKIE } from "@/shared/auth/config";

const actions = new Set(["login", "register", "me", "logout", "forget-password", "reset-password"]);
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
function clearCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function handleAuth(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!actions.has(action)) return json({ message: "مسیر پیدا نشد." }, 404);
  if ((action === "me" && request.method !== "GET") || (action !== "me" && request.method !== "POST")) return json({ message: "روش درخواست مجاز نیست." }, 405);
  let body: unknown;
  if (request.method === "POST") {
    if (request.headers.get("origin") !== request.nextUrl.origin || !request.headers.get("content-type")?.startsWith("application/json")) return json({ message: "درخواست معتبر نیست." }, 403);
    if (Number(request.headers.get("content-length") ?? 0) > 8192) return json({ message: "حجم درخواست بیش از حد مجاز است." }, 413);
    try { body = await request.json(); } catch { return json({ message: "داده درخواست معتبر نیست." }, 400); }
  }
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if ((action === "me" || action === "logout") && !token) return action === "logout" ? clearCookie(json({ message: "از حساب خارج شدید." })) : clearCookie(json({ message: "وارد حساب کاربری شوید." }, 401));
  try {
    const upstream = await backendRequest(`/auth/${action}`, {
      method: request.method, body, token: action === "me" || action === "logout" ? token : undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    const data: unknown = await upstream.json();
    if (action === "logout" && (upstream.ok || upstream.status === 401)) return clearCookie(json({ message: "از حساب کاربری خارج شدید." }));
    if (!upstream.ok) {
      const response = json(data, upstream.status);
      if (upstream.headers.has("retry-after")) response.headers.set("Retry-After", upstream.headers.get("retry-after")!);
      return upstream.status === 401 && action === "me" ? clearCookie(response) : response;
    }
    if (action === "login" || action === "register") {
      if (!data || typeof data !== "object" || !("accessToken" in data) || typeof data.accessToken !== "string" || !("expiresAt" in data) || typeof data.expiresAt !== "string" || !("user" in data)) return json({ message: "پاسخ سرویس ورود معتبر نیست." }, 502);
      const expires = new Date(data.expiresAt);
      if (!Number.isFinite(expires.getTime()) || expires <= new Date()) return json({ message: "نشست معتبر صادر نشد." }, 502);
      const response = json({ user: data.user }, upstream.status);
      response.cookies.set(SESSION_COOKIE, data.accessToken, { ...cookieOptions, expires });
      return response;
    }
    return json(data, upstream.status);
  } catch { return json({ message: "ارتباط با سامانه برقرار نشد. کمی بعد دوباره تلاش کنید." }, 503); }
}

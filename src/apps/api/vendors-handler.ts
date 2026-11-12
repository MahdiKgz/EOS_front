import { NextRequest, NextResponse } from "next/server";
import { backendRequest } from "@/shared/auth/backend";
import { SESSION_COOKIE } from "@/shared/auth/config";
const keys = new Set(["linux", "mikrotik", "fortigate", "cisco", "sophos", "esxi", "pfsense"]);
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Cookie" },
  });
export async function handleVendors(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;
  if (path.length > 1 || (path.length === 1 && !keys.has(path[0])))
    return json({ message: "مسیر پیدا نشد." }, 404);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: "وارد حساب کاربری شوید." }, 401);
  const allowed = path.length
    ? ["companyId", "search", "status", "page", "pageSize"]
    : ["companyId", "search", "state"];
  for (const key of request.nextUrl.searchParams.keys())
    if (!allowed.includes(key)) return json({ message: "پارامتر درخواست معتبر نیست." }, 400);
  try {
    const upstream = await backendRequest(
      `/vendors${path.length ? `/${path[0]}` : ""}${request.nextUrl.search ? request.nextUrl.search : ""}`,
      { method: "GET", token },
    );
    return json(await upstream.json(), upstream.status);
  } catch {
    return json({ message: "ارتباط با سرویس وندورها برقرار نشد. دوباره تلاش کنید." }, 503);
  }
}

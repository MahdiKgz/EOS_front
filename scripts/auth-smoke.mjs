import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const backendRequire = createRequire(new URL("../../EOS_Back/package.json", import.meta.url));
const { Client } = backendRequire("pg");
const { config } = backendRequire("dotenv");
config({ path: fileURLToPath(new URL("../../EOS_Back/.env", import.meta.url)), quiet: true });
const base = process.env.FRONTEND_TEST_URL ?? "http://localhost:3000";
const origin = new URL(base).origin;
const request = (path, { body, cookie, originHeader = origin } = {}) =>
  fetch(base + path, {
    redirect: "manual",
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json", origin: originHeader }),
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const db = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});
let userId;
try {
  await db.connect();
  const guest = await request("/dashboard");
  assert.ok([303, 307, 308].includes(guest.status));
  assert.match(guest.headers.get("location"), /\/login$/);
  const username = "webcheck_" + Date.now();
  const input = {
    username,
    displayName: "کاربر اتصال آزمایشی",
    email: username + "@example.com",
    password: "Web-AccountPass-5276",
  };
  const registration = await request("/api/auth/register", { body: input });
  assert.equal(registration.status, 201);
  const data = await registration.json();
  userId = data.user.id;
  assert.equal(data.user.role, "co_employee");
  assert.equal("accessToken" in data, false);
  assert.equal("passwordHash" in data.user, false);
  const header = registration.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith("eosnet_session="));
  assert.ok(header);
  assert.match(header, /httponly/i);
  assert.match(header, /samesite=lax/i);
  const cookie = header.split(";")[0];
  assert.equal((await request("/api/auth/me", { cookie })).status, 200);
  for (const path of ["/login", "/register", "/forget-password"]) {
    const response = await request(path, { cookie });
    assert.ok([303, 307, 308].includes(response.status), path);
    assert.match(response.headers.get("location"), /\/dashboard$/);
  }
  const dashboard = await request("/dashboard", { cookie });
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /کاربر اتصال آزمایشی/);
  assert.equal(
    (
      await request("/api/auth/logout", {
        cookie,
        body: {},
        originHeader: "https://untrusted.example",
      })
    ).status,
    403,
  );
  assert.equal((await request("/api/auth/me", { cookie })).status, 200);
  const forged = cookie.slice(0, -8) + "tampered";
  assert.equal((await request("/api/auth/me", { cookie: forged })).status, 401);
  assert.equal((await request("/login", { cookie: forged })).status, 200);
  assert.ok([303, 307, 308].includes((await request("/dashboard", { cookie: forged })).status));
  const logout = await request("/api/auth/logout", { cookie, body: {} });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /max-age=0/i);
  assert.equal((await request("/api/auth/me", { cookie })).status, 401);
  const bad = await request("/api/auth/login", { body: { username, password: "incorrect" } });
  assert.equal(bad.status, 401);
  const login = await request("/api/auth/login", { body: { username, password: input.password } });
  assert.equal(login.status, 200);
  assert.equal("accessToken" in (await login.json()), false);
  const hashed = await db.query('SELECT "passwordHash" FROM app_users WHERE id = $1', [userId]);
  assert.notEqual(hashed.rows[0].passwordHash, input.password);
  assert.match(hashed.rows[0].passwordHash, /^\$2/);
  console.log(
    "PASS: BFF signup/login/logout, HttpOnly cookie, token redaction, live session validation, dashboard guard, auth-page redirects, forged-cookie rejection, CSRF rejection and hashed password storage.",
  );
} finally {
  if (userId) await db.query("DELETE FROM app_users WHERE id = $1", [userId]);
  await db.end();
}

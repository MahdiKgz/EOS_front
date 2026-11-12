import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
const require = createRequire(import.meta.url),
  ts = require("typescript"),
  next = require("next/server"),
  calls = [];
const source = await readFile(
  new URL("../src/apps/api/devices-handler.ts", import.meta.url),
  "utf8",
);
const output = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const sandbox = {
  exports: {},
  URLSearchParams,
  TextEncoder,
  Uint8Array,
  Response,
  require(name) {
    if (name === "next/server") return next;
    if (name === "@/shared/auth/config") return { SESSION_COOKIE: "synthetic_session" };
    if (name === "@/shared/auth/backend")
      return {
        backendRequest: async (path, options) => {
          calls.push({ path, ...options });
          return new Response(JSON.stringify({ deleted: true }), { status: 200 });
        },
      };
    throw Error("Unexpected module");
  },
};
vm.runInNewContext(output, sandbox);
const id = "12345678-1234-4234-8234-123456789012",
  revision = "87654321-1234-4234-8234-123456789012";
async function invoke(path, method, body, { token = true, origin = "http://fixture.local" } = {}) {
  const request = new next.NextRequest("http://fixture.local/api/devices/" + path, {
    method,
    headers: {
      origin,
      ...(token ? { cookie: "synthetic_session=fixture-only" } : {}),
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return sandbox.exports.handleDevices(request, {
    params: Promise.resolve({ path: path.split("/") }),
  });
}
assert.equal((await invoke("action-secrets", "GET")).status, 200);
assert.equal(
  (
    await invoke("action-secrets", "POST", {
      name: "Synthetic",
      purpose: "admin_password",
      value: "test-only",
    })
  ).status,
  200,
);
assert.equal(calls.at(-1).path, "/devices/action-secrets");
assert.equal(
  (
    await invoke("action-secrets/" + id, "PUT", {
      name: "Synthetic",
      purpose: "admin_password",
      value: "updated-test-only",
      revision,
    })
  ).status,
  200,
);
assert.equal((await invoke("action-secrets/" + id, "DELETE", { revision })).status, 200);
assert.equal(calls.at(-1).body.revision, revision);
assert.equal(calls.at(-1).method, "DELETE");
let count = calls.length;
assert.equal((await invoke("action-secrets", "GET", undefined, { token: false })).status, 401);
assert.equal(
  (await invoke("action-secrets/" + id, "DELETE", { revision }, { origin: "http://foreign.local" }))
    .status,
  403,
);
assert.equal((await invoke("action-secrets/invalid", "DELETE", { revision })).status, 404);
assert.equal((await invoke("action-secrets/" + id + "/extra", "DELETE", { revision })).status, 404);
assert.equal((await invoke("action-secrets", "DELETE", { revision })).status, 405);
assert.equal(calls.length, count);
assert.equal((await invoke(id, "DELETE")).status, 200);
assert.equal(calls.at(-1).body, undefined);
console.log(
  "Device secrets BFF: real handler/NextRequest, list/create/update/delete routing, preserved optimistic revision on DELETE, cookie/origin/method/UUID boundaries and legacy archive without body passed.",
);

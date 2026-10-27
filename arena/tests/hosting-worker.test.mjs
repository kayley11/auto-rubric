import assert from "node:assert/strict";
import test from "node:test";
import worker from "../hosting/worker.js";

const origin = "https://arena.example.test";
const snapshot = {
  "/api/config": { file: "config.body", content_type: "application/json" },
  "/api/study": { file: "study.body", content_type: "application/json" },
};
function environment(extra = {}) {
  return {
    ASSETS: {
      async fetch(input) {
        const url = new URL(
          typeof input === "object" && input.url ? input.url : input,
        );
        if (url.pathname === "/_public/manifest.json")
          return Response.json(snapshot);
        if (url.pathname === "/_public/config.body")
          return Response.json({ access: { online: false } });
        if (url.pathname === "/_public/study.body")
          return Response.json({ interviews: 24 });
        return new Response("not found", { status: 404 });
      },
    },
    ...extra,
  };
}

test("public study snapshots work without a backend or login", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/study"),
    environment(),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { interviews: 24 });
  assert.equal(response.headers.get("X-Arena-Snapshot"), "1");
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
});

test("cross-origin writes fail before contacting the backend", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/runs", {
      method: "POST",
      headers: { Origin: "https://other.example" },
      body: "{}",
    }),
    environment(),
  );
  assert.equal(response.status, 403);
});

test("offline writes fail clearly, private runs never fall back to public snapshots", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/runs", {
      method: "POST",
      headers: { Origin: origin },
      body: "{}",
    }),
    environment(),
  );
  assert.equal(response.status, 503);
  const privateRun = await worker.fetch(
    new Request(origin + "/api/runs/abc", {
      headers: { Cookie: "arena_session=example-session" },
    }),
    environment(),
  );
  assert.equal(privateRun.status, 503);
  const config = await worker.fetch(
    new Request(origin + "/api/config"),
    environment(),
  );
  assert.equal((await config.json()).access.online, false);
});

test("proxy sets its own bridge header and forwards only the application session", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(
      new URL(url).origin,
      "https://local-example.trycloudflare.com",
    );
    assert.equal(
      options.headers.get("X-Arena-Bridge"),
      "private-server-side-secret",
    );
    assert.equal(
      options.headers.get("Cookie"),
      "arena_session=example-session",
    );
    assert.equal(options.headers.get("Authorization"), null);
    assert.equal(options.redirect, "manual");
    return Response.json({ access: { authenticated: true } });
  };
  try {
    const response = await worker.fetch(
      new Request(origin + "/api/config", {
        headers: {
          Cookie:
            "platform_cookie=not-forwarded; arena_session=example-session",
          "X-Arena-Bridge": "untrusted-client-value",
          Authorization: "not-forwarded",
        },
      }),
      environment({
        BACKEND_ORIGIN: "https://local-example.trycloudflare.com",
        ARENA_BRIDGE_SECRET: "private-server-side-secret",
      }),
    );
    assert.equal((await response.json()).access.authenticated, true);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("logout clears the application cookie even when the computer is offline", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/access/logout", {
      method: "POST",
      headers: { Origin: origin },
      body: "{}",
    }),
    environment(),
  );
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("Set-Cookie"),
    /HttpOnly; Secure; SameSite=Strict; Max-Age=0/,
  );
});

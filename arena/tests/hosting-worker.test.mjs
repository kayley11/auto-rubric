import assert from "node:assert/strict";
import test from "node:test";
import worker from "../hosting/worker.js";

const origin = "https://arena.example.test";
const snapshot = {
  "/api/config": { file: "config.body", content_type: "application/json" },
  "/api/study": { file: "study.body", content_type: "application/json" },
  "/api/runs": { file: "runs.body", content_type: "application/json" },
  "/api/comparison": {
    file: "comparison.body",
    content_type: "application/json",
  },
  "/api/comparison/cases/N01": {
    file: "case.body",
    content_type: "application/json",
  },
  "/api/comparison/cases/SR01": {
    file: "series.body",
    content_type: "application/json",
  },
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
        if (url.pathname === "/_public/runs.body") return Response.json([]);
        if (url.pathname === "/_public/comparison.body")
          return Response.json({ case_count: 33, source: "snapshot" });
        if (url.pathname === "/_public/case.body")
          return Response.json({ id: "N01", source: "snapshot" });
        if (url.pathname === "/_public/series.body")
          return Response.json({ id: "SR01", source: "snapshot", clinical_status: "awaiting confirmation" });
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

test("zero-shot comparison never uses public snapshots and requires a workspace session", async () => {
  const path = origin + "/api/result-comparison";
  assert.equal((await worker.fetch(new Request(path), environment())).status, 401);
  const headers = { Cookie: "arena_session=test-session" };
  assert.equal((await worker.fetch(new Request(path, { headers }), environment())).status, 503);
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.headers.get("Cookie"), headers.Cookie);
      return Response.json({ error: "Session rejected by backend" }, { status: 403 });
    };
    const response = await worker.fetch(new Request(path, { headers }), environment({
      BACKEND_ORIGIN: "https://example.trycloudflare.com", ARENA_BRIDGE_SECRET: "test-only-bridge",
    }));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("X-Arena-Snapshot"), null);
  } finally {
    globalThis.fetch = previous;
  }
});

test("five-model comparison is public and falls back to saved case results", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/comparison/cases/N01"),
    environment(),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "N01", source: "snapshot" });
  const original = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (url) => {
      calls++;
      assert.equal(new URL(url).pathname, "/api/comparison");
      return Response.json({ case_count: 33, source: "live" });
    };
    const env = environment({
      ARENA_BRIDGE_SECRET: "test-only-bridge",
      BACKEND_ORIGIN: "https://example.trycloudflare.com",
    });
    const live = await worker.fetch(
      new Request(origin + "/api/comparison"),
      env,
    );
    assert.equal((await live.json()).source, "live");
    assert.equal(calls, 1);
    globalThis.fetch = async () => new Response("old backend", { status: 404 });
    const fallback = await worker.fetch(
      new Request(origin + "/api/comparison"),
      env,
    );
    assert.equal((await fallback.json()).source, "snapshot");
  } finally {
    globalThis.fetch = original;
  }
});

test("case-series results are public offline and unknown task IDs are rejected", async () => {
  const response = await worker.fetch(
    new Request(origin + "/api/comparison/cases/SR01"), environment(),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: "SR01", source: "snapshot", clinical_status: "awaiting confirmation",
  });
  const invalid = await worker.fetch(
    new Request(origin + "/api/comparison/cases/SR11"), environment(),
  );
  assert.equal(invalid.status, 404);
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

test("a retained login cookie does not block public study browsing during an outage", async () => {
  const headers = { Cookie: "arena_session=previously-issued-session" };
  const config = await worker.fetch(
    new Request(origin + "/api/config", { headers }),
    environment(),
  );
  assert.equal((await config.json()).access.online, false);
  const study = await worker.fetch(
    new Request(origin + "/api/study", { headers }),
    environment(),
  );
  assert.equal(study.status, 200);
  assert.deepEqual(await study.json(), { interviews: 24 });
  const runs = await worker.fetch(
    new Request(origin + "/api/runs", { headers }),
    environment(),
  );
  assert.deepEqual(await runs.json(), []);
  assert.equal(runs.headers.get("X-Arena-Snapshot"), "1");
  const privateRun = await worker.fetch(
    new Request(origin + "/api/runs/private-id", { headers }),
    environment(),
  );
  assert.equal(privateRun.status, 503);
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

function database(row = null) {
  return {
    row,
    prepare() {
      const db = this;
      return {
        first: async () => db.row,
        bind(origin, issued_at, expires_at, registration_id) {
          return {
            async run() {
              db.row = { origin, issued_at, expires_at, registration_id };
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}
async function mac(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return Array.from(
    new Uint8Array(
      await crypto.subtle.sign("HMAC", key, encoder.encode(message)),
    ),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
}
async function recoveryRequest(
  secret,
  address,
  stamp = Math.floor(Date.now() / 1000),
) {
  const body = JSON.stringify({
    origin: address,
    registration_id: "a".repeat(32),
  });
  const signature = await mac(
    secret,
    `POST\n/api/host/connection\n${stamp}\n${body}`,
  );
  return new Request(origin + "/api/host/connection", {
    method: "POST",
    body,
    headers: { "X-Arena-Time": String(stamp), "X-Arena-Signature": signature },
  });
}

test("recovery rejects unsigned, altered and expired updates", async () => {
  const db = database();
  const env = environment({
    DB: db,
    ARENA_BRIDGE_SECRET: "test-only-recovery-key",
  });
  const unsigned = await worker.fetch(
    new Request(origin + "/api/host/connection", {
      method: "POST",
      body: "{}",
    }),
    env,
  );
  assert.equal(unsigned.status, 403);
  const wrong = await worker.fetch(
    await recoveryRequest("wrong-key", "https://new.trycloudflare.com"),
    env,
  );
  assert.equal(wrong.status, 403);
  const expired = await worker.fetch(
    await recoveryRequest(
      env.ARENA_BRIDGE_SECRET,
      "https://new.trycloudflare.com",
      Math.floor(Date.now() / 1000) - 100,
    ),
    env,
  );
  assert.equal(expired.status, 403);
  assert.equal(db.row, null);
});

test("a verified new address replaces the connection without republishing", async () => {
  const secret = "test-only-recovery-key";
  const db = database();
  const env = environment({
    DB: db,
    ARENA_BRIDGE_SECRET: secret,
    BACKEND_ORIGIN: "https://old.trycloudflare.com",
  });
  const previous = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    calls.push(url);
    assert.equal(url.origin, "https://new.trycloudflare.com");
    if (url.pathname === "/healthz") {
      assert.equal(options.headers, undefined);
      return Response.json({
        ok: true,
        proof: await mac(
          secret,
          "AutoRubric probe\n" + url.searchParams.get("probe_nonce"),
        ),
      });
    }
    assert.equal(options.headers.get("X-Arena-Bridge"), secret);
    return Response.json({ access: { hosted: true, online: true } });
  };
  try {
    const registered = await worker.fetch(
      await recoveryRequest(secret, "https://new.trycloudflare.com"),
      env,
    );
    assert.equal(registered.status, 200);
    assert.equal((await registered.json()).registered, true);
    assert.equal(db.row.origin, "https://new.trycloudflare.com");
    assert.equal(db.row.expires_at - db.row.issued_at, 180);
    const config = await worker.fetch(new Request(origin + "/api/config"), env);
    assert.equal((await config.json()).access.online, true);
    assert.equal(calls.length, 2);
  } finally {
    globalThis.fetch = previous;
  }
});

test("expired connections never fall back to an old static tunnel", async () => {
  const env = environment({
    DB: database({
      origin: "https://expired.trycloudflare.com",
      expires_at: 1,
    }),
    ARENA_BRIDGE_SECRET: "test-only-key",
    BACKEND_ORIGIN: "https://old.trycloudflare.com",
  });
  const previous = globalThis.fetch;
  globalThis.fetch = async () =>
    assert.fail("An expired connection must not receive secrets.");
  try {
    const config = await worker.fetch(new Request(origin + "/api/config"), env);
    assert.equal((await config.json()).access.online, false);
    assert.equal(config.headers.get("X-Arena-Snapshot"), "1");
    const denied = await worker.fetch(
      new Request(origin + "/api/runs", {
        method: "POST",
        headers: { Origin: origin },
        body: "{}",
      }),
      env,
    );
    assert.equal(denied.status, 503);
  } finally {
    globalThis.fetch = previous;
  }
});

test("recovery rejects stale updates and disallowed addresses before probing", async () => {
  const secret = "test-only-recovery-key",
    now = Math.floor(Date.now() / 1000);
  const db = database({ issued_at: now, registration_id: "b".repeat(32) });
  const env = environment({ DB: db, ARENA_BRIDGE_SECRET: secret });
  const previous = globalThis.fetch;
  globalThis.fetch = async () =>
    assert.fail("Rejected updates must not be probed.");
  try {
    const stale = await worker.fetch(
      await recoveryRequest(secret, "https://old.trycloudflare.com", now - 1),
      env,
    );
    assert.equal(stale.status, 409);
    const bad = await worker.fetch(
      await recoveryRequest(secret, "https://evil.example"),
      env,
    );
    assert.equal(bad.status, 400);
  } finally {
    globalThis.fetch = previous;
  }
});

test("an unverified backend cannot change the registered address", async () => {
  const db = database(),
    secret = "test-only-recovery-key";
  const env = environment({ DB: db, ARENA_BRIDGE_SECRET: secret });
  const previous = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ ok: true, proof: "0".repeat(64) });
  try {
    const response = await worker.fetch(
      await recoveryRequest(secret, "https://unknown.trycloudflare.com"),
      env,
    );
    assert.equal(response.status, 503);
    assert.equal(db.row, null);
  } finally {
    globalThis.fetch = previous;
  }
});

test("public recovery status exposes no connection address or secret", async () => {
  const address = "https://private-name.trycloudflare.com",
    secret = "test-only-recovery-key";
  const response = await worker.fetch(
    new Request(origin + "/api/host/connection"),
    environment({
      DB: database({ origin: address }),
      ARENA_BRIDGE_SECRET: secret,
    }),
  );
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.doesNotMatch(text, /trycloudflare|test-only-recovery-key/);
  assert.equal(JSON.parse(text).supported, true);
});

test("oversized recovery bodies are rejected without a database update", async () => {
  const db = database();
  const response = await worker.fetch(
    new Request(origin + "/api/host/connection", {
      method: "POST",
      body: "x".repeat(3000),
    }),
    environment({ DB: db, ARENA_BRIDGE_SECRET: "test-only-key" }),
  );
  assert.equal(response.status, 413);
  assert.equal(db.row, null);
});

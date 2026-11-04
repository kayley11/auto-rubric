const offlineMessage =
  "Evaluations are offline. The host computer must be online. Saved study results remain available.";

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

const registrationPath = "/api/host/connection";
const leaseSeconds = 180;

function tunnelOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid connection address");
  return url.origin;
}

async function connection(request, env) {
  if (!env.DB || !env.ARENA_BRIDGE_SECRET)
    return json({ error: "Automatic recovery is not configured." }, 503);
  if (request.method === "GET")
    return json({
      supported: true,
      server_time: Math.floor(Date.now() / 1000),
    });
  if (request.method !== "POST")
    return json({ error: "Use GET or POST." }, 405);
  if (Number(request.headers.get("Content-Length")) > 2048)
    return json({ error: "Request is too large." }, 413);
  const reader = request.body?.getReader();
  const chunks = [];
  let size = 0;
  if (reader) {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return json({ error: "Request is too large." }, 413);
      }
      chunks.push(part.value);
    }
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  const stamp = request.headers.get("X-Arena-Time") || "";
  const signature = request.headers.get("X-Arena-Signature") || "";
  const now = Math.floor(Date.now() / 1000);
  if (
    !/^\d{10}$/.test(stamp) ||
    Math.abs(now - Number(stamp)) > 60 ||
    !/^[a-f0-9]{64}$/.test(signature)
  )
    return json({ error: "Invalid recovery signature." }, 403);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.ARENA_BRIDGE_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(signature.match(/../g), (h) => parseInt(h, 16)),
    encoder.encode(`POST\n${registrationPath}\n${stamp}\n${body}`),
  );
  if (!valid) return json({ error: "Invalid recovery signature." }, 403);
  let data, address;
  try {
    data = JSON.parse(body);
    address = tunnelOrigin(data.origin);
    if (!/^[a-f0-9]{32}$/.test(data.registration_id)) throw new Error();
  } catch {
    return json({ error: "Invalid recovery details." }, 400);
  }
  const current = await env.DB.prepare(
    "SELECT issued_at, registration_id FROM host_connection WHERE id = 1",
  ).first();
  if (
    current &&
    (current.issued_at > Number(stamp) ||
      (current.issued_at === Number(stamp) &&
        current.registration_id !== data.registration_id))
  )
    return json(
      { error: "A newer connection update exists. Retry shortly." },
      409,
    );
  // Verify the protected backend before replacing the previous connection.
  try {
    const nonce = crypto.randomUUID().replaceAll("-", "");
    const check = await fetch(address + "/healthz?probe_nonce=" + nonce, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const reply = await check.json();
    if (!check.ok || !/^[a-f0-9]{64}$/.test(reply.proof || ""))
      throw new Error();
    const proof = Uint8Array.from(reply.proof.match(/../g), (h) =>
      parseInt(h, 16),
    );
    if (
      !(await crypto.subtle.verify(
        "HMAC",
        key,
        proof,
        encoder.encode("AutoRubric probe\n" + nonce),
      ))
    )
      throw new Error();
  } catch {
    return json({ error: "The protected backend is not reachable yet." }, 503);
  }
  const issued = Number(stamp),
    expires = issued + leaseSeconds;
  const saved = await env.DB.prepare(
    "INSERT INTO host_connection (id, origin, issued_at, expires_at, registration_id) VALUES (1, ?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET origin = excluded.origin, issued_at = excluded.issued_at, expires_at = excluded.expires_at, registration_id = excluded.registration_id WHERE excluded.issued_at > host_connection.issued_at OR (excluded.issued_at = host_connection.issued_at AND excluded.registration_id = host_connection.registration_id)",
  )
    .bind(address, issued, expires, data.registration_id)
    .run();
  if (!saved.meta?.changes)
    return json(
      { error: "A newer connection update exists. Retry shortly." },
      409,
    );
  return json({ registered: true, expires_at: expires });
}

function secured(response) {
  const result = new Response(response.body, response);
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("Referrer-Policy", "no-referrer");
  result.headers.set("X-Frame-Options", "DENY");
  result.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  result.headers.set("Strict-Transport-Security", "max-age=31536000");
  result.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  return result;
}

async function backend(request, env) {
  if (!env.ARENA_BRIDGE_SECRET) throw new Error("offline");
  let address = env.BACKEND_ORIGIN;
  if (env.DB) {
    const saved = await env.DB.prepare(
      "SELECT origin, expires_at FROM host_connection WHERE id = 1",
    ).first();
    if (!saved || saved.expires_at <= Date.now() / 1000)
      throw new Error("offline");
    address = saved.origin;
  }
  const target = new URL(tunnelOrigin(address));
  const url = new URL(request.url);
  target.pathname = url.pathname;
  target.search = url.search;
  const headers = new Headers({
    "X-Arena-Bridge": env.ARENA_BRIDGE_SECRET,
    Accept: "application/json, text/plain",
  });
  const cookie = request.headers
    .get("Cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("arena_session="));
  if (cookie) headers.set("Cookie", cookie);
  const origin = request.headers.get("Origin");
  if (origin) headers.set("Origin", origin);
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);
  const body =
    request.method === "POST" ? await request.arrayBuffer() : undefined;
  if (body && body.byteLength > 512000)
    return json({ error: "Request is too large." }, 413);
  // Model jobs return a saved run ID immediately; polling never waits for the model itself.
  const response = await fetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(url.pathname === "/api/config" ? 4000 : 15000),
  });
  if (response.status >= 300 && response.status < 400)
    throw new Error("Unexpected backend redirect");
  if (response.status >= 500) throw new Error("offline");
  const result = new Response(response.body, { status: response.status });
  for (const key of ["Content-Type", "Content-Disposition", "Set-Cookie"])
    if (response.headers.has(key))
      result.headers.set(key, response.headers.get(key));
  result.headers.set("Cache-Control", "no-store");
  return result;
}

async function snapshot(request, env, route) {
  const manifestResponse = await env.ASSETS.fetch(
    new URL("/_public/manifest.json", request.url),
  );
  if (!manifestResponse.ok)
    return json({ error: "Saved study is unavailable." }, 503);
  const manifest = await manifestResponse.json();
  const entry = manifest[route];
  if (!entry) return json({ error: "Route not found." }, 404);
  const response = await env.ASSETS.fetch(
    new URL("/_public/" + entry.file, request.url),
  );
  const result = new Response(response.body, { status: entry.status || 200 });
  result.headers.set("Content-Type", entry.content_type);
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("X-Arena-Snapshot", "1");
  if (entry.disposition)
    result.headers.set("Content-Disposition", entry.disposition);
  return result;
}

export async function handle(request, env) {
  const url = new URL(request.url);
  if (url.pathname === registrationPath) return connection(request, env);
  if (!["GET", "HEAD", "POST"].includes(request.method))
    return json({ error: "Method not allowed." }, 405);
  if (request.method === "POST" && request.headers.get("Origin") !== url.origin)
    return json({ error: "Use this website’s own forms." }, 403);
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/access/logout" && request.method === "POST") {
      const result = json({ signed_in: false });
      result.headers.set(
        "Set-Cookie",
        "arena_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0",
      );
      return result;
    }
    const member = /(?:^|;\s*)arena_session=.+/.test(
      request.headers.get("Cookie") || "",
    );
    if (url.pathname === "/api/result-comparison") {
      if (request.method !== "GET") return json({ error: "Use GET." }, 405);
      if (!member)
        return json({ error: "Sign in with your workspace account to view this comparison." }, 401);
      try {
        return await backend(request, env);
      } catch {
        return json({ error: "The comparison needs the host computer online. Please retry shortly." }, 503);
      }
    }
    const review = url.pathname === "/api/review" || /^\/api\/review\/[a-f0-9]{24}(?:\/[A-Za-z0-9-]+)?$/.test(url.pathname);
    if (!member && url.pathname === "/api/cases/submitted" && request.method === "GET") return json([]);
    const comparison =
      url.pathname === "/api/comparison" ||
      /^\/api\/comparison\/cases\/(?:C0[1-5]|N0[1-6]|CAND(?:0[1-9]|1[0-9]|2[0-2])|B(?:0[1-9]|1[0-9]|2[0-2])|J0[1-4]|JA(?:0[124-9]|10)|SR(?:0[1-9]|10))$/.test(
        url.pathname,
      );
    if (
      request.method === "POST" ||
      member ||
      url.pathname === "/api/config" ||
      review ||
      comparison
    ) {
      try {
        const response = await backend(request, env);
        // An older local backend may not yet have the new public read route.
        if (!(comparison && !response.ok)) return response;
      } catch {
        if (review) return json({error: offlineMessage},503);
        if (request.method === "POST")
          return json({ error: offlineMessage }, 503);
        if (member) {
          const saved = await snapshot(request, env, url.pathname);
          return saved.status === 404
            ? json({ error: offlineMessage }, 503)
            : saved;
        }
      }
    }
    return snapshot(request, env, url.pathname);
  }
  if (request.method === "POST")
    return json({ error: "Route not found." }, 404);
  let response = await env.ASSETS.fetch(request);
  if (
    response.status === 404 &&
    request.headers.get("Accept")?.includes("text/html")
  )
    response = await env.ASSETS.fetch(new URL("/index.html", request.url));
  return response;
}

export default {
  async fetch(request, env) {
    return secured(await handle(request, env));
  },
};

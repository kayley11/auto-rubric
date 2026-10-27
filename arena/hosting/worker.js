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
  if (!env.BACKEND_ORIGIN || !env.ARENA_BRIDGE_SECRET)
    throw new Error("offline");
  const target = new URL(env.BACKEND_ORIGIN);
  if (
    target.protocol !== "https:" ||
    !target.hostname.endsWith(".trycloudflare.com") ||
    target.username ||
    target.password ||
    target.pathname !== "/"
  )
    throw new Error("Invalid backend configuration");
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
    if (request.method === "POST" || member || url.pathname === "/api/config") {
      try {
        return await backend(request, env);
      } catch {
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

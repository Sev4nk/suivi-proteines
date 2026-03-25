export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-sync-token",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!isAuthorized(request, env)) {
      return json({ error: "unauthorized" }, 401, corsHeaders);
    }

    const storageKey = "protein_tracker_payload";

    if (request.method === "GET") {
      const payload = await env.SYNC_STORE.get(storageKey);
      if (!payload) {
        return json(
          {
            app: "protein-tracker",
            version: 2,
            state: null,
            db: null,
            message: "empty"
          },
          200,
          corsHeaders
        );
      }

      return new Response(payload, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "invalid-json" }, 400, corsHeaders);
      }

      if (!body || typeof body !== "object" || !body.state || !body.db) {
        return json({ error: "invalid-payload" }, 400, corsHeaders);
      }

      await env.SYNC_STORE.put(storageKey, JSON.stringify(body));

      return json(
        {
          ok: true,
          updatedAt: new Date().toISOString()
        },
        200,
        corsHeaders
      );
    }

    return json({ error: "method-not-allowed" }, 405, corsHeaders);
  }
};

function isAuthorized(request, env) {
  const expected = (env.SYNC_TOKEN || "").trim();
  if (!expected) {
    return false;
  }

  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const alt = (request.headers.get("x-sync-token") || "").trim();

  return bearer === expected || alt === expected;
}

function json(payload, status, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

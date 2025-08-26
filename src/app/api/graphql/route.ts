export const runtime = "nodejs";

function ensureGraphqlPath(u: string) {
  try {
    const url = new URL(u);
    if (!url.pathname.endsWith("/graphql")) {
      url.pathname = (url.pathname.replace(/\/+$/, "") || "") + "/graphql";
    }
    return url.toString();
  } catch {
    // if it's not a full URL, just append
    return (u.replace(/\/+$/, "") || "") + "/graphql";
  }
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true, hint: "Use POST /api/graphql" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const base = process.env.GRAPHQL_API_URL;
  if (!base) return new Response("GRAPHQL_API_URL not set", { status: 500 });

  const upstreamUrl = ensureGraphqlPath(base);
  const body = await req.text();

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
    });
  } catch (e: any) {
    return new Response(`Upstream fetch error: ${e?.message || e}`, { status: 502 });
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

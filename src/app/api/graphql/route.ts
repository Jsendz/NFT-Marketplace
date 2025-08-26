// src/app/api/graphql/route.ts
export const runtime = "nodejs";

function ensureGraphqlPath(u: string) {
  try {
    const url = new URL(u);
    if (!url.pathname.endsWith("/graphql")) {
      url.pathname = (url.pathname.replace(/\/+$/, "") || "") + "/graphql";
    }
    return url.toString();
  } catch {
    return (u.replace(/\/+$/, "") || "") + "/graphql";
  }
}

function upstreamUrl() {
  const raw =
    process.env.GRAPHQL_API_URL ||
    process.env.NEXT_PUBLIC_GRAPHQL_API_URL ||
    "";
  if (!raw) throw new Error("GRAPHQL_API_URL not set");
  return ensureGraphqlPath(raw);
}

export async function POST(req: Request) {
  try {
    const upstream = await fetch(upstreamUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: await req.text(),
      cache: "no-store",
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(`Upstream fetch error: ${e?.message || e}`, { status: 502 });
  }
}

// (keep your existing GET and OPTIONS as-is)

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
  let body: string;
  try {
    body = await req.text();
  } catch (e: any) {
    return new Response(`Failed to read request body: ${e?.message || e}`, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      cache: "no-store",
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

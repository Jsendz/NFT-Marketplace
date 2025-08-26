export const runtime = "nodejs";

export async function GET() {
  // Simple health response so GET doesn't 405
  return new Response(JSON.stringify({ ok: true, message: "GraphQL proxy is up. Use POST." }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: Request) {
  const url = process.env.GRAPHQL_API_URL;
  if (!url) return new Response("GRAPHQL_API_URL not set", { status: 500 });

  const body = await req.text(); // pass-through JSON
  let upstream: Response;
  try {
    upstream = await fetch(url, {
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

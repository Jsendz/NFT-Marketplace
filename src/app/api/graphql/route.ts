export const runtime = "nodejs";

export async function POST(req: Request) {
  const url = process.env.GRAPHQL_API_URL;
  if (!url) return new Response("GRAPHQL_API_URL not set", { status: 500 });

  const body = await req.text(); // pass-through
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
  // Always return upstream payload to see GraphQL/server errors in the browser
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

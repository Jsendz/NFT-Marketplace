export const runtime = "edge"; // or "nodejs"

export async function POST(req: Request) {
  const url = process.env.GRAPHQL_API_URL; // server-side env
  if (!url) return new Response("GRAPHQL_API_URL not set", { status: 500 });

  const body = await req.text(); // pass-through the JSON string
  const upstream = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

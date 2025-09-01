export const runtime = "nodejs"; // safest on Vercel

export async function POST(req: Request) {
  const upstream = process.env.GRAPHQL_API_URL; // e.g. https://<render>.onrender.com/graphql
  if (!upstream) return new Response("GRAPHQL_API_URL not set", { status: 500 });

  const body = await req.text(); // pass-thru whatever the client sent
  const res = await fetch(upstream, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") || "application/json" },
  });
}

// Optional: allow simple GET for quick health checks
export async function GET() {
  return new Response("OK", { status: 200 });
}

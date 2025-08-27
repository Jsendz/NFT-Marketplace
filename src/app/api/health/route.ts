// src/app/api/health/route.ts
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const graphqlUrl = new URL("/api/graphql", req.url); // <-- absolute URL
    const res = await fetch(graphqlUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
      cache: "no-store",
    });

    const ok = res.ok;
    const data = ok ? await res.json() : null;
    return NextResponse.json({ ok, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  try {
    const { env } = getRequestContext();
    const KV = (env as Record<string, KVNamespace>).EXPENSES_KV;

    const [expenses, profile, sub] = await Promise.all([
      KV.get(`wa:${phone}`, "json"),
      KV.get(`profile:${phone}`, "json"),
      KV.get(`sub:${phone}`, "json"),
    ]);

    const h = new Headers();
    h.set("Access-Control-Allow-Origin", "*");
    h.set("Cache-Control", "no-store");

    return NextResponse.json(
      {
        expenses: expenses ?? [],
        profile: profile ?? { totalExpenses: 0, streak: 0, health: 100, happiness: 80 },
        sub: sub ?? { plan: "free", monthlyCount: 0 },
      },
      { headers: h }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

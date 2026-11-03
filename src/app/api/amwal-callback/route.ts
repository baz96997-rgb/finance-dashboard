// src/app/api/amwal-callback/route.ts
// يستقبل تأكيد الدفع من Amwal ويفعّل الاشتراك تلقائياً
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!;
const AMWAL_KEY       = process.env.AMWALPAY_SECURE_KEY ?? "5C1683D1EF9511A8CF13CA396F2CB6FA0461DD411AEAA2E994DCE333E0CF1549";
const DASHBOARD_URL   = "https://dashboard.baz96997.workers.dev";

interface Subscription {
  plan: "free" | "premium";
  expiresAt: string | null;
  activatedAt: string | null;
  monthlyCount: number;
  lastResetMonth: string;
}

// ─── HMAC التحقق (Edge Runtime) ──────────────────────────────
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2)
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes;
}

async function calcHash(obj: Record<string, any>): Promise<string> {
  const sorted = Object.keys(obj)
    .filter(k => k !== "secureHashValue" && obj[k] !== null && obj[k] !== undefined)
    .sort()
    .reduce((acc: Record<string, any>, k) => { acc[k] = obj[k]; return acc; }, {});

  const payload = Object.entries(sorted)
    .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
    .join("&");

  const key = await crypto.subtle.importKey(
    "raw", hexToBytes(AMWAL_KEY),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ─── إرسال واتساب ────────────────────────────────────────────
async function sendWA(to: string, body: string) {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
}

// ════════════════════════════════════════════════════════════
// GET — Amwal يرجّع العميل هنا بعد الدفع (returnUrl)
// ════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const status = url.searchParams.get("status");
  const phone  = url.searchParams.get("phone") ?? "";
  const plan   = (url.searchParams.get("plan") ?? "monthly") as "monthly" | "yearly";

  if (status === "cancel" || !phone) {
    // إلغاء — أرجع للداشبورد
    return Response.redirect(`${DASHBOARD_URL}?phone=${phone}&payment=cancelled`, 302);
  }

  // نجح الدفع — فعّل الاشتراك
  try {
    const { env } = getRequestContext();
    const KV = (env as Record<string, KVNamespace>).EXPENSES_KV;

    await activateSubscription(KV, phone, plan);

    // أرسل رسالة تهنئة على واتساب
    await sendWA(phone, buildSuccessMessage(phone, plan));

    // أرجعه للداشبورد
    return Response.redirect(`${DASHBOARD_URL}?phone=${phone}&payment=success`, 302);
  } catch (e) {
    console.error("Amwal callback error:", e);
    return Response.redirect(`${DASHBOARD_URL}?phone=${phone}&payment=error`, 302);
  }
}

// ════════════════════════════════════════════════════════════
// POST — Amwal Cloud Notification (webhook)
// ════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json() as Record<string, any>;

    // تحقق من الـ Hash
    const receivedHash = payload.secureHashValue as string;
    const expectedHash = await calcHash(payload);
    if (!receivedHash || receivedHash.toUpperCase() !== expectedHash) {
      console.error("Amwal: invalid hash");
      return NextResponse.json({ error: "invalid hash" }, { status: 401 });
    }

    // تحقق من نجاح العملية
    // Amwal: responseCode "00" = نجاح
    if (payload.responseCode !== "00" && payload.status !== "Approved") {
      return NextResponse.json({ received: true, action: "ignored" });
    }

    // استخرج بيانات العملية
    // merchantReference شكله: SW-{phone}-{timestamp}[-yearly]
    const ref: string = payload.merchantReference ?? "";
    const parts = ref.split("-");
    const phone = parts[1] ?? "";
    const plan: "monthly" | "yearly" = ref.includes("yearly") ? "yearly" : "monthly";

    if (!phone) {
      console.error("Amwal: no phone in reference", ref);
      return NextResponse.json({ received: true, action: "no_phone" });
    }

    const { env } = getRequestContext();
    const KV = (env as Record<string, KVNamespace>).EXPENSES_KV;

    await activateSubscription(KV, phone, plan);
    await sendWA(phone, buildSuccessMessage(phone, plan));

    return NextResponse.json({ received: true, action: "activated" });
  } catch (e: any) {
    console.error("Amwal POST error:", e.message);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

// ─── تفعيل الاشتراك في KV ────────────────────────────────────
async function activateSubscription(KV: KVNamespace, phone: string, plan: "monthly" | "yearly") {
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  const current: Subscription = (await KV.get(`sub:${phone}`, "json")) ?? {
    plan: "free", expiresAt: null, activatedAt: null,
    monthlyCount: 0, lastResetMonth: "",
  };

  const updated: Subscription = {
    ...current,
    plan: "premium",
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await KV.put(`sub:${phone}`, JSON.stringify(updated));
}

// ─── رسالة التهنئة ───────────────────────────────────────────
function buildSuccessMessage(phone: string, plan: "monthly" | "yearly"): string {
  const planLabel = plan === "yearly" ? "السنوية" : "الشهرية";
  const now = new Date();
  const expires = new Date(now);
  if (plan === "yearly") expires.setFullYear(expires.getFullYear() + 1);
  else expires.setMonth(expires.getMonth() + 1);

  return [
    "🎉 *تم تفعيل اشتراكك بنجاح!*",
    "",
    `⭐ *الخطة المميزة ${planLabel}*`,
    `📅 تاريخ التفعيل: ${now.toLocaleDateString("ar-OM")}`,
    `📅 ينتهي بتاريخ: ${expires.toLocaleDateString("ar-OM")}`,
    "",
    "🎁 *ما الذي حصلت عليه:*",
    "   ✅ تسجيل مصاريف غير محدود",
    "   ✅ تقارير متقدمة وإحصائيات",
    "   ✅ تنبيهات ذكية للميزانية",
    "   ✅ تصدير PDF",
    "",
    "شكراً لثقتك بنا! 💙",
    `🌐 ${DASHBOARD_URL}?phone=${phone}`,
  ].join("\n");
}

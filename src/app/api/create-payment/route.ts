import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const AMWAL_MERCHANT = parseInt(process.env.AMWALPAY_MERCHANT_ID ?? "141336", 10);
const AMWAL_TERMINAL = parseInt(process.env.AMWALPAY_TERMINAL_ID ?? "679610", 10);
const AMWAL_KEY      = process.env.AMWALPAY_SECURE_KEY!;
const AMWAL_BASE     = "https://webhook.amwalpg.com";
const APP_BASE_URL   = "https://finance-dashboard-ca6.pages.dev";

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const b = new Uint8Array(hex.length / 2) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < hex.length; i += 2) b[i/2] = parseInt(hex.substr(i,2),16);
  return b;
}
async function calcHash(obj: Record<string, any>): Promise<string> {
  const sorted = Object.keys(obj)
    .filter(k => k !== "secureHashValue" && obj[k] != null)
    .sort()
    .reduce((acc: Record<string,any>, k) => { acc[k] = obj[k]; return acc; }, {});
  const payload = Object.entries(sorted).map(([k,v]) => `${k}=${v}`).join("&");
  const key = await crypto.subtle.importKey("raw", hexToBytes(AMWAL_KEY),
    { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { phone, plan } = await req.json() as { phone: string; plan: "monthly"|"yearly" };
    if (!phone) return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });

    const amount = plan === "yearly" ? 15 : 1.5;
    const ref = `SW-${phone}-${Date.now()}${plan === "yearly" ? "-yearly" : ""}`;
    const body: Record<string, any> = {
      merchantId: AMWAL_MERCHANT,
      terminalId: AMWAL_TERMINAL,
      amount,
      currency: 512,
      language: 1,
      merchantReference: ref,
      requestDateTime: new Date().toISOString(),
      returnUrl: `${APP_BASE_URL}/api/amwal-callback?status=success&phone=${phone}&plan=${plan}&ref=${ref}`,
      cancelUrl:  `${APP_BASE_URL}/pricing?phone=${phone}`,
      returnUrlMethodType: "Get",
      paymentViewType: 2,
      merchantCustomerId: phone,
      askForContactInformationFieldsType: 4,
    };
    body.secureHashValue = await calcHash(body);

    const res = await fetch(`${AMWAL_BASE}/MerchantOrder/InitializePayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as any;
    console.log("Amwal response:", JSON.stringify(data));

    if (data.success && data.data) {
      return NextResponse.json({ url: data.data });
    }
    return NextResponse.json({ error: data.message ?? "خطأ من بوابة الدفع" }, { status: 400 });
  } catch(e: any) {
    console.error("create-payment error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

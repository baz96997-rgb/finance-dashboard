import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const AMWAL_MERCHANT = parseInt(process.env.AMWALPAY_MERCHANT_ID ?? "141336", 10);
const AMWAL_TERMINAL = parseInt(process.env.AMWALPAY_TERMINAL_ID ?? "679610", 10);
const AMWAL_KEY      = process.env.AMWALPAY_SECURE_KEY ?? "";
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

export async function GET(req: NextRequest) {
  const phone = new URL(req.url).searchParams.get("phone") ?? "96896997977";

  const ref = `TEST-${phone}-${Date.now()}`;
  const body: Record<string, any> = {
    merchantId: AMWAL_MERCHANT,
    terminalId: AMWAL_TERMINAL,
    amount: 1.5,
    currency: 512,
    language: 1,
    merchantReference: ref,
    requestDateTime: new Date().toISOString(),
    returnUrl: `${APP_BASE_URL}/pricing?phone=${phone}`,
    cancelUrl:  `${APP_BASE_URL}/pricing?phone=${phone}`,
    returnUrlMethodType: "Get",
    paymentViewType: 2,
    merchantCustomerId: phone,
    askForContactInformationFieldsType: 4,
  };
  body.secureHashValue = await calcHash(body);

  let amwalStatus = 0;
  let amwalBody = "";
  try {
    const res = await fetch(`${AMWAL_BASE}/MerchantOrder/InitializePayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    amwalStatus = res.status;
    amwalBody = await res.text();
  } catch(e: any) {
    amwalBody = "FETCH ERROR: " + e.message;
  }

  return NextResponse.json({
    merchantId: AMWAL_MERCHANT,
    terminalId: AMWAL_TERMINAL,
    hasKey: AMWAL_KEY.length > 0,
    keyLen: AMWAL_KEY.length,
    requestBody: { ...body, secureHashValue: body.secureHashValue.substring(0,10) + "..." },
    amwalStatus,
    amwalResponse: amwalBody,
  });
}

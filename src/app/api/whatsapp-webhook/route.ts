// src/app/api/whatsapp-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!;
const VERIFY_TOKEN    = process.env.WEBHOOK_VERIFY_TOKEN ?? "mizar-verify-2025";
const ADMIN_PHONE     = "96896997977";
const AMWAL_MERCHANT  = parseInt(process.env.AMWALPAY_MERCHANT_ID ?? "141336", 10);
const AMWAL_TERMINAL  = parseInt(process.env.AMWALPAY_TERMINAL_ID ?? "679610", 10);
const AMWAL_KEY       = process.env.AMWALPAY_SECURE_KEY ?? "5C1683D1EF9511A8CF13CA396F2CB6FA0461DD411AEAA2E994DCE333E0CF1549";
const AMWAL_BASE      = "https://webhook.amwalpg.com";
const DASHBOARD_URL   = "dashboard.baz96997.workers.dev";
const APP_BASE_URL    = "https://finance-dashboard-ca6.pages.dev";

// ─── خريطة البلد → العملة ──────────────────────────────────────────────
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  "974": "QAR", "971": "AED", "966": "SAR", "965": "KWT",
  "973": "BHD", "962": "JOD", "20": "EGP",
  // 968 = OMR (الاقتراضي)
};

// ─── إعداد عملات العالم ──────────────────────────────────────────────────
const CURRENCY_CONFIG: Record<string, { symbol: string; decimals: number; subunit: string; rate: number }> = {
  "OMR": { symbol: "ر.ع", decimals: 3, subunit: "بيسة", rate: 1 },
  "KWD": { symbol: "د.ك", decimals: 3, subunit: "فلس",  rate: 1.22 },
  "BHD": { symbol: "د.ب", decimals: 3, subunit: "فلس",  rate: 1.055 },
  "JOD": { symbol: "د.أ", decimals: 3, subunit: "فلس",  rate: 0.706 },
  "QAR": { symbol: "ر.ق", decimals: 2, subunit: "درهم", rate: 0.103 },
  "SAR": { symbol: "ر.س", decimals: 2, subunit: "هللة", rate: 0.103 },
  "AED": { symbol: "د.أ", decimals: 2, subunit: "فلس",  rate: 0.1026 },
  "EGP": { symbol: "ج.م", decimals: 2, subunit: "قرش",  rate: 0.0203 },
};

function getCurrencyFromPhone(phone: string): string {
  for (const [prefix, currency] of Object.entries(COUNTRY_CURRENCY_MAP)) {
    if (phone.startsWith(prefix)) return currency;
  }
  return "OMR";
}

// ─── حد الخطة المجانية ───────────────────────────────────────────────────
const FREE_LIMIT = 30;

// ─── فئات المصاريف ──────────────────────────────────────────────────────
const CATEGORIES: Record<string, { keywords: string[]; label: string; icon: string; tips: string[] }> = {
  food:          { keywords: ["اكل","طعام","مطعم","غداء","عشاء","فطور","قهوة","كافيه","وجبة","بيتزا","برغر","كنتاكي","شاورما","حلويات","سوبرماركت","بقالة","هايبر","لولو","كارفور","جمعية","مقهى","ماكدونالدز","بروستد","سوبر","كارفر","جمعيه","مقهه","هايبور","لولو","سوبرمارك"], label: "طعام وشراب", icon: "🍔", tips: ["حاول الطبخ في البيت أكثر لتوفير 30-40% من ميزانية الطعام 🍳","ابحث عن عروض وتخفيضات في المطاعم لتوفير في الطعام 🏷️","خطط لوجباتك الأسبوعية مسبقاً لتقليل الإنفاق العشوائي على الطعام 📋"] },
  transport:     { keywords: ["بنزين","وقود","تاكسي","كريم","اوبر","مواصلات","بص","صيانة","غسيل سيارة","باص","قطار","طيران"], label: "مواصلات", icon: "🚗", tips: ["حاول مشاركة الركوب مع زملاء العمل لتوفير في الوقود ⛽","تحقق من مواعيد الباص الأكثر كفاءة لتوفير في المواصلات 🚌","فكر في استخدام الدراجة أو المشي للمسافات القصيرة 🚲"] },
  utilities:     { keywords: ["كهرباء","ماء","انترنت","هاتف","جوال","اشتراك","فاتورة","تليفون","موبايل نت","نت"], label: "فواتير", icon: "💡", tips: ["أطفئ الأجهزة الكهربائية عند عدم الاستخدام لتوفير في الفواتير 🔌","قارن بين باقات الإنترنت للحصول على أفضل سعر 📱","راجع اشتراكاتك وألغِ ما لا تحتاجه من الخدمات ❌"] },
  health:        { keywords: ["دواء","دكتور","طبيب","صيدلية","مستشفى","عيادة","علاج","كشف"], label: "صحة", icon: "🏥", tips: ["الوقاية أفضل من العلاج — مارس الرياضة ونم جيداً 🏃","تأكد من مقارنة الأدوية الجنيسة للحصول على بدائل أرخص 🏥","احتفظ بتأمين صحي جيد لتغطية مصاريف الطب الكبيرة 💊"] },
  entertainment: { keywords: ["سينما","ترفيه","العاب","رحلة","فندق","نزهة","اشتراك نتفليكس","سبوتيفاي","يوتيوب","سبوتيفي"], label: "ترفيه", icon: "🎮", tips: ["خصص ميزانية شهرية للترفيه وتمسك بها 🎯","ابحث عن أماكن ترفيهية مجانية في منطقتك لتوفير المال 🌳","قارن اشتراكات المنصات وتأكد من استخدامها قبل التجديد 📺"] },
  shopping:      { keywords: ["ملابس","ثياب","حذاء","ساعة","تسوق","هدية","موبايل","جهاز","اثاث","ديكور","حقيبة","اثاث","ديكور","حقيبه"], label: "تسوق", icon: "🛍️", tips: ["انتظر موسم التخفيضات لشراء الملابس والهدايا 🏷️","اسأل نفسك: هل أحتاج هذا فعلاً أو مجرد رغبة في الشراء 24 ساعة قبل الشراء ⏰","قارن الأسعار عبر الإنترنت قبل الشراء من المتاجر التقليدية 💻"] },
  education:     { keywords: ["كتاب","دورة","تعليم","رسوم","قرطاسية","جامعة","مدرسة","كورس"], label: "تعليم", icon: "📚", tips: ["الاستثمار في التعليم هو أفضل استثمار لمستقبلك 🎓","ابحث عن دورات مجانية أو برعاية الإنترنت 💻","استخدم المكتبة العامة للكتب والمصادر التعليمية الكبيرة 📖"] },
  savings:       { keywords: ["توفير","ادخار","استثمار","بنك","صندوق"], label: "مدخرات", icon: "🏦", tips: ["احرص على توفير 20% من دخلك كل شهر 💰","قاعدة 50/30/20: 50 ضروريات، 30 رغبات، 20 مدخرات 💸","ابدأ صندوق طوارئ يغطي 3-6 أشهر من المصاريف الأساسية 🏦"] },
};

// ─── واجهات البيانات ────────────────────────────────────────────────────
interface Expense {
  id: string;
  amount: number;
  currency: string;
  amountOMR: number;
  description: string;
  category: string;
  categoryLabel: string;
  categoryIcon: string;
  subcategory: string;
  paymentMethod: string;
  installments: number;
  totalInstallments: number;
  date: string;
  source: "whatsapp";
}

interface UserProfile {
  totalExpenses: number;
  streak: number;
  lastExpenseDate: string;
  health: number;
  happiness: number;
}

interface Subscription {
  plan: "free" | "premium";
  expiresAt: string | null;
  activatedAt: string | null;
  monthlyCount: number;
  lastResetMonth: string;
}

// ─── HMAC-SHA256 (Edge Runtime) ─────────────────────────────────────────
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(hex.length / 2) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function calcAmwalHash(obj: Record<string, any>): Promise<string> {
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

// ─── Amwal: تهيئة الدفع ─────────────────────────────────────────────────
async function initAmwalPayment(phone: string, plan: "monthly" | "yearly"): Promise<{ success: boolean; url?: string; error?: string }> {
  const amount = plan === "yearly" ? 15 : 1.5;
  const ref = `SW-${phone}-${Date.now()}`;
  const returnUrl  = `${APP_BASE_URL}/api/amwal-callback?status=success&phone=${phone}&plan=${plan}&ref=${ref}`;
  const cancelUrl  = `${APP_BASE_URL}/api/amwal-callback?status=cancel&phone=${phone}`;

  const body: Record<string, any> = {
    merchantId: AMWAL_MERCHANT,
    terminalId: AMWAL_TERMINAL,
    amount,
    currency: 512,
    language: 1,
    merchantReference: ref,
    requestDateTime: new Date().toISOString(),
    returnUrl,
    cancelUrl,
    returnUrlMethodType: "Get",
    paymentViewType: 2,
    merchantCustomerId: phone,
    askForContactInformationFieldsType: 4,
  };
  body.secureHashValue = await calcAmwalHash(body);

  try {
    const res = await fetch(`${AMWAL_BASE}/MerchantOrder/InitializePayment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as any;
    if (data.success && data.data) {
      return { success: true, url: data.data };
    }
    return { success: false, error: data.message ?? "خطأ من بوابة الدفع" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─── فحص الاشتراك ──────────────────────────────────────────────────────
async function getSubscription(KV: KVNamespace, phone: string): Promise<Subscription> {
  const sub: Subscription = (await KV.get(`sub:${phone}`, "json")) ?? {
    plan: "free",
    expiresAt: null,
    activatedAt: null,
    monthlyCount: 0,
    lastResetMonth: "",
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  if (sub.lastResetMonth !== currentMonth) {
    sub.monthlyCount = 0;
    sub.lastResetMonth = currentMonth;
    await KV.put(`sub:${phone}`, JSON.stringify(sub));
  }

  if (sub.plan === "premium" && sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
    sub.plan = "free";
    sub.expiresAt = null;
    await KV.put(`sub:${phone}`, JSON.stringify(sub));
  }

  return sub;
}

function isPremium(sub: Subscription): boolean {
  return sub.plan === "premium" && !!sub.expiresAt && new Date(sub.expiresAt) > new Date();
}

function remainingFree(sub: Subscription): number {
  return Math.max(0, FREE_LIMIT - sub.monthlyCount);
}

// ─── تحويل الأرقام العربية/الهندية ──────────────────────────────────────
function convertDigits(s: string): string {
  return s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
}

// ─── العملات الخليجية ───────────────────────────────────────────────────
const CURRENCIES: Record<string, { label: string; rate: number }> = {
  "ر.ع": { label: "ر.ع", rate: 1 }, "ريال عماني": { label: "ر.ع", rate: 1 }, "omr": { label: "ر.ع", rate: 1 },
  "بيسة": { label: "بيسة", rate: 0.001 }, "بيسات": { label: "بيسة", rate: 0.001 },
  "ر.س": { label: "ر.س", rate: 0.103 }, "ريال سعودي": { label: "ر.س", rate: 0.103 }, "sar": { label: "ر.س", rate: 0.103 },
  "درهم": { label: "د.أ", rate: 0.1026 }, "د.أ": { label: "د.أ", rate: 0.1026 }, "aed": { label: "د.أ", rate: 0.1026 },
  "د.ك": { label: "د.ك", rate: 1.22 }, "دينار كويتي": { label: "د.ك", rate: 1.22 },
  "د.ب": { label: "د.ب", rate: 1.055 }, "دينار بحريني": { label: "د.ب", rate: 1.055 },
  "ر.ق": { label: "ر.ق", rate: 0.103 }, "ريال قطري": { label: "ر.ق", rate: 0.103 },
};

// ─── استخراج المبلغ ─────────────────────────────────────────────────────
function extractAmount(text: string, defaultCurrency = "OMR"): { amount: number; currency: string; amountOMR: number } | null {
  const t = convertDigits(text);
  const defCfg = CURRENCY_CONFIG[defaultCurrency] ?? CURRENCY_CONFIG["OMR"];
  const numWords: Record<string, number> = {
    "نص": 0.5, "نصف": 0.5, "ربع": 0.25, "ثلاثة أرباع": 0.75,
    "واحد": 1, "اثنين": 2, "اثنان": 2, "ثلاثة": 3, "أربعة": 4, "خمسة": 5,
    "ستة": 6, "سبعة": 7, "ثمانية": 8, "تسعة": 9, "عشرة": 10,
    "خمستاشر": 15, "خمسطعش": 15, "عشرين": 20, "خمسة وعشرين": 25,
    "ثلاثين": 30, "أربعين": 40, "خمسين": 50, "ستين": 60, "سبعين": 70,
    "ثمانين": 80, "تسعين": 90, "مية": 100, "مئة": 100, "مائة": 100,
    "ميتين": 200, "مئتين": 200, "خمسمية": 500, "الف": 1000, "ألف": 1000,
  };

  // ريالين / درهمين / دينارين (مثنى) — تطابق مع أو بدون "ب" في البداية
  const dual = t.match(/ب?ريالين|ب?درهمين|ب?دينارين/);
  if (dual) {
    const curr = dual[0].includes("ريالين") ? "ر.ع" : dual[0].includes("درهمين") ? "د.أ" : "د.ك";
    const info = CURRENCIES[curr];
    return { amount: 2, currency: info.label, amountOMR: 2 * info.rate };
  }

  // رقم + عملة
  const numCurrPat = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${Object.keys(CURRENCIES).join("|")})`, "i");
  const m1 = t.match(numCurrPat);
  if (m1) {
    const amt = parseFloat(m1[1].replace(",", "."));
    const info = CURRENCIES[m1[2].toLowerCase()] ?? { label: "ر.ع", rate: 1 };
    return { amount: amt, currency: info.label, amountOMR: amt * info.rate };
  }

  // كلمات أرقام + عملة
  for (const [word, val] of Object.entries(numWords).sort((a, b) => b[0].length - a[0].length)) {
    if (!t.includes(word)) continue;
    for (const [curr, info] of Object.entries(CURRENCIES)) {
      if (t.includes(curr)) {
        return { amount: val, currency: info.label, amountOMR: val * info.rate };
      }
    }
    return { amount: val, currency: defCfg.symbol, amountOMR: val * defCfg.rate };
  }

  // رقم فقط
  const m2 = t.match(/(\d+(?:[.,]\d+)?)/);
  if (m2) {
    const amt = parseFloat(m2[1].replace(",", "."));
    return { amount: amt, currency: defCfg.symbol, amountOMR: amt * defCfg.rate };
  }

  return null;
}

// ─── تنسيق المبلغ ──────────────────────────────────────────────────────
function formatOMR(v: number, currency = "OMR"): string {
  const cfg = CURRENCY_CONFIG[currency] ?? CURRENCY_CONFIG["OMR"];
  const displayV = currency === "OMR" ? v : v / cfg.rate;
  if (cfg.decimals === 3) {
    if (displayV < 1) return `${Math.round(displayV * 1000)} ${cfg.subunit}`;
    return `${displayV.toFixed(3)} ${cfg.symbol}`;
  } else {
    if (displayV < 1) return `${Math.round(displayV * 100)} ${cfg.subunit}`;
    return `${displayV.toFixed(2)} ${cfg.symbol}`;
  }
}

// ─── تحليل المصروف ──────────────────────────────────────────────────────
function parseExpense(text: string, defaultCurrency = "OMR"): Expense | null {
  const extracted = extractAmount(text, defaultCurrency);
  if (!extracted) return null;
  const { amount, currency, amountOMR } = extracted;
  if (amount <= 0 || amount > 100000) return null;

  const lowerText = text.toLowerCase();
  let category = "other", categoryLabel = "أخرى", categoryIcon = "📦", subcategory = "";
  let tips: string[] = ["تابع مصاريفك يومياً لتحسين إنفاقك وادخار المال 💡"];

  for (const [cat, { keywords, label, icon, tips: catTips }] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = cat; categoryLabel = label; categoryIcon = icon; tips = catTips;
      subcategory = keywords.find(kw => lowerText.includes(kw)) ?? "";
      break;
    }
  }

  // طريقة الدفع
  let paymentMethod = "نقداً";
  if (/بطاق|فيزا|ماستر|card/i.test(text)) paymentMethod = "بطاقة";
  else if (/تحويل|اونلاين|online|stc|oman.*net|بنك/i.test(text)) paymentMethod = "دفع رقمي";
  else if (/آجل|دين|تقسيط|قسط/i.test(text)) paymentMethod = "آجل";

  // تقسيط
  let installments = 1, totalInstallments = 1;
  const instMatch = text.match(/(\d+)\s*(?:قسط|أقساط)\s*(?:من|\/)\s*(\d+)/);
  if (instMatch) { installments = parseInt(instMatch[1]); totalInstallments = parseInt(instMatch[2]); }

  // تنظيف الوصف
  const cleanDesc = text
    .replace(/ب?ريالين|ب?درهمين|ب?دينارين/g, "")  // إزالة المثنى أولاً (يشمل ب)
    .replace(/\d+(?:[.,]\d+)?/g, "")
    .replace(new RegExp(Object.keys(CURRENCIES).join("|"), "gi"), "")
    .replace(/\b(مصروف|صرفت|دفعت|اشتريت|اكلت|شريت|خرج|خلصت|اشترت|دفع|اكل|خلص)\b/gi, "")
    .replace(/\s+/g, " ").trim();

  return {
    id: Date.now().toString(),
    amount, currency, amountOMR,
    description: cleanDesc || categoryLabel,
    category, categoryLabel, categoryIcon, subcategory,
    paymentMethod, installments, totalInstallments,
    date: new Date().toISOString(),
    source: "whatsapp",
  };
}

// ─── تحديث سلسلة الأيام ─────────────────────────────────────────────────
function updateStreak(profile: UserProfile): UserProfile {
  const today = new Date().toISOString().slice(0, 10);
  const last  = profile.lastExpenseDate?.slice(0, 10) ?? "";
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (last === today) return profile;
  if (last === yesterday) { profile.streak = (profile.streak ?? 0) + 1; }
  else if (last !== today) { profile.streak = 1; }
  profile.lastExpenseDate = new Date().toISOString();
  return profile;
}

// ─── إصلاح الإيموجي ─────────────────────────────────────────────────────
function fixEmoji(s: string): string {
  return s.replace(/\uD([89AB][0-9A-Fa-f]{2})\uD([C-Fc-f][0-9A-Fa-f]{2})/g,
    (_, h, l) => String.fromCodePoint(
      0x10000 + ((parseInt(h, 16) - 0x800) << 10) + (parseInt(l, 16) - 0xC00)
    )
  );
}

async function sendWA(to: string, body: string) {
  const safe = fixEmoji(body);
  const jsonBody = JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: safe } });
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: jsonBody,
  });
}

// ─── GET: التحقق من Webhook ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ─── POST: معالج الرسائل ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return NextResponse.json({ status: "ok" });

    const msg = messages[0];
    if (msg.type !== "text") return NextResponse.json({ status: "ok" });

    const from = msg.from as string;
    const text = (msg.text.body as string).trim();

    const { env } = getRequestContext();
    const KV = (env as Record<string, KVNamespace>).EXPENSES_KV;

    const currency = getCurrencyFromPhone(from);
    const lowerText = text.toLowerCase();

    // ─── مساعدة ──────────────────────────────────────────────────────
    if (["مساعدة", "مساعده", "help", "?", "؟"].includes(lowerText)) {
      await sendWA(from, [
        "💎 *مساعدة — بوت مصاريف ميزار*",
        "",
        "📝 *تسجيل مصروف:*",
        "  اشتريت عشا بريالين",
        "  3.500 بنزين",
        "  دواء بخمسة ريال",
        "",
        "📊 *ملخص الشهر:*  ملخص",
        "📋 *آخر المصاريف:*  قائمة",
        "🗑️ *حذف آخر مصروف:*  حذف",
        "📈 *تحليل مصاريفي:*  تحليل",
        "",
        "✅ أرسل أي مصروف بالمبلغ والوصف!",
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ─── ملخص الشهر ───────────────────────────────────────────────
    if (["ملخص", "رصيد", "summary"].includes(lowerText)) {
      const expenses: Expense[] = (await KV?.get(`wa:${from}`, "json")) ?? [];
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const total = thisMonth.reduce((s, e) => s + e.amountOMR, 0);
      const byCategory: Record<string, number> = {};
      thisMonth.forEach(e => {
        byCategory[`${e.categoryIcon} ${e.categoryLabel}`] = (byCategory[`${e.categoryIcon} ${e.categoryLabel}`] ?? 0) + e.amountOMR;
      });

      // الإنفاق اليومي
      const today = now.toISOString().slice(0, 10);
      const todayTotal = thisMonth.filter(e => e.date.startsWith(today)).reduce((s, e) => s + e.amountOMR, 0);
      const avgDaily = now.getDate() > 0 ? total / now.getDate() : 0;

      const lines = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `  ${cat}: ${formatOMR(amt, currency)}`);

      await sendWA(from, [
        `📊 *ملخص ${now.toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}*`,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `💸 الإجمالي: *${formatOMR(total, currency)}*`,
        `📅 اليوم: *${formatOMR(todayTotal, currency)}*`,
        `📆 متوسط يومي: *${formatOMR(avgDaily, currency)}*`,
        `🧾 عدد المعاملات: ${thisMonth.length}`,
        "",
        "📂 *حسب الفئة:*",
        ...lines,
        "",
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ─── قائمة آخر المصاريف ───────────────────────────────────────
    if (["قائمة", "المصاريف", "list"].includes(lowerText)) {
      const expenses: Expense[] = (await KV?.get(`wa:${from}`, "json")) ?? [];
      const last5 = expenses.slice(-5).reverse();
      if (!last5.length) {
        await sendWA(from, "📭 لا يوجد مصاريف مسجلة بعد.\n\nأرسل مصروفاً مثل: *اشتريت بنزين بخمسة ريال*");
      } else {
        const lines = last5.map(e =>
          `${e.categoryIcon} ${e.description} — *${formatOMR(e.amountOMR, currency)}*\n   📅 ${new Date(e.date).toLocaleDateString("ar-SA-u-ca-gregory")}`
        );
        await sendWA(from, ["📋 *آخر 5 مصاريف:*", "", ...lines].join("\n\n"));
      }
      return NextResponse.json({ status: "ok" });
    }

    // ─── حذف آخر مصروف ────────────────────────────────────────────
    if (["حذف", "الغ", "الغي", "undo"].includes(lowerText)) {
      const expenses: Expense[] = (await KV?.get(`wa:${from}`, "json")) ?? [];
      if (!expenses.length) {
        await sendWA(from, "❌ لا يوجد مصاريف لحذفها.");
      } else {
        const deleted = expenses.pop()!;
        await KV?.put(`wa:${from}`, JSON.stringify(expenses));
        await sendWA(from, `🗑️ تم حذف: *${deleted.description}* — ${formatOMR(deleted.amountOMR, currency)}`);
      }
      return NextResponse.json({ status: "ok" });
    }

    // ─── تحليل مصاريفي ───────────────────────────────────────────
    if (["تحليل", "analysis"].includes(lowerText)) {
      const expenses: Expense[] = (await KV?.get(`wa:${from}`, "json")) ?? [];
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const total = thisMonth.reduce((s, e) => s + e.amountOMR, 0);
      const byCategory: Record<string, number> = {};
      thisMonth.forEach(e => {
        byCategory[e.categoryLabel] = (byCategory[e.categoryLabel] ?? 0) + e.amountOMR;
      });
      const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
      const lines = sorted.map(([cat, amt]) => `  📌 ${cat}: ${formatOMR(amt, currency)}`);

      await sendWA(from, [
        `📈 *تحليل ${now.toLocaleDateString("ar-SA", { month: "long" })}*`,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `💸 الإجمالي: ${formatOMR(total, currency)}`,
        `🧾 عدد المعاملات: ${thisMonth.length}`,
        "",
        "*توزيع الإنفاق:*",
        ...lines,
        "",
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ─── الاشتراك (Premium) ───────────────────────────────────────
    if (["اشترك", "بريميم", "premium", "ترقية"].includes(lowerText)) {
      const sub = await getSubscription(KV, from);
      if (isPremium(sub)) {
        await sendWA(from, `✅ أنت بالفعل مشترك في الخطة المميزة!\n\nتنتهي في: ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("ar-SA-u-ca-gregory") : "—"}`);
      } else {
        const result = await initAmwalPayment(from, "monthly");
        if (result.success && result.url) {
          await sendWA(from, [
            "⭐ *الاشتراك المميز — 1.5 ر.ع/شهر*",
            "",
            "✅ مصاريف غير محدودة",
            "✅ تقارير متقدمة",
            "✅ دعم أولوي",
            "",
            `💳 للدفع: ${result.url}`,
          ].join("\n"));
        } else {
          await sendWA(from, `❌ خطأ في بوابة الدفع: ${result.error ?? "خطأ غير معروف"}`);
        }
      }
      return NextResponse.json({ status: "ok" });
    }

    // ─── أمر المدير ───────────────────────────────────────────────
    if (from === ADMIN_PHONE && lowerText.startsWith("admin:")) {
      const cmd = text.slice(6).trim();
      if (cmd.startsWith("grant ")) {
        const targetPhone = cmd.slice(6).trim();
        const targetSub: Subscription = (await KV?.get(`sub:${targetPhone}`, "json")) ?? {
          plan: "free", expiresAt: null, activatedAt: null, monthlyCount: 0, lastResetMonth: "",
        };
        targetSub.plan = "premium";
        targetSub.activatedAt = new Date().toISOString();
        targetSub.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await KV?.put(`sub:${targetPhone}`, JSON.stringify(targetSub));
        await sendWA(from, `✅ تم منح الاشتراك المميز لـ ${targetPhone}`);
      } else if (cmd === "stats") {
        await sendWA(from, `📊 لوحة المدير\n🌐 ${DASHBOARD_URL}?phone=${from}`);
      }
      return NextResponse.json({ status: "ok" });
    }

    // ─── تسجيل مصروف جديد ────────────────────────────────────────
    const sub = await getSubscription(KV, from);
    if (!isPremium(sub) && sub.monthlyCount >= FREE_LIMIT) {
      await sendWA(from, [
        "⚠️ *وصلت لحد الخطة المجانية*",
        "",
        `لقد سجلت ${FREE_LIMIT} مصروف هذا الشهر.`,
        "للاستمرار بشكل غير محدود، اشترك في الخطة المميزة:",
        "",
        "أرسل: *اشترك*",
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    const expense = parseExpense(text, currency);
    if (expense) {
      const expenses: Expense[] = (await KV?.get(`wa:${from}`, "json")) ?? [];
      expenses.push(expense);
      await KV?.put(`wa:${from}`, JSON.stringify(expenses));

      // تحديث الملف الشخصي
      let profile: UserProfile = (await KV?.get(`profile:${from}`, "json")) ?? {
        totalExpenses: 0, streak: 0, lastExpenseDate: "", health: 100, happiness: 80,
      };
      profile.health    = profile.health    ?? 100;
      profile.happiness = profile.happiness ?? 80;
      profile = updateStreak(profile);
      profile.totalExpenses++;
      await KV?.put(`profile:${from}`, JSON.stringify(profile));

      // تحديث الاشتراك
      sub.monthlyCount++;
      await KV?.put(`sub:${from}`, JSON.stringify(sub));

      // حساب الإنفاق اليومي (بما في ذلك هذا المصروف الجديد)
      const today = new Date().toISOString().slice(0, 10);
      const todayTotal = expenses.filter(e => e.date.startsWith(today)).reduce((s, e) => s + e.amountOMR, 0);

      // نصيحة عشوائية
      const catTips = CATEGORIES[expense.category]?.tips ?? ["تابع مصاريفك يومياً 💡"];
      const tip = catTips[Math.floor(Math.random() * catTips.length)];

      const remaining = remainingFree(sub);

      await sendWA(from, [
        `تم تسجيل المصروف بنجاح!`,
        `┄┄┄ التفاصيل ┄┄┄`,
        ` الفئة: ${expense.categoryLabel}`,
        ` التاريخ: ${new Date().toLocaleDateString("ar-SA-u-ca-gregory")}`,
        ` المبلغ: ${formatOMR(expense.amountOMR, currency)}`,
        ` طريقة الدفع: ${expense.paymentMethod}`,
        ` الوصف: ${expense.description}`,
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`,
        ` نصيحة: ${tip}`,
        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`,
        ` 📊 الإنفاق اليومي: ${formatOMR(todayTotal, currency)}`,
        ` 🔥 سلسلة الأيام: ${profile.streak} يوم`,
        ...(isPremium(sub) ? [] : [` 🎯 مجاني متبقي: ${remaining} مصروف`]),
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
    } else {
      await sendWA(from, [
        "❓ لم أفهم الرسالة.",
        "",
        "💡 *أمثلة:*",
        "  اشتريت عشا بريالين",
        "  5 ريال بنزين",
        "  دفعت 3.500 دواء",
        "",
        "أرسل *مساعدة* لعرض كل الأوامر",
      ].join("\n"));
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

// src/app/api/whatsapp-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN!;
const VERIFY_TOKEN    = process.env.WEBHOOK_VERIFY_TOKEN ?? "mizar-verify-2025";
const AMWAL_MERCHANT  = parseInt(process.env.AMWALPAY_MERCHANT_ID ?? "141336", 10);
const AMWAL_TERMINAL  = parseInt(process.env.AMWALPAY_TERMINAL_ID ?? "679610", 10);
const AMWAL_KEY       = process.env.AMWALPAY_SECURE_KEY ?? "5C1683D1EF9511A8CF13CA396F2CB6FA0461DD411AEAA2E994DCE333E0CF1549";
const AMWAL_BASE      = "https://webhook.amwalpg.com";
const DASHBOARD_URL   = "https://dashboard.baz96997.workers.dev";
const APP_BASE_URL    = "https://finance-dashboard-ca6.pages.dev";

// ─── حد الخطة المجانية ──────────────────────────────────────
const FREE_LIMIT = 30; // مصروف/شهر

// ─── فئات المصاريف ──────────────────────────────────────────
const CATEGORIES: Record<string, { keywords: string[]; label: string; icon: string; tips: string[] }> = {
  food:          { keywords: ["اكل","طعام","مطعم","غداء","عشاء","فطور","قهوة","كافيه","وجبة","بيتزا","برغر","كنتاكي","شاورما","حلويات","سوبرماركت","بقالة","هايبر","لولو","كارفور","جمعية","مقهى","ماكدونالدز","بروستد","شاي","كرك"], label: "طعام وشراب", icon: "🍔", tips: ["حاول الطبخ في البيت أكثر لتوفير تكاليف الطعام 🍳","ابحث عن العروض والتخفيضات في المطاعم 🏷️","خطط لوجباتك الأسبوعية مسبقاً لتوفير المال 📋"] },
  transport:     { keywords: ["بنزين","وقود","تاكسي","كريم","اوبر","مواصلات","بص","صيانة","غسيل سيارة","باص","قطار","طيران"], label: "مواصلات", icon: "🚗", tips: ["حاول مشاركة الركوب مع الزملاء لتوفير الوقود ⛽","تحقق من ضغط الإطارات بانتظام يوفر الوقود 🔧","فكر في استخدام النقل العام عند الإمكان 🚌"] },
  utilities:     { keywords: ["كهرباء","ماء","انترنت","هاتف","جوال","فاتورة","تليفون","موبايل نت","نت"], label: "فواتير", icon: "💡", tips: ["أطفئ الأجهزة الكهربائية عند عدم الاستخدام 🔌","قارن بين باقات الإنترنت للحصول على الأوفر 📡","راجع اشتراكاتك وألغِ غير الضروري منها ❌"] },
  health:        { keywords: ["دواء","دكتور","طبيب","صيدلية","مستشفى","عيادة","علاج","كشف"], label: "صحة", icon: "🏥", tips: ["الوقاية أفضل من العلاج — مارس الرياضة يومياً 🏃","تأكد من تغطية التأمين الصحي لمصاريفك الطبية 🏥","اشترِ الأدوية الجنيسة بدلاً من الماركات لتوفير المال 💊"] },
  entertainment: { keywords: ["سينما","ترفيه","العاب","رحلة","فندق","نزهة","نتفليكس","سبوتيفاي","يوتيوب"], label: "ترفيه", icon: "🎮", tips: ["خصص ميزانية شهرية للترفيه وتمسك بها 🎯","ابحث عن أنشطة ترفيهية مجانية في منطقتك 🌳","شارك اشتراكات المنصات مع العائلة لتوفير التكلفة 👨‍👩‍👧"] },
  shopping:      { keywords: ["ملابس","ثياب","حذاء","ساعة","تسوق","هدية","موبايل","جهاز","اثاث","ديكور","حقيبة"], label: "تسوق", icon: "🛍️", tips: ["انتظر موسم التخفيضات قبل الشراء 🏷️","اسأل نفسك: هل أحتاجه فعلاً؟ انتظر 24 ساعة قبل الشراء ⏰","قارن الأسعار عبر الإنترنت قبل الشراء 📱"] },
  education:     { keywords: ["كتاب","دورة","تعليم","رسوم","قرطاسية","جامعة","مدرسة","كورس"], label: "تعليم", icon: "📚", tips: ["الاستثمار في التعليم هو أفضل استثمار 🎓","ابحث عن دورات مجانية عبر الإنترنت 💻","استخدم المكتبة العامة للكتب مجاناً 📖"] },
  savings:       { keywords: ["توفير","ادخار","استثمار","بنك","صندوق"], label: "مدخرات", icon: "🏦", tips: ["احرص على توفير 20٪ من دخلك الشهري 💪","قاعدة 50/30/20: 50 ضروريات، 30 رغبات، 20 مدخرات 📊","ابدأ صندوق طوارئ يغطي 3-6 أشهر من المصاريف 🛡️"] },
};

// ─── واجهات البيانات ─────────────────────────────────────────
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

interface UserSettings {
  dailyBudget: number;
  currency: string;
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
  monthlyCount: number; // عدد المصاريف هذا الشهر (للخطة المجانية)
  lastResetMonth: string; // "2026-11"
}

// ─── أموال: HMAC-SHA256 (Edge Runtime) ───────────────────────
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
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

// ─── Amwal: تهيئة الدفع ──────────────────────────────────────
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

// ─── فحص الاشتراك ───────────────────────────────────────────
async function getSubscription(KV: KVNamespace, phone: string): Promise<Subscription> {
  const sub: Subscription = (await KV.get(`sub:${phone}`, "json")) ?? {
    plan: "free",
    expiresAt: null,
    activatedAt: null,
    monthlyCount: 0,
    lastResetMonth: "",
  };

  // إعادة تعيين العداد الشهري
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (sub.lastResetMonth !== currentMonth) {
    sub.monthlyCount = 0;
    sub.lastResetMonth = currentMonth;
    await KV.put(`sub:${phone}`, JSON.stringify(sub));
  }

  // التحقق من انتهاء الاشتراك المدفوع
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

// ─── تحويل الأرقام العربية/الهندية ──────────────────────────
function convertDigits(s: string): string {
  return s.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660));
}

// ─── العملات الخليجية ────────────────────────────────────────
const CURRENCIES: Record<string, { label: string; rate: number }> = {
  "ر.ع": { label: "ر.ع", rate: 1 }, "ريال عماني": { label: "ر.ع", rate: 1 }, "omr": { label: "ر.ع", rate: 1 },
  "بيسة": { label: "بيسة", rate: 0.001 }, "بيسات": { label: "بيسة", rate: 0.001 },
  "ر.س": { label: "ر.س", rate: 0.103 }, "ريال سعودي": { label: "ر.س", rate: 0.103 }, "sar": { label: "ر.س", rate: 0.103 },
  "درهم": { label: "د.إ", rate: 0.1026 }, "د.إ": { label: "د.إ", rate: 0.1026 }, "aed": { label: "د.إ", rate: 0.1026 },
  "د.ك": { label: "د.ك", rate: 1.22 }, "دينار كويتي": { label: "د.ك", rate: 1.22 },
  "د.ب": { label: "د.ب", rate: 1.055 }, "دينار بحريني": { label: "د.ب", rate: 1.055 },
  "ر.ق": { label: "ر.ق", rate: 0.103 }, "ريال قطري": { label: "ر.ق", rate: 0.103 },
};

// ─── استخراج المبلغ ──────────────────────────────────────────
function extractAmount(text: string): { amount: number; currency: string; amountOMR: number } | null {
  const t = convertDigits(text);
  const numWords: Record<string, number> = {
    "نص": 0.5, "نصف": 0.5, "ربع": 0.25, "ثلاثة ارباع": 0.75,
    "واحد": 1, "اثنين": 2, "اثنان": 2, "ثلاثة": 3, "اربعة": 4, "خمسة": 5,
    "ستة": 6, "سبعة": 7, "ثمانية": 8, "تسعة": 9, "عشرة": 10,
    "خمستاشر": 15, "خمسطعش": 15, "عشرين": 20, "خمسة وعشرين": 25,
    "ثلاثين": 30, "اربعين": 40, "خمسين": 50, "ستين": 60, "سبعين": 70,
    "ثمانين": 80, "تسعين": 90, "مية": 100, "مئة": 100, "مائة": 100,
    "مئتين": 200, "ميتين": 200, "خمسمية": 500, "الف": 1000, "ألف": 1000,
  };

  // ريالين / درهمين (صيغة المثنى)
  const dual = t.match(/ريالين|درهمين|دينارين/);
  if (dual) {
    const curr = dual[0].includes("ريالين") ? "ر.ع" : dual[0].includes("درهمين") ? "درهم" : "د.ك";
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
    return { amount: val, currency: "ر.ع", amountOMR: val };
  }

  // رقم فقط
  const m2 = t.match(/(\d+(?:[.,]\d+)?)/);
  if (m2) {
    const amt = parseFloat(m2[1].replace(",", "."));
    return { amount: amt, currency: "ر.ع", amountOMR: amt };
  }

  return null;
}

// ─── تنسيق المبلغ ────────────────────────────────────────────
function formatOMR(v: number): string {
  if (v < 1) return `${Math.round(v * 1000)} بيسة`;
  return `${v.toFixed(3)} ر.ع`;
}

// ─── تحليل المصروف ───────────────────────────────────────────
function parseExpense(text: string): Expense | null {
  const extracted = extractAmount(text);
  if (!extracted) return null;
  const { amount, currency, amountOMR } = extracted;
  if (amount <= 0 || amount > 100000) return null;

  const lowerText = text.toLowerCase();
  let category = "other", categoryLabel = "أخرى", categoryIcon = "📦", subcategory = "";
  let tips: string[] = ["تابع مصاريفك يومياً لتحسين عاداتك المالية 💡"];

  for (const [cat, { keywords, label, icon, tips: catTips }] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      category = cat; categoryLabel = label; categoryIcon = icon; tips = catTips;
      subcategory = keywords.find(kw => lowerText.includes(kw)) ?? "";
      break;
    }
  }

  // طريقة الدفع
  let paymentMethod = "نقداً";
  if (/بطاق|فيزا|ماستر|كارت|card/i.test(text)) paymentMethod = "بطاقة";
  else if (/تحويل|اونلاين|online|مدفع|stc|oman.*net|بنك/i.test(text)) paymentMethod = "دفع رقمي";
  else if (/آجل|دين|تقسيط|قسط/i.test(text)) paymentMethod = "آجل";

  // تقسيط
  let installments = 1, totalInstallments = 1;
  const instMatch = text.match(/(\d+)\s*(?:قسط|أقساط)\s*(?:من|\/)\s*(\d+)/);
  if (instMatch) { installments = parseInt(instMatch[1]); totalInstallments = parseInt(instMatch[2]); }

  const cleanDesc = text
    .replace(/\d+(?:[.,]\d+)?/g, "")
    .replace(new RegExp(Object.keys(CURRENCIES).join("|"), "gi"), "")
    .replace(/\b(مصروف|صرفت|دفعت|اشتريت|اكلت|شريت|خرج|خلصت|بطاق|نقد|تحويل)\b/gi, "")
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

// ─── مستوى اللاعب ────────────────────────────────────────────
function getLevel(total: number): { num: number; icon: string; name: string } {
  if (total < 10)  return { num: 1, icon: "🌱", name: "مبتدئ" };
  if (total < 30)  return { num: 2, icon: "⭐", name: "منتظم" };
  if (total < 60)  return { num: 3, icon: "🔥", name: "متميز" };
  if (total < 100) return { num: 4, icon: "💎", name: "محترف" };
  if (total < 200) return { num: 5, icon: "👑", name: "خبير" };
  return { num: 6, icon: "🏆", name: "أسطورة" };
}

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

// ─── إرسال واتساب ────────────────────────────────────────────
async function sendWA(to: string, body: string) {
  await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body } }),
  });
}

// ════════════════════════════════════════════════════════════
// GET — التحقق من الـ Webhook
// ════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN)
    return new Response(challenge ?? "", { status: 200 });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// ════════════════════════════════════════════════════════════
// POST — استقبال الرسائل
// ════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  try {
    const body     = await req.json();
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return NextResponse.json({ status: "ok" });

    const msg = messages[0];
    if (msg.type !== "text") return NextResponse.json({ status: "ok" });

    const from = msg.from as string;
    const text = (msg.text.body as string).trim();

    const { env } = getRequestContext();
    const KV = (env as Record<string, KVNamespace>).EXPENSES_KV;

    const lower = text.toLowerCase().trim();

    // ════════════════════════════════════════════════════════
    // أمر: مساعدة
    // ════════════════════════════════════════════════════════
    if (["مساعدة", "help", "?", "؟", "اوامر"].includes(lower)) {
      const sub = await getSubscription(KV, from);
      const planBadge = isPremium(sub) ? "⭐ بريميوم" : `🆓 مجاني (${remainingFree(sub)}/${FREE_LIMIT} متبقي)`;
      await sendWA(from, [
        "💎 *رفيقك المالي — الأوامر المتاحة*",
        "",
        "📝 *تسجيل مصروف:*",
        "  مثال: 50 بنزين",
        "  مثال: 100 ريال اكل مطعم",
        "  مثال: 500 بيسة قهوة",
        "",
        "📊 *ملخص* — ملخص المصاريف الشهرية",
        "📋 *قائمة* — آخر 5 مصاريف",
        "🗑️ *حذف* — حذف آخر مصروف",
        "💰 *ميزانية 50* — تعيين ميزانية يومية",
        "💳 *اشتراك* — ترقية للبريميوم",
        "",
        `📌 خطتك الحالية: ${planBadge}`,
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: اشتراك
    // ════════════════════════════════════════════════════════
    if (["اشتراك", "اشترك", "subscribe", "بريميوم", "premium", "ترقية"].includes(lower)) {
      const sub = await getSubscription(KV, from);

      if (isPremium(sub)) {
        const exp = new Date(sub.expiresAt!).toLocaleDateString("ar-OM");
        await sendWA(from, [
          "✅ *أنت مشترك في الخطة المميزة!* ⭐",
          "",
          `📅 الاشتراك ساري حتى: ${exp}`,
          `🌐 داشبوردك: ${DASHBOARD_URL}?phone=${from}`,
        ].join("\n"));
        return NextResponse.json({ status: "ok" });
      }

      // عرض خيارات الاشتراك
      await sendWA(from, [
        "💎 *ترقية إلى البريميوم*",
        "",
        "🆓 *خطتك الحالية:*",
        `   ${remainingFree(sub)} مصروف متبقي من ${FREE_LIMIT} هذا الشهر`,
        "",
        "⭐ *البريميوم يمنحك:*",
        "   ✅ تسجيل غير محدود للمصاريف",
        "   ✅ تقارير متقدمة وإحصائيات",
        "   ✅ تنبيهات ذكية للميزانية",
        "   ✅ تصدير PDF",
        "",
        "💰 *الأسعار:*",
        "   📅 شهري: 1.5 ر.ع",
        "   📆 سنوي: 15 ر.ع (شهران مجاناً 🎁)",
        "",
        "اختر خطتك:",
        "👉 أرسل *اشتراك شهري*",
        "👉 أرسل *اشتراك سنوي*",
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: اشتراك شهري / سنوي
    // ════════════════════════════════════════════════════════
    if (["اشتراك شهري", "شهري", "monthly"].includes(lower) ||
        ["اشتراك سنوي", "سنوي", "yearly", "annual"].includes(lower)) {
      const plan = ["اشتراك سنوي", "سنوي", "yearly", "annual"].includes(lower) ? "yearly" : "monthly";
      const price = plan === "yearly" ? "15 ر.ع" : "1.5 ر.ع";

      await sendWA(from, `⏳ جاري تجهيز رابط الدفع (${price})...`);

      const result = await initAmwalPayment(from, plan);
      if (result.success && result.url) {
        await sendWA(from, [
          `💳 *رابط الدفع جاهز!*`,
          "",
          `📦 الخطة: ${plan === "yearly" ? "سنوية" : "شهرية"}`,
          `💰 السعر: ${price}`,
          "",
          `🔗 ${result.url}`,
          "",
          "✅ بعد الدفع يتفعل اشتراكك تلقائياً 🎉",
        ].join("\n"));
      } else {
        await sendWA(from, [
          "❌ *حدث خطأ في تجهيز رابط الدفع*",
          "",
          "يرجى المحاولة مرة أخرى لاحقاً أو التواصل مع الدعم.",
        ].join("\n"));
      }
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: ملخص
    // ════════════════════════════════════════════════════════
    if (["ملخص", "رصيد", "summary"].includes(lower)) {
      const expenses: Expense[] = (await KV.get(`wa:${from}`, "json")) ?? [];
      const now = new Date();
      const thisMonth = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const total = thisMonth.reduce((s, e) => s + e.amountOMR, 0);
      const byCategory: Record<string, number> = {};
      thisMonth.forEach(e => {
        const key = `${e.categoryIcon} ${e.categoryLabel}`;
        byCategory[key] = (byCategory[key] ?? 0) + e.amountOMR;
      });
      const lines = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => `   ${cat}: ${formatOMR(amt)}`);

      const settings: UserSettings = (await KV.get(`settings:${from}`, "json")) ?? { dailyBudget: 0, currency: "OMR" };
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const avgDaily = total / now.getDate();

      await sendWA(from, [
        `📊 *ملخص ${now.toLocaleDateString("ar-OM", { month: "long", year: "numeric" })}*`,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `💸 الإجمالي: *${formatOMR(total)}*`,
        `🧾 عدد المعاملات: ${thisMonth.length}`,
        `📈 متوسط يومي: ${formatOMR(avgDaily)}`,
        settings.dailyBudget > 0 ? `💰 الميزانية اليومية: ${formatOMR(settings.dailyBudget)}` : "",
        "",
        "📂 *حسب الفئة:*",
        ...lines,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].filter(Boolean).join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: قائمة
    // ════════════════════════════════════════════════════════
    if (["قائمة", "المصاريف", "list"].includes(lower)) {
      const expenses: Expense[] = (await KV.get(`wa:${from}`, "json")) ?? [];
      const last5 = expenses.slice(-5).reverse();
      if (!last5.length) {
        await sendWA(from, "📭 لا يوجد مصاريف مسجلة بعد.\n\nأرسل مصروفاً مثل: *50 بنزين*");
      } else {
        const lines = last5.map(e =>
          `${e.categoryIcon} *${e.description}* — ${e.amount} ${e.currency}\n   📅 ${new Date(e.date).toLocaleDateString("ar-OM")} • ${e.paymentMethod}`
        );
        await sendWA(from, ["📋 *آخر 5 مصاريف:*", "", ...lines, "", `🌐 ${DASHBOARD_URL}?phone=${from}`].join("\n\n"));
      }
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: حذف
    // ════════════════════════════════════════════════════════
    if (["حذف", "الغ", "undo", "مسح"].includes(lower)) {
      const expenses: Expense[] = (await KV.get(`wa:${from}`, "json")) ?? [];
      if (!expenses.length) {
        await sendWA(from, "❌ لا يوجد مصاريف لحذفها.");
      } else {
        const deleted = expenses.pop()!;
        await KV.put(`wa:${from}`, JSON.stringify(expenses));
        // تحديث العداد الشهري
        const sub = await getSubscription(KV, from);
        if (sub.monthlyCount > 0) { sub.monthlyCount--; await KV.put(`sub:${from}`, JSON.stringify(sub)); }
        await sendWA(from, `🗑️ تم حذف: *${deleted.description}* — ${deleted.amount} ${deleted.currency}`);
      }
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // أمر: ميزانية
    // ════════════════════════════════════════════════════════
    const budgetMatch = text.match(/^ميزانية\s+(\d+(?:[.,]\d+)?)/);
    if (budgetMatch) {
      const budget = parseFloat(budgetMatch[1].replace(",", "."));
      const settings: UserSettings = (await KV.get(`settings:${from}`, "json")) ?? { dailyBudget: 0, currency: "OMR" };
      settings.dailyBudget = budget;
      await KV.put(`settings:${from}`, JSON.stringify(settings));
      await sendWA(from, `✅ تم تعيين ميزانيتك اليومية على *${formatOMR(budget)}* 💰\n\nسأنبهك عند اقترابك من الحد!`);
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // ردود السياق الذكية
    // ════════════════════════════════════════════════════════

    // تحية
    const greetings = ["هاي","هلا","هلو","مرحبا","مرحبًا","السلام عليكم","سلام","صباح الخير","مساء الخير","صباح النور","مساء النور","اهلا","أهلا","هلاً","hi","hello","hey"];
    if (greetings.some(g => lower === g || lower.startsWith(g + " "))) {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "مرحباً" : "مساء الخير";
      await sendWA(from, [
        `${greeting}! 👋 أنا رفيقك المالي على واتساب 💙`,
        "",
        "أساعدك تسجّل مصاريفك بسهولة وتتابع إنفاقك يومياً.",
        "",
        "🚀 *ابدأ الآن — سجّل أول مصروف:*",
        "   مثال: *50 بنزين*",
        "   مثال: *100 غداء مطعم*",
        "   مثال: *200 بيسة قهوة*",
        "",
        "أو أرسل *مساعدة* لمعرفة كل ما أقدر أسويه لك 😊",
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // شكر
    const thanks = ["شكرا","شكراً","شكرا لك","تسلم","يسلمو","يسلموا","ما قصرت","مشكور","مشكورين","thank","thanks","ثانكس"];
    if (thanks.some(t => lower.includes(t))) {
      await sendWA(from, [
        "العفو! يسعدني أخدمك دايماً 😊💙",
        "",
        "تذكّر، أنا هنا 24/7 لمساعدتك في تتبع مصاريفك.",
        "لما تصرف شيء، بس أرسله لي وأسجله لك فوراً ✅",
        "",
        `🌐 داشبوردك: ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // رقم بدون وصف
    const bareNumber = /^[\d٠-٩]+([.,][\d٠-٩]+)?$/.test(text.trim());
    if (bareNumber) {
      await sendWA(from, [
        `🤔 شفت الرقم *${text}* — بس وش هو المصروف؟`,
        "",
        "أضف وصف بسيط معه، مثال:",
        `   ✏️ *${text} بنزين*`,
        `   ✏️ *${text} غداء*`,
        `   ✏️ *${text} سوبرماركت*`,
        "",
        "وأنا أسجله لك فوراً! 💪",
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // استفسار عن الرصيد أو المال
    const moneyQ = ["كم","رصيد","باقي","كمية","مجموع","صرفت كم","كم صرفت","وين راح","فلوس"];
    if (moneyQ.some(q => lower.includes(q))) {
      await sendWA(from, [
        "📊 تبي تعرف وضعك المالي؟",
        "",
        "أرسل *ملخص* وأعطيك تقرير كامل عن مصاريف الشهر 👇",
        "",
        "أو شوف داشبوردك المرئي هنا:",
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].join("\n"));
      return NextResponse.json({ status: "ok" });
    }

    // ════════════════════════════════════════════════════════
    // تسجيل مصروف
    // ════════════════════════════════════════════════════════
    const expense = parseExpense(text);
    if (expense) {
      // فحص حد الخطة المجانية
      const sub = await getSubscription(KV, from);
      if (!isPremium(sub) && sub.monthlyCount >= FREE_LIMIT) {
        await sendWA(from, [
          "⚠️ *وصلت للحد الشهري المجاني!*",
          "",
          `لقد سجلت ${FREE_LIMIT} مصروف هذا الشهر.`,
          "للاستمرار بدون حدود، اشترك في الخطة المميزة:",
          "",
          "⭐ *البريميوم: 1.5 ر.ع/شهر فقط*",
          "",
          "👉 أرسل *اشتراك* لتفعيل حسابك",
        ].join("\n"));
        return NextResponse.json({ status: "ok" });
      }

      // حفظ المصروف
      const expenses: Expense[] = (await KV.get(`wa:${from}`, "json")) ?? [];
      expenses.push(expense);
      await KV.put(`wa:${from}`, JSON.stringify(expenses));

      // تحديث العداد والبروفايل
      sub.monthlyCount++;
      await KV.put(`sub:${from}`, JSON.stringify(sub));

      let profile: UserProfile = (await KV.get(`profile:${from}`, "json")) ?? {
        totalExpenses: 0, streak: 0, lastExpenseDate: "", health: 100, happiness: 80,
      };
      profile.totalExpenses++;
      profile = updateStreak(profile);
      await KV.put(`profile:${from}`, JSON.stringify(profile));

      // نصيحة
      const tips = CATEGORIES[expense.category]?.tips ?? ["تابع مصاريفك يومياً 💡"];
      const tip  = tips[Math.floor(Math.random() * tips.length)];

      // مستوى
      const level = getLevel(profile.totalExpenses);
      const streakText = profile.streak > 1 ? `🔥 سلسلة الأيام: ${profile.streak} أيام 🔥` : "يوم جديد، بداية جديدة! 🌟";

      // فحص الميزانية اليومية
      const settings: UserSettings = (await KV.get(`settings:${from}`, "json")) ?? { dailyBudget: 0, currency: "OMR" };
      let budgetWarning = "";
      if (settings.dailyBudget > 0) {
        const today = new Date().toISOString().slice(0, 10);
        const todayExpenses = expenses.filter(e => e.date.startsWith(today));
        const todayTotal = todayExpenses.reduce((s, e) => s + e.amountOMR, 0);
        const ratio = todayTotal / settings.dailyBudget;
        if (ratio >= 1)       budgetWarning = `\n🚨 *تنبيه:* تجاوزت ميزانيتك اليومية! (${formatOMR(todayTotal)} من ${formatOMR(settings.dailyBudget)})`;
        else if (ratio >= 0.8) budgetWarning = `\n⚠️ *تنبيه:* اقتربت من ميزانيتك اليومية (${Math.round(ratio * 100)}%)`;
      }

      // رسالة التسجيل
      const perInstallment = expense.amountOMR / expense.totalInstallments;
      await sendWA(from, [
        "✅ *تم تسجيل المصروف بنجاح!*",
        "┄┄┄ التفاصيل ┄┄┄",
        `📂 الفئة: ${expense.categoryLabel}`,
        expense.subcategory ? `🏷️ الفئة الفرعية: ${expense.subcategory}` : "",
        `📅 التاريخ: ${new Date().toLocaleDateString("ar-OM")}`,
        `💰 المبلغ: ${expense.amount} ${expense.currency}`,
        `💵 طريقة الدفع: ${expense.paymentMethod}`,
        `📝 الوصف: ${expense.description}`,
        `🔢 تقسيط: ${expense.installments}/${expense.totalInstallments}`,
        `💲 كل قسط: ${formatOMR(perInstallment)}`,
        `🧾 الإجمالي: ${formatOMR(expense.amountOMR)}`,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `💡 نصيحة: ${tip}`,
        "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄",
        `🌟 رفيقك المالي ${level.icon} (المستوى ${level.num} — ${level.name})`,
        `❤️ الصحة: ${profile.health}٪`,
        `😊 السعادة: ${profile.happiness}٪`,
        streakText,
        !isPremium(sub) ? `\n📌 مجاني: ${remainingFree(sub)} مصروف متبقي هذا الشهر` : "",
        budgetWarning,
        `🌐 ${DASHBOARD_URL}?phone=${from}`,
      ].filter(l => l !== "").join("\n"));
    } else {
      // رد ذكي ودافئ على ما لم يُفهم
      const funnyResponses = [
        "🤔 ما وصلت بالضبط، بس ما تقلق!",
        "😅 والله ما فهمت قصدك، بس أنا هنا!",
        "🙈 يبدو الرسالة راحت عليّ!",
      ];
      const opener = funnyResponses[Math.floor(Math.random() * funnyResponses.length)];
      await sendWA(from, [
        opener,
        "",
        "أنا أفهم المصاريف — سجّل أي مصروف هيك:",
        "   ✏️ *50 بنزين*",
        "   ✏️ *100 ريال غداء مطعم*",
        "   ✏️ *500 بيسة قهوة*",
        "   ✏️ *خمسة ريال كرك*",
        "   ✏️ *درهمين نقد*",
        "",
        "أو اختار من الأوامر:",
        "   📊 *ملخص* — شوف إنفاقك الشهري",
        "   📋 *قائمة* — آخر مصاريفك",
        "   💳 *اشتراك* — ترقية للبريميوم",
        "   ❓ *مساعدة* — كل الأوامر المتاحة",
        "",
        "أنا هنا دايماً 💙",
      ].join("\n"));
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}

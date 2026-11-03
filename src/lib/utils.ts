import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── خريطة العملات الخليجية وعدد الكسور الصحيحة ───────────────
// 3 كسور: OMR (عُمان)، KWD (الكويت)، BHD (البحرين)، JOD (الأردن)
// 2 كسور: SAR (السعودية)، AED (الإمارات)، QAR (قطر)، EGP (مصر)
const CURRENCY_DECIMALS: Record<string, number> = {
  OMR: 3,  // ريال عماني — الفلس (0.001)
  KWD: 3,  // دينار كويتي — الفلس (0.001)
  BHD: 3,  // دينار بحريني — الفلس (0.001)
  JOD: 3,  // دينار أردني — الفلس (0.001)
  SAR: 2,  // ريال سعودي — الهللة (0.01)
  AED: 2,  // درهم إماراتي — الفلس (0.01)
  QAR: 2,  // ريال قطري — الدرهم (0.01)
  EGP: 2,  // جنيه مصري — القرش (0.01)
  USD: 2,
  EUR: 2,
};

// رموز العملات بالعربية
export const CURRENCY_SYMBOLS: Record<string, string> = {
  OMR: "ر.ع",
  KWD: "د.ك",
  BHD: "د.ب",
  JOD: "د.أ",
  SAR: "ر.س",
  AED: "د.إ",
  QAR: "ر.ق",
  EGP: "ج.م",
  USD: "$",
  EUR: "€",
};

// تخمين العملة من كود الدولة
export const COUNTRY_CURRENCY: Record<string, string> = {
  "+968": "OMR",  // عُمان
  "+966": "SAR",  // السعودية
  "+971": "AED",  // الإمارات
  "+965": "KWD",  // الكويت
  "+974": "QAR",  // قطر
  "+973": "BHD",  // البحرين
  "+962": "JOD",  // الأردن
  "+20":  "EGP",  // مصر
};

export function getCurrencyDecimals(currency = "OMR"): number {
  return CURRENCY_DECIMALS[currency] ?? 2;
}

export function formatCurrency(amount: number, currency = "OMR"): string {
  const decimals = getCurrencyDecimals(currency);
  try {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // fallback لو الـ currency code غير صحيح
    const sym = CURRENCY_SYMBOLS[currency] ?? currency;
    return `${amount.toFixed(decimals)} ${sym}`;
  }
}

// تنسيق بسيط بدون رمز العملة
export function formatAmount(amount: number, currency = "OMR"): string {
  return amount.toFixed(getCurrencyDecimals(currency));
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getBudgetStatus(spent: number, limit: number): "safe" | "warning" | "exceeded" {
  const pct = spent / limit;
  if (pct >= 1) return "exceeded";
  if (pct >= 0.8) return "warning";
  return "safe";
}

export function getGoalProgress(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

export function getDaysLeft(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

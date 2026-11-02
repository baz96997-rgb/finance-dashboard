import { Account, Category, Transaction, Budget, Goal } from "@/types";

export const defaultCategories: Category[] = [
  // Expense categories
  { id: "cat-food", name: "مأكل ومشرب", type: "expense", icon: "🍽️", color: "#f97316" },
  { id: "cat-transport", name: "مواصلات", type: "expense", icon: "🚗", color: "#8b5cf6" },
  { id: "cat-shopping", name: "تسوق", type: "expense", icon: "🛍️", color: "#ec4899" },
  { id: "cat-health", name: "صحة وطب", type: "expense", icon: "🏥", color: "#ef4444" },
  { id: "cat-education", name: "تعليم", type: "expense", icon: "📚", color: "#3b82f6" },
  { id: "cat-entertainment", name: "ترفيه", type: "expense", icon: "🎬", color: "#06b6d4" },
  { id: "cat-utilities", name: "فواتير ومرافق", type: "expense", icon: "⚡", color: "#eab308" },
  { id: "cat-rent", name: "إيجار وسكن", type: "expense", icon: "🏠", color: "#14b8a6" },
  { id: "cat-other-exp", name: "أخرى", type: "expense", icon: "📦", color: "#6b7280" },
  // Income categories
  { id: "cat-salary", name: "راتب", type: "income", icon: "💼", color: "#10b981" },
  { id: "cat-freelance", name: "عمل حر", type: "income", icon: "💻", color: "#1a6fd4" },
  { id: "cat-investment", name: "استثمار", type: "income", icon: "📈", color: "#22d3c8" },
  { id: "cat-gift", name: "هدية", type: "income", icon: "🎁", color: "#f59e0b" },
  { id: "cat-other-inc", name: "دخل آخر", type: "income", icon: "💰", color: "#84cc16" },
];

export const defaultAccounts: Account[] = [
  { id: "acc-cash", name: "نقدي", type: "cash", balance: 450, color: "#10b981", icon: "💵", createdAt: "2024-01-01T00:00:00Z" },
  { id: "acc-bank1", name: "بنك مسقط", type: "bank", balance: 3200, color: "#1a6fd4", icon: "🏦", createdAt: "2024-01-01T00:00:00Z" },
  { id: "acc-bank2", name: "البنك الوطني", type: "bank", balance: 1800, color: "#8b5cf6", icon: "🏦", createdAt: "2024-01-01T00:00:00Z" },
  { id: "acc-credit", name: "بطاقة ائتمان", type: "credit", balance: -620, color: "#ef4444", icon: "💳", createdAt: "2024-01-01T00:00:00Z" },
];

const now = new Date();
const y = now.getFullYear();
const m = now.getMonth();

function d(daysAgo: number): string {
  const date = new Date(y, m, now.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

export const defaultTransactions: Transaction[] = [
  // Income
  { id: "t1",  type: "income",  amount: 1200, categoryId: "cat-salary",      accountId: "acc-bank1", date: d(1),  description: "راتب شهر " + now.toLocaleString("ar", { month: "long" }), createdAt: d(1) },
  { id: "t2",  type: "income",  amount: 350,  categoryId: "cat-freelance",   accountId: "acc-bank2", date: d(5),  description: "مشروع تصميم موقع", createdAt: d(5) },
  { id: "t3",  type: "income",  amount: 80,   categoryId: "cat-investment",  accountId: "acc-bank1", date: d(10), description: "أرباح توزيعات", createdAt: d(10) },
  // Expenses
  { id: "t4",  type: "expense", amount: 85,   categoryId: "cat-food",        accountId: "acc-cash",  date: d(0),  description: "سوبرماركت لولو", createdAt: d(0) },
  { id: "t5",  type: "expense", amount: 45,   categoryId: "cat-transport",   accountId: "acc-cash",  date: d(1),  description: "وقود السيارة", createdAt: d(1) },
  { id: "t6",  type: "expense", amount: 120,  categoryId: "cat-shopping",    accountId: "acc-credit",date: d(2),  description: "ملابس - سيتي سنتر", createdAt: d(2) },
  { id: "t7",  type: "expense", amount: 35,   categoryId: "cat-entertainment",accountId: "acc-bank1",date: d(3),  description: "اشتراك نتفليكس + يوتيوب", createdAt: d(3) },
  { id: "t8",  type: "expense", amount: 200,  categoryId: "cat-utilities",   accountId: "acc-bank1", date: d(4),  description: "فاتورة الكهرباء والماء", createdAt: d(4) },
  { id: "t9",  type: "expense", amount: 60,   categoryId: "cat-food",        accountId: "acc-cash",  date: d(5),  description: "مطعم عشاء عائلي", createdAt: d(5) },
  { id: "t10", type: "expense", amount: 400,  categoryId: "cat-rent",        accountId: "acc-bank2", date: d(6),  description: "إيجار الشقة الشهري", createdAt: d(6) },
  { id: "t11", type: "expense", amount: 75,   categoryId: "cat-health",      accountId: "acc-bank1", date: d(7),  description: "زيارة طبيب وأدوية", createdAt: d(7) },
  { id: "t12", type: "expense", amount: 150,  categoryId: "cat-education",   accountId: "acc-bank1", date: d(8),  description: "كورس أونلاين - يوديمي", createdAt: d(8) },
  { id: "t13", type: "expense", amount: 30,   categoryId: "cat-food",        accountId: "acc-cash",  date: d(9),  description: "قهوة ومخبز", createdAt: d(9) },
  { id: "t14", type: "expense", amount: 25,   categoryId: "cat-transport",   accountId: "acc-cash",  date: d(11), description: "تاكسي وكريم", createdAt: d(11) },
  { id: "t15", type: "expense", amount: 90,   categoryId: "cat-shopping",    accountId: "acc-credit",date: d(12), description: "إكسسوارات منزلية", createdAt: d(12) },
  { id: "t16", type: "income",  amount: 200,  categoryId: "cat-other-inc",   accountId: "acc-cash",  date: d(14), description: "بيع جهاز قديم", createdAt: d(14) },
  { id: "t17", type: "expense", amount: 55,   categoryId: "cat-food",        accountId: "acc-cash",  date: d(15), description: "طلب أكل - طلبات", createdAt: d(15) },
  { id: "t18", type: "expense", amount: 180,  categoryId: "cat-shopping",    accountId: "acc-credit",date: d(16), description: "أحذية رياضية", createdAt: d(16) },
  { id: "t19", type: "expense", amount: 20,   categoryId: "cat-entertainment",accountId: "acc-cash", date: d(17), description: "سينما - كيدزوني", createdAt: d(17) },
  { id: "t20", type: "expense", amount: 65,   categoryId: "cat-food",        accountId: "acc-bank1", date: d(18), description: "بقالة أسبوعية", createdAt: d(18) },
];

export const defaultBudgets: Budget[] = [
  { id: "b1", categoryId: "cat-food",        limit: 300, month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
  { id: "b2", categoryId: "cat-transport",   limit: 100, month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
  { id: "b3", categoryId: "cat-shopping",    limit: 250, month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
  { id: "b4", categoryId: "cat-entertainment",limit: 80,  month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
  { id: "b5", categoryId: "cat-utilities",   limit: 250, month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
  { id: "b6", categoryId: "cat-health",      limit: 150, month: `${y}-${String(m + 1).padStart(2, "0")}`, spent: 0 },
];

export const defaultGoals: Goal[] = [
  { id: "g1", name: "رحلة عائلية لتركيا", targetAmount: 2000, currentAmount: 750, targetDate: `${y + 1}-06-01`, icon: "✈️", color: "#1a6fd4", createdAt: d(30) },
  { id: "g2", name: "شراء سيارة جديدة", targetAmount: 8000, currentAmount: 2200, targetDate: `${y + 2}-01-01`, icon: "🚗", color: "#10b981", createdAt: d(60) },
  { id: "g3", name: "صندوق طوارئ", targetAmount: 3000, currentAmount: 1400, targetDate: `${y + 1}-12-31`, icon: "🛡️", color: "#f59e0b", createdAt: d(45) },
  { id: "g4", name: "جهاز لابتوب جديد", targetAmount: 600, currentAmount: 320, targetDate: `${y}-12-01`, icon: "💻", color: "#8b5cf6", createdAt: d(20) },
];

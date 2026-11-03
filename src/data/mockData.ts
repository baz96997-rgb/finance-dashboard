import { Account, Category, Transaction, Budget, Goal } from "@/types";

// الفئات الافتراضية — تُستخدم دائماً للتصنيف
export const defaultCategories: Category[] = [
  // فئات المصاريف
  { id: "cat-food",          name: "مأكل ومشرب",    type: "expense", icon: "🍽️", color: "#f97316" },
  { id: "cat-transport",     name: "مواصلات",        type: "expense", icon: "🚗", color: "#8b5cf6" },
  { id: "cat-shopping",      name: "تسوق",           type: "expense", icon: "🛍️", color: "#ec4899" },
  { id: "cat-health",        name: "صحة وطب",        type: "expense", icon: "🏥", color: "#ef4444" },
  { id: "cat-education",     name: "تعليم",          type: "expense", icon: "📚", color: "#3b82f6" },
  { id: "cat-entertainment", name: "ترفيه",          type: "expense", icon: "🎬", color: "#06b6d4" },
  { id: "cat-utilities",     name: "فواتير ومرافق",  type: "expense", icon: "⚡", color: "#eab308" },
  { id: "cat-rent",          name: "إيجار وسكن",     type: "expense", icon: "🏠", color: "#14b8a6" },
  { id: "cat-other-exp",     name: "أخرى",           type: "expense", icon: "📦", color: "#6b7280" },
  // فئات الدخل
  { id: "cat-salary",        name: "راتب",           type: "income",  icon: "💼", color: "#10b981" },
  { id: "cat-freelance",     name: "عمل حر",         type: "income",  icon: "💻", color: "#1a6fd4" },
  { id: "cat-investment",    name: "استثمار",        type: "income",  icon: "📈", color: "#22d3c8" },
  { id: "cat-gift",          name: "هدية",           type: "income",  icon: "🎁", color: "#f59e0b" },
  { id: "cat-other-inc",     name: "دخل آخر",        type: "income",  icon: "💰", color: "#84cc16" },
];

// حسابات افتراضية — المستخدم الجديد يبدأ بصفر
export const defaultAccounts: Account[] = [];

// معاملات — فارغة للمستخدم الجديد
export const defaultTransactions: Transaction[] = [];

// ميزانيات — فارغة للمستخدم الجديد
export const defaultBudgets: Budget[] = [];

// أهداف — فارغة للمستخدم الجديد
export const defaultGoals: Goal[] = [];

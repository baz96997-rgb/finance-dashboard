// ==================== Types ====================

export type TransactionType = "income" | "expense";
export type AccountType = "cash" | "bank" | "credit";
export type BudgetStatus = "safe" | "warning" | "exceeded";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  date: string;
  description: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  month: string; // YYYY-MM
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface User {
  phone: string;
  name: string;
  currency: string;
  theme: "light" | "dark";
  // معلومات مالية شخصية
  monthlyIncome: number;       // الدخل الشهري بالريال العماني
  monthlyObligations: number;  // الالتزامات الشهرية (إيجار، أقساط، ...)
  savingsGoalPct: number;      // هدف الادخار كنسبة مئوية (0-100)
  setupDone: boolean;          // هل أتم خطوة الإعداد الأولي؟
}

export interface AppState {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}

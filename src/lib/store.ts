"use client";

import { AppState, Transaction, Budget, Goal, Account, Category } from "@/types";
import { defaultAccounts, defaultCategories, defaultTransactions, defaultBudgets, defaultGoals } from "@/data/mockData";

const STORAGE_KEY = "wallet_data";

function getInitialState(): AppState {
  return {
    user: null,
    accounts: defaultAccounts,
    categories: defaultCategories,
    transactions: defaultTransactions,
    budgets: defaultBudgets,
    goals: defaultGoals,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const parsed = JSON.parse(raw);
    return { ...getInitialState(), ...parsed };
  } catch {
    return getInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wallet_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    // ضمان وجود الحقول الجديدة للمستخدمين القدامى
    return {
      monthlyIncome: 0,
      monthlyObligations: 0,
      savingsGoalPct: 20,
      setupDone: false,
      currency: "OMR",
      theme: "light",
      ...u,
    };
  } catch { return null; }
}

export function saveUser(user: { phone: string; name: string; [key: string]: any } | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem("wallet_user", JSON.stringify(user));
  else localStorage.removeItem("wallet_user");
}

// ---- CRUD helpers ----
export function addTransaction(state: AppState, tx: Transaction): AppState {
  const newState = { ...state, transactions: [tx, ...state.transactions] };
  // update account balance
  newState.accounts = state.accounts.map(acc => {
    if (acc.id !== tx.accountId) return acc;
    const delta = tx.type === "income" ? tx.amount : -tx.amount;
    return { ...acc, balance: acc.balance + delta };
  });
  saveState(newState);
  return newState;
}

export function updateTransaction(state: AppState, tx: Transaction): AppState {
  const old = state.transactions.find(t => t.id === tx.id);
  let accounts = [...state.accounts];
  if (old) {
    // Reverse old effect
    accounts = accounts.map(acc => {
      if (acc.id !== old.accountId) return acc;
      const delta = old.type === "income" ? -old.amount : old.amount;
      return { ...acc, balance: acc.balance + delta };
    });
  }
  // Apply new effect
  accounts = accounts.map(acc => {
    if (acc.id !== tx.accountId) return acc;
    const delta = tx.type === "income" ? tx.amount : -tx.amount;
    return { ...acc, balance: acc.balance + delta };
  });
  const newState = {
    ...state,
    transactions: state.transactions.map(t => t.id === tx.id ? tx : t),
    accounts,
  };
  saveState(newState);
  return newState;
}

export function deleteTransaction(state: AppState, id: string): AppState {
  const tx = state.transactions.find(t => t.id === id);
  let accounts = [...state.accounts];
  if (tx) {
    accounts = accounts.map(acc => {
      if (acc.id !== tx.accountId) return acc;
      const delta = tx.type === "income" ? -tx.amount : tx.amount;
      return { ...acc, balance: acc.balance + delta };
    });
  }
  const newState = {
    ...state,
    transactions: state.transactions.filter(t => t.id !== id),
    accounts,
  };
  saveState(newState);
  return newState;
}

export function upsertBudget(state: AppState, budget: Budget): AppState {
  const exists = state.budgets.find(b => b.id === budget.id);
  const newState = {
    ...state,
    budgets: exists
      ? state.budgets.map(b => b.id === budget.id ? budget : b)
      : [...state.budgets, budget],
  };
  saveState(newState);
  return newState;
}

export function deleteBudget(state: AppState, id: string): AppState {
  const newState = { ...state, budgets: state.budgets.filter(b => b.id !== id) };
  saveState(newState);
  return newState;
}

export function upsertGoal(state: AppState, goal: Goal): AppState {
  const exists = state.goals.find(g => g.id === goal.id);
  const newState = {
    ...state,
    goals: exists
      ? state.goals.map(g => g.id === goal.id ? goal : g)
      : [...state.goals, goal],
  };
  saveState(newState);
  return newState;
}

export function deleteGoal(state: AppState, id: string): AppState {
  const newState = { ...state, goals: state.goals.filter(g => g.id !== id) };
  saveState(newState);
  return newState;
}

export function upsertAccount(state: AppState, account: Account): AppState {
  const exists = state.accounts.find(a => a.id === account.id);
  const newState = {
    ...state,
    accounts: exists
      ? state.accounts.map(a => a.id === account.id ? account : a)
      : [...state.accounts, account],
  };
  saveState(newState);
  return newState;
}

export function deleteAccount(state: AppState, id: string): AppState {
  const newState = { ...state, accounts: state.accounts.filter(a => a.id !== id) };
  saveState(newState);
  return newState;
}

// ---- Computed ----
export function getMonthlyStats(state: AppState, year: number, month: number) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const txs = state.transactions.filter(t => t.date.startsWith(key));
  const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, net: income - expense };
}

export function getTotalBalance(state: AppState): number {
  return state.accounts.reduce((s, a) => s + a.balance, 0);
}

export function getBudgetSpent(state: AppState, budgetId: string): number {
  const budget = state.budgets.find(b => b.id === budgetId);
  if (!budget) return 0;
  return state.transactions
    .filter(t => t.type === "expense" && t.categoryId === budget.categoryId && t.date.startsWith(budget.month))
    .reduce((s, t) => s + t.amount, 0);
}

export function getLast6MonthsData(state: AppState) {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const txs = state.transactions.filter(t => t.date.startsWith(key));
    const income = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    result.push({
      month: d.toLocaleString("ar", { month: "short" }),
      income,
      expense,
    });
  }
  return result;
}

export function getCategoryExpenses(state: AppState, month: string) {
  const txs = state.transactions.filter(t => t.type === "expense" && t.date.startsWith(month));
  const map = new Map<string, number>();
  txs.forEach(t => {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  });
  return Array.from(map.entries()).map(([catId, amount]) => {
    const cat = state.categories.find(c => c.id === catId);
    return { name: cat?.name ?? catId, amount, color: cat?.color ?? "#ccc", icon: cat?.icon ?? "📦" };
  }).sort((a, b) => b.amount - a.amount);
}

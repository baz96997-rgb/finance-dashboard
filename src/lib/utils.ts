import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "OMR"): string {
  return new Intl.NumberFormat("ar-OM", {
    style: "currency",
    currency,
    minimumFractionDigits: 3,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-OM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("ar-OM", {
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


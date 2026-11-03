"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAppState } from "@/hooks/useAppState";
import { getMonthlyStats, getTotalBalance, getLast6MonthsData, getCategoryExpenses, getBudgetSpent } from "@/lib/store";
import { formatCurrency, formatDateShort, getCurrentMonth, getBudgetStatus } from "@/lib/utils";
import { loadUser, saveUser } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { state } = useAppState();
  const router = useRouter();
  const user = loadUser();
  const now = new Date();
  const month = getCurrentMonth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { income, expense, net } = getMonthlyStats(state, now.getFullYear(), now.getMonth() + 1);
  const totalBalance = getTotalBalance(state);
  const chartData = getLast6MonthsData(state);
  const pieData = getCategoryExpenses(state, month);

  const monthlyIncome = user?.monthlyIncome ?? 0;
  const monthlyObligations = user?.monthlyObligations ?? 0;
  const savingsGoalPct = user?.savingsGoalPct ?? 20;
  const disposable = monthlyIncome - monthlyObligations;
  const savingsTarget = (disposable * savingsGoalPct) / 100;
  const spendingBudget = disposable - savingsTarget;
  const budgetUsed = expense / (spendingBudget > 0 ? spendingBudget : 1);

  // Budget alerts
  const budgetAlerts = useMemo(() => {
    return state.budgets
      .map(b => {
        const spent = getBudgetSpent(state, b.id);
        const status = getBudgetStatus(spent, b.limit);
        const cat = state.categories.find(c => c.id === b.categoryId);
        return { ...b, spent, status, catName: cat?.name ?? b.categoryId, catIcon: cat?.icon ?? "📦" };
      })
      .filter(b => b.status !== "safe");
  }, [state]);

  const recentTxs = state.transactions.slice(0, 6);
  const isNewUser = state.transactions.length === 0 && state.accounts.length === 0;
  const setupMissing = !user?.setupDone && monthlyIncome === 0;

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ fontSize: isMobile ? "1.3rem" : "1.5rem", fontWeight: 800, margin: 0 }}>
          مرحباً، {user?.name ?? ""}! 👋
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>
          {now.toLocaleDateString("ar-OM", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* بطاقة الإعداد للمستخدم الجديد */}
      {isNewUser && (
        <div style={{
          marginBottom: "1.25rem",
          padding: "16px 20px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, #1a6fd422, #10b98122)",
          border: "1.5px solid var(--primary)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>🚀</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>ابدأ رحلتك المالية</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>
                أضف حساباتك ومصاريفك لتتبع ميزانيتك بدقة
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <a href="/dashboard/accounts" className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
                  ➕ إضافة حساب
                </a>
                <a href="/dashboard/transactions" className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>
                  📝 إضافة مصروف
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بطاقة إعداد الميزانية */}
      {setupMissing && !isNewUser && (
        <div style={{
          marginBottom: "1.25rem",
          padding: "14px 18px",
          borderRadius: "12px",
          background: "#fef9c3",
          border: "1px solid #fde68a",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <span style={{ fontSize: "1.4rem" }}>💡</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#92400e" }}>أدخل دخلك الشهري للحصول على تحليل دقيق</div>
          </div>
          <a href="/dashboard/settings" className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "5px 10px", whiteSpace: "nowrap" }}>إعداد ←</a>
        </div>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "8px" }}>
          {budgetAlerts.map(b => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 14px", borderRadius: "10px",
              background: b.status === "exceeded" ? "#fee2e2" : "#fef9c3",
              border: `1px solid ${b.status === "exceeded" ? "#fca5a5" : "#fde68a"}`,
              color: b.status === "exceeded" ? "#b91c1c" : "#92400e",
            }}>
              <span>{b.status === "exceeded" ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {b.status === "exceeded" ? "تجاوزت" : "اقتربت من"} ميزانية {b.catIcon} {b.catName}
                — {formatCurrency(b.spent)} من {formatCurrency(b.limit)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <StatCard icon="💰" label="الرصيد الإجمالي" value={formatCurrency(totalBalance)} color="var(--primary)" big />
        <StatCard icon="📥" label="الدخل هذا الشهر" value={formatCurrency(income)} color="var(--green)" />
        <StatCard icon="📤" label="المصاريف" value={formatCurrency(expense)} color="#ef4444" />
        <StatCard icon="💾" label="صافي الادخار" value={formatCurrency(net)} color={net >= 0 ? "var(--teal)" : "#f97316"} />
      </div>

      {/* شريط الميزانية الشهرية */}
      {spendingBudget > 0 && (
        <div className="card" style={{ marginBottom: "1.25rem", padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>🎯 ميزانية الإنفاق الشهرية</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {formatCurrency(expense)} من {formatCurrency(spendingBudget)}
            </span>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, budgetUsed * 100).toFixed(1)}%`,
              background: budgetUsed >= 1 ? "#ef4444" : budgetUsed >= 0.8 ? "#f97316" : "var(--primary)",
              borderRadius: "6px",
              transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>{(budgetUsed * 100).toFixed(0)}٪ مستخدم</span>
            <span>متبقي: {formatCurrency(Math.max(0, spendingBudget - expense))}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 340px",
        gap: "1rem",
        marginBottom: "1.25rem",
      }}>
        {/* Bar Chart — أوضح من Line على الموبايل */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "0.95rem", fontWeight: 700 }}>
            📊 الدخل والمصاريف — آخر 6 أشهر
          </h3>
          {chartData.every(d => d.income === 0 && d.expense === 0) ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                لا توجد بيانات بعد
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
              <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontFamily: "Cairo", fontSize: isMobile ? 10 : 12, fill: "var(--text-muted)" }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontFamily: "Cairo", fontSize: 10, fill: "var(--text-muted)" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}ك` : `${v}`}
                  width={35}
                />
                <Tooltip
                  contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.82rem" }}
                  formatter={(v: number) => [formatCurrency(v), ""]}
                  cursor={{ fill: "var(--surface-2)" }}
                />
                <Bar dataKey="income" name="دخل" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="مصاريف" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {/* Legend يدوي */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10b981" }} />
              دخل
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#ef4444" }} />
              مصاريف
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: 700 }}>🍩 توزيع المصاريف</h3>
          {pieData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", color: "var(--text-muted)", fontSize: "0.875rem", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>
                لا توجد مصاريف هذا الشهر
              </div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={isMobile ? 160 : 185}>
                <PieChart>
                  <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 55 : 65} innerRadius={isMobile ? 28 : 32} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }}
                    formatter={(v: number) => [formatCurrency(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend مبسّط */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flex: "none" }} />
                      <span>{d.icon} {d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>{formatCurrency(d.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>⏰ أحدث المعاملات</h3>
          <a href="/dashboard/transactions" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>عرض الكل ←</a>
        </div>
        {recentTxs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📭</div>
            <div style={{ fontSize: "0.875rem" }}>لا توجد معاملات بعد</div>
            <a href="/dashboard/transactions" className="btn btn-primary" style={{ marginTop: "12px", display: "inline-block", fontSize: "0.85rem" }}>
              + أضف أول مصروف
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {recentTxs.map(tx => {
              const cat = state.categories.find(c => c.id === tx.categoryId);
              const acc = state.accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 6px", borderRadius: "8px", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${cat?.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flex: "none" }}>
                    {cat?.icon ?? "📦"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{cat?.name} · {acc?.name} · {formatDateShort(tx.date)}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: tx.type === "income" ? "var(--green)" : "#ef4444", whiteSpace: "nowrap" }}>
                    {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, big }: { icon: string; label: string; value: string; color: string; big?: boolean }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden", padding: "14px" }}>
      <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: big ? "1.2rem" : "1.05rem", fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ position: "absolute", bottom: "-12px", left: "-8px", fontSize: "3.5rem", opacity: 0.05 }}>{icon}</div>
    </div>
  );
}

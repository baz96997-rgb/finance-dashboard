"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useAppState } from "@/hooks/useAppState";
import { getMonthlyStats, getTotalBalance, getLast6MonthsData, getCategoryExpenses, getBudgetSpent } from "@/lib/store";
import { formatCurrency, formatDateShort, getCurrentMonth, getBudgetStatus } from "@/lib/utils";
import { loadUser } from "@/lib/store";

export default function DashboardPage() {
  const { state } = useAppState();
  const user = loadUser();
  const now = new Date();
  const month = getCurrentMonth();

  const { income, expense, net } = getMonthlyStats(state, now.getFullYear(), now.getMonth() + 1);
  const totalBalance = getTotalBalance(state);
  const chartData = getLast6MonthsData(state);
  const pieData = getCategoryExpenses(state, month);

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

  const recentTxs = state.transactions.slice(0, 8);

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>
          مرحباً، {user?.name ?? ""}! 👋
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.9rem" }}>
          {now.toLocaleDateString("ar-OM", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <StatCard icon="💰" label="الرصيد الإجمالي" value={formatCurrency(totalBalance)} color="var(--primary)" big />
        <StatCard icon="📥" label="الدخل هذا الشهر" value={formatCurrency(income)} color="var(--green)" />
        <StatCard icon="📤" label="المصاريف هذا الشهر" value={formatCurrency(expense)} color="#ef4444" />
        <StatCard icon="🏦" label="صافي الادخار" value={formatCurrency(net)} color={net >= 0 ? "var(--teal)" : "#f97316"} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Line Chart */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>الدخل والمصاريف — آخر 6 أشهر</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontFamily: "Cairo", fontSize: 12, fill: "var(--text-muted)" }} />
              <YAxis tick={{ fontFamily: "Cairo", fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
              <Line type="monotone" dataKey="income" name="دخل" stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981", r: 4 }} />
              <Line type="monotone" dataKey="expense" name="مصاريف" stroke="#ef4444" strokeWidth={2.5} dot={{ fill: "#ef4444", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>توزيع المصاريف</h3>
          {pieData.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "180px", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              لا توجد مصاريف هذا الشهر
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
                <Legend formatter={(v) => <span style={{ fontFamily: "Cairo", fontSize: "0.8rem" }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>أحدث المعاملات</h3>
          <a href="/dashboard/transactions" style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>عرض الكل ←</a>
        </div>
        {recentTxs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>لا توجد معاملات بعد</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {recentTxs.map(tx => {
              const cat = state.categories.find(c => c.id === tx.categoryId);
              const acc = state.accounts.find(a => a.id === tx.accountId);
              return (
                <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 8px", borderRadius: "8px", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${cat?.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flex: "none" }}>
                    {cat?.icon ?? "📦"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{tx.description}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cat?.name} · {acc?.name} · {formatDateShort(tx.date)}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem", color: tx.type === "income" ? "var(--green)" : "#ef4444", whiteSpace: "nowrap" }}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
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
    <div className="card" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: big ? "1.4rem" : "1.2rem", fontWeight: 800, color }}>{value}</div>
      <div style={{ position: "absolute", bottom: "-12px", left: "-8px", fontSize: "4rem", opacity: 0.05 }}>{icon}</div>
    </div>
  );
}

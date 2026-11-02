"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useAppState } from "@/hooks/useAppState";
import { getMonthlyStats, getCategoryExpenses } from "@/lib/store";
import { formatCurrency, getCurrentMonth } from "@/lib/utils";

export default function ReportsPage() {
  const { state } = useAppState();
  const [month, setMonth] = useState(getCurrentMonth());

  const now = new Date();
  const [y, m] = month.split("-").map(Number);
  const { income, expense, net } = getMonthlyStats(state, y, m);
  const categoryData = getCategoryExpenses(state, month);

  // Last 12 months
  const monthlyHistory = useMemo(() => {
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const stats = getMonthlyStats(state, d.getFullYear(), d.getMonth() + 1);
      result.push({ month: d.toLocaleString("ar", { month: "short" }), ...stats });
    }
    return result;
  }, [state]);

  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>التقارير</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>تحليل مالي مفصّل</p>
        </div>
        <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ maxWidth: "160px" }} />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "الدخل", value: formatCurrency(income), color: "#10b981", icon: "📥" },
          { label: "المصاريف", value: formatCurrency(expense), color: "#ef4444", icon: "📤" },
          { label: "الادخار", value: formatCurrency(Math.max(0, net)), color: "#1a6fd4", icon: "🏦" },
          { label: "نسبة الادخار", value: `${savingsRate}%`, color: savingsRate > 20 ? "#10b981" : savingsRate > 0 ? "#f59e0b" : "#ef4444", icon: "📊" },
        ].map(k => (
          <div key={k.label} className="card">
            <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>{k.icon}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{k.label}</div>
            <div style={{ fontSize: "1.2rem", fontWeight: 800, color: k.color, marginTop: "4px" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Monthly trend */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>الاتجاه الشهري — آخر 12 شهراً</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontFamily: "Cairo", fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontFamily: "Cairo", fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), ""]} />
            <Bar dataKey="income" name="دخل" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="expense" name="مصاريف" fill="#ef4444" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Net savings line */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>صافي الادخار الشهري</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyHistory}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontFamily: "Cairo", fontSize: 11, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontFamily: "Cairo", fontSize: 11, fill: "var(--text-muted)" }} />
            <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(v: number) => [formatCurrency(v), "الادخار"]} />
            <Line type="monotone" dataKey="net" name="الادخار" stroke="#1a6fd4" strokeWidth={2.5} dot={{ fill: "#1a6fd4", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1rem", fontWeight: 700 }}>توزيع المصاريف حسب الفئة</h3>
        {categoryData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>لا توجد مصاريف هذا الشهر</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {categoryData.map(c => {
              const pct = expense > 0 ? Math.round((c.amount / expense) * 100) : 0;
              return (
                <div key={c.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{c.icon} {c.name}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: 700 }}>{formatCurrency(c.amount)} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: c.color }} />
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

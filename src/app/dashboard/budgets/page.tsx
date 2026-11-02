"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Budget } from "@/types";
import { formatCurrency, generateId, getCurrentMonth, getBudgetStatus } from "@/lib/utils";
import { getBudgetSpent } from "@/lib/store";

export default function BudgetsPage() {
  const { state, upsertBudget, deleteBudget } = useAppState();
  const [month, setMonth] = useState(getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState<Partial<Budget>>({});

  const budgets = state.budgets.filter(b => b.month === month);
  const expenseCategories = state.categories.filter(c => c.type === "expense");

  function openAdd() {
    setEditing(null);
    setForm({ categoryId: expenseCategories[0]?.id, month, limit: 0 });
    setShowModal(true);
  }

  function openEdit(b: Budget) {
    setEditing(b);
    setForm({ ...b });
    setShowModal(true);
  }

  function save() {
    if (!form.categoryId || !form.limit || !form.month) return;
    upsertBudget({
      id: editing?.id ?? generateId(),
      categoryId: form.categoryId!,
      limit: Number(form.limit),
      month: form.month!,
      spent: 0,
    });
    setShowModal(false);
  }

  const statusColors = { safe: "#10b981", warning: "#f59e0b", exceeded: "#ef4444" };
  const statusLabels = { safe: "آمن", warning: "قريب من الحد", exceeded: "متجاوز" };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>الميزانيات</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>تحكم في مصاريفك الشهرية</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ maxWidth: "160px" }} />
          <button className="btn btn-primary" onClick={openAdd}>+ إضافة ميزانية</button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📊</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>لا توجد ميزانيات لهذا الشهر</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>أنشئ ميزانية للتحكم في مصاريفك</p>
          <button className="btn btn-primary" onClick={openAdd}>إنشاء ميزانية</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {budgets.map(b => {
            const spent = getBudgetSpent(state, b.id);
            const status = getBudgetStatus(spent, b.limit);
            const pct = Math.min(100, Math.round((spent / b.limit) * 100));
            const cat = state.categories.find(c => c.id === b.categoryId);
            return (
              <div key={b.id} className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${cat?.color ?? "#ccc"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                      {cat?.icon ?? "📦"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{cat?.name ?? b.categoryId}</div>
                      <div style={{ fontSize: "0.75rem", color: statusColors[status], fontWeight: 600 }}>● {statusLabels[status]}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => openEdit(b)}>✏️</button>
                    <button className="btn btn-danger" style={{ padding: "4px 8px" }} onClick={() => { if (confirm("حذف الميزانية؟")) deleteBudget(b.id); }}>🗑️</button>
                  </div>
                </div>

                <div style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                    <span>الإنفاق: {formatCurrency(spent)}</span>
                    <span>الحد: {formatCurrency(b.limit)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: statusColors[status] }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>المتبقي: {formatCurrency(Math.max(0, b.limit - spent))}</span>
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: statusColors[status] }}>{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{editing ? "تعديل الميزانية" : "إضافة ميزانية"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>الفئة</label>
                <select className="input" value={form.categoryId ?? ""} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>الحد الشهري</label>
                <input className="input" type="number" placeholder="0.000" value={form.limit ?? ""} onChange={e => setForm(f => ({ ...f, limit: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>الشهر</label>
                <input className="input" type="month" value={form.month ?? ""} onChange={e => setForm(f => ({ ...f, month: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save}>حفظ</button>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Goal } from "@/types";
import { formatCurrency, generateId, getGoalProgress, getDaysLeft } from "@/lib/utils";

const GOAL_ICONS = ["✈️","🚗","🏠","💻","📱","🎓","💍","👶","🛡️","🌴","⚽","🎮","📷","🚢","🏋️"];
const GOAL_COLORS = ["#1a6fd4","#10b981","#f59e0b","#8b5cf6","#ef4444","#14b8a6","#ec4899","#f97316","#06b6d4","#84cc16"];

export default function GoalsPage() {
  const { state, upsertGoal, deleteGoal } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<Partial<Goal>>({});
  const [addAmountId, setAddAmountId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");

  function openAdd() {
    setEditing(null);
    setForm({ icon: "🎯", color: "#1a6fd4", targetDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split("T")[0] });
    setShowModal(true);
  }
  function openEdit(g: Goal) { setEditing(g); setForm({ ...g }); setShowModal(true); }

  function save() {
    if (!form.name || !form.targetAmount || !form.targetDate) return;
    upsertGoal({
      id: editing?.id ?? generateId(),
      name: form.name!,
      targetAmount: Number(form.targetAmount),
      currentAmount: Number(form.currentAmount ?? 0),
      targetDate: form.targetDate!,
      icon: form.icon ?? "🎯",
      color: form.color ?? "#1a6fd4",
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
    setShowModal(false);
  }

  function contributeAmount(goal: Goal) {
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return;
    upsertGoal({ ...goal, currentAmount: goal.currentAmount + amount });
    setAddAmountId(null);
    setAddAmount("");
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>الأهداف المالية</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>ادخر لتحقيق أحلامك</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ هدف جديد</button>
      </div>

      {state.goals.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🎯</div>
          <h3 style={{ margin: "0 0 0.5rem" }}>لا توجد أهداف بعد</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>حدد هدفاً مالياً وابدأ الادخار</p>
          <button className="btn btn-primary" onClick={openAdd}>إضافة هدف</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {state.goals.map(g => {
            const pct = getGoalProgress(g.currentAmount, g.targetAmount);
            const days = getDaysLeft(g.targetDate);
            const done = g.currentAmount >= g.targetAmount;
            return (
              <div key={g.id} className="card" style={{ position: "relative", overflow: "hidden" }}>
                {done && (
                  <div style={{ position: "absolute", top: "12px", left: "12px", background: "#10b981", color: "white", borderRadius: "999px", padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>
                    ✅ مكتمل!
                  </div>
                )}

                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: `${g.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>
                      {g.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1rem" }}>{g.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {done ? "تهانينا! 🎉" : days > 0 ? `${days} يوم متبقي` : "انتهت المدة"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => openEdit(g)}>✏️</button>
                    <button className="btn btn-danger" style={{ padding: "4px 8px" }} onClick={() => { if (confirm("حذف الهدف؟")) deleteGoal(g.id); }}>🗑️</button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "6px" }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(g.currentAmount)}</span>
                    <span style={{ color: "var(--text-muted)" }}>{formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="progress-bar" style={{ height: "10px" }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: done ? "#10b981" : g.color }} />
                  </div>
                  <div style={{ textAlign: "left", marginTop: "4px", fontSize: "0.8rem", fontWeight: 700, color: g.color }}>{pct}%</div>
                </div>

                {/* Add amount */}
                {!done && (
                  addAmountId === g.id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input className="input" type="number" placeholder="المبلغ" value={addAmount} onChange={e => setAddAmount(e.target.value)} style={{ flex: 1 }} />
                      <button className="btn btn-primary" style={{ padding: "6px 12px" }} onClick={() => contributeAmount(g)}>إضافة</button>
                      <button className="btn btn-ghost" style={{ padding: "6px 8px" }} onClick={() => setAddAmountId(null)}>✕</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" style={{ width: "100%", fontSize: "0.85rem", border: "1px dashed var(--border)" }} onClick={() => { setAddAmountId(g.id); setAddAmount(""); }}>
                      + إضافة مبلغ للهدف
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{editing ? "تعديل الهدف" : "هدف جديد"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>اسم الهدف</label>
                <input className="input" placeholder="مثال: رحلة إلى تركيا" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>المبلغ المستهدف</label>
                  <input className="input" type="number" placeholder="0.000" value={form.targetAmount ?? ""} onChange={e => setForm(f => ({ ...f, targetAmount: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>المبلغ الحالي</label>
                  <input className="input" type="number" placeholder="0.000" value={form.currentAmount ?? ""} onChange={e => setForm(f => ({ ...f, currentAmount: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>التاريخ المستهدف</label>
                <input className="input" type="date" value={form.targetDate ?? ""} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>الأيقونة</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {GOAL_ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{ width: "38px", height: "38px", borderRadius: "8px", background: form.icon === ic ? "var(--primary-light)" : "var(--surface-2)", border: form.icon === ic ? "2px solid var(--primary)" : "2px solid transparent", fontSize: "1.2rem", cursor: "pointer" }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>اللون</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {GOAL_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: form.color === c ? "3px solid var(--text)" : "3px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
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

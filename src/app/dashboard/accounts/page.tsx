"use client";

import { useState } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Account } from "@/types";
import { formatCurrency, generateId } from "@/lib/utils";
import { getTotalBalance as getBalance } from "@/lib/store";

const ACCOUNT_COLORS = ["#1a6fd4","#10b981","#8b5cf6","#ef4444","#f59e0b","#14b8a6","#ec4899","#f97316"];
const ACCOUNT_ICONS = ["💵","🏦","💳","💰","🪙","💎","🏧","📊"];

export default function AccountsPage() {
  const { state, upsertAccount, deleteAccount } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState<Partial<Account>>({});
  const [tab, setTab] = useState<"accounts" | "categories">("accounts");

  const totalBalance = getBalance(state);

  function openAdd() {
    setEditing(null);
    setForm({ type: "bank", color: "#1a6fd4", icon: "🏦", balance: 0 });
    setShowModal(true);
  }
  function openEdit(a: Account) { setEditing(a); setForm({ ...a }); setShowModal(true); }

  function save() {
    if (!form.name) return;
    upsertAccount({
      id: editing?.id ?? generateId(),
      name: form.name!,
      type: form.type as Account["type"] ?? "bank",
      balance: Number(form.balance ?? 0),
      color: form.color ?? "#1a6fd4",
      icon: form.icon ?? "🏦",
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    });
    setShowModal(false);
  }

  const typeLabels: Record<Account["type"], string> = { cash: "نقدي", bank: "بنكي", credit: "بطاقة ائتمان" };
  const typeIcons: Record<Account["type"], string> = { cash: "💵", bank: "🏦", credit: "💳" };

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>الحسابات</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>الرصيد الإجمالي: <strong style={{ color: "var(--primary)" }}>{formatCurrency(totalBalance)}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة حساب</button>
      </div>

      {/* Account Type Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {(["cash","bank","credit"] as Account["type"][]).map(t => {
          const total = state.accounts.filter(a => a.type === t).reduce((s, a) => s + a.balance, 0);
          return (
            <div key={t} className="card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{typeIcons[t]}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{typeLabels[t]}</div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: total < 0 ? "#ef4444" : "var(--text)", marginTop: "4px" }}>{formatCurrency(total)}</div>
            </div>
          );
        })}
      </div>

      {/* Accounts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {state.accounts.map(a => (
          <div key={a.id} className="card" style={{ position: "relative", overflow: "hidden", borderTop: `3px solid ${a.color}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: `${a.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem" }}>
                  {a.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{a.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{typeLabels[a.type]}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => openEdit(a)}>✏️</button>
                <button className="btn btn-danger" style={{ padding: "4px 8px" }} onClick={() => { if (confirm("حذف الحساب؟")) deleteAccount(a.id); }}>🗑️</button>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: "1.3rem", color: a.balance < 0 ? "#ef4444" : a.color }}>
              {formatCurrency(a.balance)}
            </div>
            <div style={{ position: "absolute", bottom: "-10px", left: "-5px", fontSize: "3.5rem", opacity: 0.05 }}>{a.icon}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{editing ? "تعديل الحساب" : "إضافة حساب"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>اسم الحساب</label>
                <input className="input" placeholder="مثال: بنك مسقط" value={form.name ?? ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>نوع الحساب</label>
                <select className="input" value={form.type ?? "bank"} onChange={e => setForm(f => ({ ...f, type: e.target.value as Account["type"] }))}>
                  <option value="cash">💵 نقدي</option>
                  <option value="bank">🏦 بنكي</option>
                  <option value="credit">💳 بطاقة ائتمان</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>الرصيد الحالي</label>
                <input className="input" type="number" placeholder="0.000" value={form.balance ?? ""} onChange={e => setForm(f => ({ ...f, balance: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>الأيقونة</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ACCOUNT_ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))} style={{ width: "38px", height: "38px", borderRadius: "8px", background: form.icon === ic ? "var(--primary-light)" : "var(--surface-2)", border: form.icon === ic ? "2px solid var(--primary)" : "2px solid transparent", fontSize: "1.2rem", cursor: "pointer" }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>اللون</label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {ACCOUNT_COLORS.map(c => (
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

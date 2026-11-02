"use client";

import { useState, useMemo } from "react";
import { useAppState } from "@/hooks/useAppState";
import { Transaction } from "@/types";
import { formatCurrency, formatDate, generateId, getCurrentMonth } from "@/lib/utils";

type FilterType = "all" | "income" | "expense";

export default function TransactionsPage() {
  const { state, addTransaction, updateTransaction, deleteTransaction } = useAppState();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Transaction>>({ type: "expense", date: new Date().toISOString().split("T")[0] });

  const filtered = useMemo(() => {
    return state.transactions.filter(tx => {
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (filterCategory !== "all" && tx.categoryId !== filterCategory) return false;
      if (filterMonth && !tx.date.startsWith(filterMonth)) return false;
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [state.transactions, filterType, filterCategory, filterMonth, search]);

  const expenseCategories = state.categories.filter(c => c.type === "expense");
  const incomeCategories = state.categories.filter(c => c.type === "income");

  function openAdd() {
    setEditing(null);
    setForm({ type: "expense", date: new Date().toISOString().split("T")[0], categoryId: expenseCategories[0]?.id, accountId: state.accounts[0]?.id });
    setShowModal(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({ ...tx });
    setShowModal(true);
  }

  function saveForm() {
    if (!form.amount || !form.categoryId || !form.accountId || !form.date || !form.description) return;
    const tx: Transaction = {
      id: editing?.id ?? generateId(),
      type: form.type as Transaction["type"],
      amount: Number(form.amount),
      categoryId: form.categoryId!,
      accountId: form.accountId!,
      date: form.date!,
      description: form.description!,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) updateTransaction(tx);
    else addTransaction(tx);
    setShowModal(false);
  }

  const availableCategories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>المعاملات</h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.875rem" }}>{filtered.length} معاملة</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ إضافة معاملة</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1rem", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <input className="input" placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: "220px" }} />
        <select className="input" value={filterType} onChange={e => setFilterType(e.target.value as FilterType)} style={{ maxWidth: "140px" }}>
          <option value="all">الكل</option>
          <option value="income">دخل فقط</option>
          <option value="expense">مصاريف فقط</option>
        </select>
        <select className="input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: "180px" }}>
          <option value="all">كل الفئات</option>
          {state.categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <input type="month" className="input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ maxWidth: "160px" }} />
        <button className="btn btn-ghost" onClick={() => { setSearch(""); setFilterType("all"); setFilterCategory("all"); setFilterMonth(getCurrentMonth()); }} style={{ fontSize: "0.8rem" }}>مسح الفلاتر</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📭</div>
            <p>لا توجد معاملات مطابقة</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>الفئة</th>
                  <th>الحساب</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => {
                  const cat = state.categories.find(c => c.id === tx.categoryId);
                  const acc = state.accounts.find(a => a.id === tx.accountId);
                  return (
                    <tr key={tx.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem" }}>{cat?.icon}</span>
                          <span style={{ fontWeight: 500 }}>{tx.description}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${tx.type}`}>{tx.type === "income" ? "دخل" : "مصروف"}</span></td>
                      <td style={{ fontWeight: 700, color: tx.type === "income" ? "var(--green)" : "#ef4444", whiteSpace: "nowrap" }}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{cat?.name}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{acc?.name}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: "0.85rem", whiteSpace: "nowrap" }}>{formatDate(tx.date)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => openEdit(tx)}>✏️</button>
                          <button className="btn btn-danger" style={{ padding: "4px 8px", fontSize: "0.8rem" }} onClick={() => { if (confirm("حذف هذه المعاملة؟")) deleteTransaction(tx.id); }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>{editing ? "تعديل المعاملة" : "إضافة معاملة"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Type */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(["expense", "income"] as const).map(t => (
                  <button key={t} className={`btn ${form.type === t ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }}
                    onClick={() => setForm(f => ({ ...f, type: t, categoryId: (t === "income" ? incomeCategories : expenseCategories)[0]?.id }))}>
                    {t === "income" ? "📥 دخل" : "📤 مصروف"}
                  </button>
                ))}
              </div>
              <FormField label="المبلغ">
                <input className="input" type="number" placeholder="0.000" value={form.amount ?? ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
              </FormField>
              <FormField label="الوصف">
                <input className="input" placeholder="وصف المعاملة" value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </FormField>
              <FormField label="الفئة">
                <select className="input" value={form.categoryId ?? ""} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  {availableCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </FormField>
              <FormField label="الحساب">
                <select className="input" value={form.accountId ?? ""} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                  {state.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                </select>
              </FormField>
              <FormField label="التاريخ">
                <input className="input" type="date" value={form.date ?? ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </FormField>
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveForm}>حفظ</button>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>{label}</label>
      {children}
    </div>
  );
}

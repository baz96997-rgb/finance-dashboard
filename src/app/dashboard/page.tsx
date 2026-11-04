"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useAppState } from "@/hooks/useAppState";
import { getMonthlyStats, getTotalBalance, getLast6MonthsData, getCategoryExpenses, getBudgetSpent } from "@/lib/store";
import { formatCurrency, formatDateShort, getCurrentMonth, getBudgetStatus, generateId } from "@/lib/utils";
import { loadUser } from "@/lib/store";
import { Transaction } from "@/types";

export default function DashboardPage() {
  const { state, addTransaction, updateTransaction, deleteTransaction } = useAppState();
  const user = loadUser();
  const currency = user?.currency ?? "OMR";
  const now = new Date();
  const month = getCurrentMonth();
  const [isMobile, setIsMobile] = useState(false);

  // ─── Quick Add/Edit Modal ────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState<Partial<Transaction>>({});
  const [activeRow, setActiveRow] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const expenseCategories = state.categories.filter(c => c.type === "expense");
  const incomeCategories  = state.categories.filter(c => c.type === "income");

  function openAdd() {
    setEditing(null);
    setForm({
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      categoryId: expenseCategories[0]?.id,
      accountId: state.accounts[0]?.id ?? "",
    });
    setShowModal(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setForm({ ...tx });
    setShowModal(true);
    setActiveRow(null);
  }

  function saveForm() {
    if (!form.amount || !form.categoryId || !form.date || !form.description) return;
    const tx: Transaction = {
      id: editing?.id ?? generateId(),
      type: form.type as Transaction["type"] ?? "expense",
      amount: Number(form.amount),
      categoryId: form.categoryId!,
      accountId: form.accountId ?? "",
      date: form.date!,
      description: form.description!,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) updateTransaction(tx);
    else addTransaction(tx);
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (confirm("حذف هذه المعاملة؟")) deleteTransaction(id);
    setActiveRow(null);
  }

  const { income, expense, net } = getMonthlyStats(state, now.getFullYear(), now.getMonth() + 1);
  const totalBalance = getTotalBalance(state);
  const chartData = getLast6MonthsData(state);
  const pieData = getCategoryExpenses(state, month);

  const monthlyIncome      = user?.monthlyIncome ?? 0;
  const monthlyObligations = user?.monthlyObligations ?? 0;
  const savingsGoalPct     = user?.savingsGoalPct ?? 20;
  const disposable         = monthlyIncome - monthlyObligations;
  const savingsTarget      = (disposable * savingsGoalPct) / 100;
  const spendingBudget     = disposable - savingsTarget;
  const budgetUsed         = spendingBudget > 0 ? expense / spendingBudget : 0;

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
  const isNewUser = state.transactions.length === 0 && state.accounts.length === 0;
  const setupMissing = !user?.setupDone && monthlyIncome === 0;
  const availableCategories = form.type === "income" ? incomeCategories : expenseCategories;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "80px" }}>
      {/* Welcome */}
      <div style={{ marginBottom: "1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "1.25rem" : "1.45rem", fontWeight: 800, margin: 0 }}>
            مرحباً، {user?.name ?? ""}! 👋
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "0.85rem" }}>
            {now.toLocaleDateString("ar-SA-u-ca-gregory", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        {/* زر الإضافة السريعة للديسكتوب */}
        {!isMobile && (
          <button className="btn btn-primary" onClick={openAdd} style={{ gap: "6px", display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: "1.1rem" }}>+</span> مصروف جديد
          </button>
        )}
      </div>

      {/* بطاقة المستخدم الجديد */}
      {isNewUser && (
        <div style={{
          marginBottom: "1.25rem", padding: "16px 20px", borderRadius: "14px",
          background: "linear-gradient(135deg, #1a6fd422, #10b98122)",
          border: "1.5px solid var(--primary)",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>🚀</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", marginBottom: "4px" }}>ابدأ رحلتك المالية</div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "10px" }}>أضف حساباتك ثم سجل مصاريفك</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <a href="/dashboard/accounts" className="btn btn-primary" style={{ fontSize: "0.8rem", padding: "6px 12px" }}>➕ إضافة حساب</a>
                <button className="btn btn-ghost" onClick={openAdd} style={{ fontSize: "0.8rem", padding: "6px 12px" }}>📝 إضافة مصروف</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* تنبيه إعداد الميزانية */}
      {setupMissing && !isNewUser && (
        <div style={{
          marginBottom: "1.25rem", padding: "12px 16px", borderRadius: "12px",
          background: "#fef9c3", border: "1px solid #fde68a",
          display: "flex", alignItems: "center", gap: "10px",
        }}>
          <span style={{ fontSize: "1.3rem" }}>💡</span>
          <div style={{ flex: 1, fontSize: "0.85rem", color: "#92400e", fontWeight: 600 }}>
            أدخل دخلك الشهري للحصول على تحليل دقيق
          </div>
          <a href="/dashboard/settings" className="btn btn-ghost" style={{ fontSize: "0.78rem", padding: "5px 10px", whiteSpace: "nowrap" }}>إعداد ←</a>
        </div>
      )}

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div style={{ marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "8px" }}>
          {budgetAlerts.map(b => (
            <div key={b.id} style={{
              display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px",
              background: b.status === "exceeded" ? "#fee2e2" : "#fef9c3",
              border: `1px solid ${b.status === "exceeded" ? "#fca5a5" : "#fde68a"}`,
              color: b.status === "exceeded" ? "#b91c1c" : "#92400e",
            }}>
              <span>{b.status === "exceeded" ? "🚨" : "⚠️"}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {b.status === "exceeded" ? "تجاوزت" : "اقتربت من"} ميزانية {b.catIcon} {b.catName}
                — {formatCurrency(b.spent, currency)} من {formatCurrency(b.limit, currency)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <StatCard icon="💰" label="الرصيد الإجمالي" value={formatCurrency(totalBalance, currency)} color="var(--primary)" big />
        <StatCard icon="📥" label="الدخل هذا الشهر" value={formatCurrency(income, currency)} color="var(--green)" />
        <StatCard icon="📤" label="المصاريف" value={formatCurrency(expense, currency)} color="#ef4444" />
        <StatCard icon="💾" label="صافي الادخار" value={formatCurrency(net, currency)} color={net >= 0 ? "var(--teal)" : "#f97316"} />
      </div>

      {/* شريط الميزانية */}
      {spendingBudget > 0 && (
        <div className="card" style={{ marginBottom: "1.25rem", padding: "14px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>🎯 ميزانية الإنفاق</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {formatCurrency(expense, currency)} من {formatCurrency(spendingBudget, currency)}
            </span>
          </div>
          <div style={{ background: "var(--surface-2)", borderRadius: "6px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, budgetUsed * 100).toFixed(1)}%`,
              background: budgetUsed >= 1 ? "#ef4444" : budgetUsed >= 0.8 ? "#f97316" : "var(--primary)",
              borderRadius: "6px", transition: "width 0.4s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            <span>{(budgetUsed * 100).toFixed(0)}٪ مستخدم</span>
            <span>متبقي: {formatCurrency(Math.max(0, spendingBudget - expense), currency)}</span>
          </div>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 320px", gap: "1rem", marginBottom: "1.25rem" }}>
        {/* Bar Chart */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "0.9rem", fontSize: "0.9rem", fontWeight: 700 }}>
            📊 الدخل والمصاريف — آخر 6 أشهر
          </h3>
          {chartData.every(d => d.income === 0 && d.expense === 0) ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={isMobile ? 170 : 210}>
              <BarChart data={chartData} barGap={3} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontFamily: "Cairo", fontSize: isMobile ? 10 : 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "Cairo", fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}ك` : `${v}`} width={32} />
                <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }}
                  formatter={(v: number) => [formatCurrency(v, currency), ""]} cursor={{ fill: "var(--surface-2)" }} />
                <Bar dataKey="income" name="دخل" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="expense" name="مصاريف" fill="#ef4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", marginTop: "8px" }}>
            <LegendDot color="#10b981" label="دخل" />
            <LegendDot color="#ef4444" label="مصاريف" />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.9rem", fontWeight: 700 }}>🍩 توزيع المصاريف</h3>
          {pieData.length === 0 ? (
            <EmptyChart label="لا توجد مصاريف هذا الشهر" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={58} innerRadius={28} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: "Cairo", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "0.8rem" }}
                    formatter={(v: number) => [formatCurrency(v, currency), ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "4px" }}>
                {pieData.slice(0, 5).map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color, flex: "none" }} />
                      <span>{d.icon} {d.name}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(d.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* المعاملات الأخيرة — قابلة للتعديل */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>⏰ أحدث المعاملات</h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="btn btn-primary" onClick={openAdd} style={{ fontSize: "0.78rem", padding: "5px 10px" }}>+ إضافة</button>
            <a href="/dashboard/transactions" style={{ fontSize: "0.78rem", color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>كل المعاملات ←</a>
          </div>
        </div>

        {recentTxs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>📭</div>
            <div style={{ fontSize: "0.875rem", marginBottom: "12px" }}>لا توجد معاملات بعد</div>
            <button className="btn btn-primary" onClick={openAdd} style={{ fontSize: "0.85rem" }}>+ أضف أول مصروف</button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {recentTxs.map(tx => {
              const cat = state.categories.find(c => c.id === tx.categoryId);
              const acc = state.accounts.find(a => a.id === tx.accountId);
              const isActive = activeRow === tx.id;
              return (
                <div key={tx.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "9px 6px",
                    borderRadius: "10px", cursor: "pointer",
                    background: isActive ? "var(--surface-2)" : "transparent",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onClick={() => setActiveRow(isActive ? null : tx.id)}
                >
                  {/* أيقونة الفئة */}
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${cat?.color ?? "#ccc"}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flex: "none" }}>
                    {cat?.icon ?? "📦"}
                  </div>

                  {/* البيانات */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.description}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {cat?.name} · {acc?.name ?? "—"} · {formatDateShort(tx.date)}
                    </div>
                  </div>

                  {/* المبلغ */}
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: tx.type === "income" ? "var(--green)" : "#ef4444", whiteSpace: "nowrap" }}>
                    {tx.type === "income" ? "+" : "−"}{formatCurrency(tx.amount, currency)}
                  </div>

                  {/* أزرار التعديل/الحذف — تظهر عند الضغط */}
                  {isActive && (
                    <div style={{ display: "flex", gap: "4px", marginRight: "4px" }}
                      onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEdit(tx)}
                        style={{
                          padding: "4px 8px", borderRadius: "7px", border: "none", cursor: "pointer",
                          background: "var(--primary)", color: "white", fontSize: "0.75rem", fontWeight: 600,
                        }}>✏️ تعديل</button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        style={{
                          padding: "4px 8px", borderRadius: "7px", border: "none", cursor: "pointer",
                          background: "#fee2e2", color: "#b91c1c", fontSize: "0.75rem", fontWeight: 600,
                        }}>🗑️</button>
                    </div>
                  )}
                </div>
              );
            })}
            {/* تلميح للمستخدم */}
            <div style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "8px", opacity: 0.7 }}>
              اضغط على أي معاملة للتعديل أو الحذف
            </div>
          </div>
        )}
      </div>

      {/* FAB — زر إضافة عائم للموبايل */}
      {isMobile && (
        <button
          onClick={openAdd}
          style={{
            position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
            width: "56px", height: "56px", borderRadius: "50%",
            background: "var(--primary)", color: "white", border: "none",
            fontSize: "1.6rem", cursor: "pointer", zIndex: 100,
            boxShadow: "0 4px 20px #1a6fd455",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >+</button>
      )}

      {/* ═══ Modal الإضافة / التعديل ═══ */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700 }}>
              {editing ? "✏️ تعديل المعاملة" : "➕ معاملة جديدة"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* النوع */}
              <div style={{ display: "flex", gap: "8px" }}>
                {(["expense", "income"] as const).map(t => (
                  <button key={t} className={`btn ${form.type === t ? "btn-primary" : "btn-ghost"}`} style={{ flex: 1 }}
                    onClick={() => setForm(f => ({ ...f, type: t, categoryId: (t === "income" ? incomeCategories : expenseCategories)[0]?.id }))}>
                    {t === "income" ? "📥 دخل" : "📤 مصروف"}
                  </button>
                ))}
              </div>

              {/* المبلغ */}
              <Field label={`المبلغ (${user?.currency ?? "OMR"})`}>
                <input className="input" type="number" placeholder="0.000" min="0" step="0.001"
                  value={form.amount ?? ""} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} />
              </Field>

              {/* الوصف */}
              <Field label="الوصف">
                <input className="input" placeholder="مثال: وقود السيارة" value={form.description ?? ""}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </Field>

              {/* الفئة */}
              <Field label="الفئة">
                <select className="input" value={form.categoryId ?? ""}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  {availableCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </Field>

              {/* الحساب */}
              {state.accounts.length > 0 && (
                <Field label="الحساب">
                  <select className="input" value={form.accountId ?? ""}
                    onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}>
                    <option value="">— بدون حساب —</option>
                    {state.accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                  </select>
                </Field>
              )}

              {/* التاريخ */}
              <Field label="التاريخ">
                <input className="input" type="date" value={form.date ?? ""}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </Field>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={saveForm}>حفظ ✔</button>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── مكونات مساعدة ───────────────────────────────────────────
function StatCard({ icon, label, value, color, big }: { icon: string; label: string; value: string; color: string; big?: boolean }) {
  return (
    <div className="card" style={{ position: "relative", overflow: "hidden", padding: "14px" }}>
      <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500, marginBottom: "3px" }}>{label}</div>
      <div style={{ fontSize: big ? "1.1rem" : "0.95rem", fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      <div style={{ position: "absolute", bottom: "-12px", left: "-8px", fontSize: "3.5rem", opacity: 0.05 }}>{icon}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: color }} />
      {label}
    </div>
  );
}

function EmptyChart({ label = "لا توجد بيانات بعد" }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "150px", color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center" }}>
      <div><div style={{ fontSize: "2rem", marginBottom: "8px" }}>📭</div>{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>{label}</label>
      {children}
    </div>
  );
}

"use client";

import { useState } from "react";
import { loadUser, saveUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAppState } from "@/hooks/useAppState";
import { formatCurrency, CURRENCY_SYMBOLS } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { resetData } = useAppState();
  const user = loadUser();
  const currency = user?.currency ?? "OMR";
  const currSymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // الملف الشخصي
  const [name, setName] = useState(user?.name ?? "");
  const [savedMsg, setSavedMsg] = useState("");

  // الميزانية الشخصية
  const [monthlyIncome, setMonthlyIncome] = useState(String(user?.monthlyIncome ?? ""));
  const [monthlyObligations, setMonthlyObligations] = useState(String(user?.monthlyObligations ?? ""));
  const [savingsGoalPct, setSavingsGoalPct] = useState(String(user?.savingsGoalPct ?? 20));

  const incomeNum = parseFloat(monthlyIncome) || 0;
  const obligationsNum = parseFloat(monthlyObligations) || 0;
  const savingsPctNum = parseInt(savingsGoalPct) || 20;
  const disposable = incomeNum - obligationsNum;
  const savingsTarget = (disposable * savingsPctNum) / 100;
  const spendingBudget = disposable - savingsTarget;

  function saveProfile() {
    if (!user || !name.trim()) return;
    saveUser({ ...user, name });
    setSavedMsg("✅ تم حفظ الاسم!");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  function saveBudget() {
    if (!user) return;
    saveUser({
      ...user,
      monthlyIncome: incomeNum,
      monthlyObligations: obligationsNum,
      savingsGoalPct: Math.min(100, Math.max(0, savingsPctNum)),
      setupDone: true,
    });
    setSavedMsg("✅ تم حفظ الميزانية!");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  function handleLogout() {
    saveUser(null);
    router.push("/login");
  }

  function handleReset() {
    if (!confirm("سيتم حذف جميع المعاملات والحسابات وإعادة ضبط التطبيق. هل أنت متأكد؟")) return;
    resetData();
    setSavedMsg("✅ تم إعادة الضبط");
    setTimeout(() => setSavedMsg(""), 2500);
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>⚙️ الإعدادات</h1>

      {/* رسالة حفظ */}
      {savedMsg && (
        <div style={{
          marginBottom: "1rem", padding: "10px 16px", borderRadius: "10px",
          background: "#d1fae5", border: "1px solid #6ee7b7", color: "#065f46",
          fontWeight: 600, fontSize: "0.875rem",
        }}>
          {savedMsg}
        </div>
      )}

      {/* 1. الملف الشخصي */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>👤 الملف الشخصي</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>الاسم</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="اسمك" />
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>رقم الهاتف</label>
            <input className="input" value={user?.phone ?? ""} disabled style={{ opacity: 0.6 }} />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={saveProfile}>
            حفظ الاسم
          </button>
        </div>
      </div>

      {/* 2. الميزانية الشخصية */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>💼 الميزانية الشخصية</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1rem", marginTop: "4px" }}>
          هذه الأرقام تُستخدم لحساب ميزانيتك وتنبيهاتك المالية
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* الدخل */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
              💰 الدخل الشهري ({currSymbol})
            </label>
            <input className="input" type="number" placeholder="مثال: 800" value={monthlyIncome}
              onChange={e => setMonthlyIncome(e.target.value)} min="0" step="0.5" />
          </div>

          {/* الالتزامات */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
              🏠 الالتزامات الشهرية ({currSymbol})
              <span style={{ fontWeight: 400, fontSize: "0.75rem" }}> — إيجار، أقساط، اشتراكات ثابتة</span>
            </label>
            <input className="input" type="number" placeholder="مثال: 200" value={monthlyObligations}
              onChange={e => setMonthlyObligations(e.target.value)} min="0" step="0.5" />
          </div>

          {/* هدف الادخار */}
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
              🎯 هدف الادخار: <strong style={{ color: "var(--primary)" }}>{savingsGoalPct}٪</strong>
            </label>
            <input type="range" min="0" max="60" step="5" value={savingsGoalPct}
              onChange={e => setSavingsGoalPct(e.target.value)}
              style={{ width: "100%", accentColor: "var(--primary)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
              <span>0٪</span><span>30٪</span><span>60٪</span>
            </div>
          </div>

          {/* معاينة */}
          {incomeNum > 0 && (
            <div style={{ background: "var(--surface-2)", borderRadius: "12px", padding: "12px 14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>📋 ملخص ميزانيتك</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <BudgetRow label="الدخل الشهري" value={formatCurrency(incomeNum, currency)} color="var(--green)" />
                <BudgetRow label="الالتزامات" value={`− ${formatCurrency(obligationsNum, currency)}`} color="#ef4444" />
                <BudgetRow label="المتاح للإنفاق" value={formatCurrency(disposable, currency)} color="var(--primary)" bold />
                <div style={{ borderTop: "1px solid var(--border)", marginTop: "4px", paddingTop: "6px" }}>
                  <BudgetRow label={`هدف الادخار (${savingsPctNum}٪)`} value={formatCurrency(savingsTarget, currency)} color="var(--teal)" />
                  <BudgetRow label="ميزانية الإنفاق اليومية" value={formatCurrency(spendingBudget / 30, currency)} color="var(--text)" />
                </div>
              </div>
            </div>
          )}

          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={saveBudget}>
            💾 حفظ الميزانية
          </button>
        </div>
      </div>

      {/* 3. معلومات التطبيق */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>ℹ️ عن التطبيق</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <InfoRow label="الإصدار" value="1.1.0" />
          <InfoRow label="التخزين" value="محلي (localStorage)" />
          <InfoRow label="العملة" value={`${currSymbol} (${currency})`} />
          <InfoRow label="اللغة" value="العربية" />
        </div>
      </div>

      {/* 4. إدارة البيانات */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>🗄️ إدارة البيانات</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          جميع بياناتك محفوظة محلياً على جهازك فقط. لا يتم إرسال أي بيانات إلى خوادم خارجية.
        </p>
        <button className="btn btn-danger" style={{ fontSize: "0.875rem" }} onClick={handleReset}>
          🗑️ إعادة ضبط البيانات
        </button>
      </div>

      {/* 5. تسجيل الخروج */}
      <div className="card">
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>🚪 تسجيل الخروج</h3>
        <button className="btn btn-danger" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </div>
  );
}

function BudgetRow({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color }}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span style={{ fontWeight: 600, color: "var(--text)" }}>{value}</span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { loadUser, saveUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAppState } from "@/hooks/useAppState";

export default function SettingsPage() {
  const router = useRouter();
  const { resetData } = useAppState();
  const user = loadUser();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  function saveName() {
    if (!user || !name.trim()) return;
    saveUser({ ...user, name });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    saveUser(null);
    router.push("/login");
  }

  function handleReset() {
    if (!confirm("سيتم حذف جميع البيانات وإعادة ضبط التطبيق. هل أنت متأكد؟")) return;
    resetData();
    alert("تم إعادة ضبط البيانات.");
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1.5rem" }}>الإعدادات</h1>

      {/* Profile */}
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
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} onClick={saveName}>
            {saved ? "✅ تم الحفظ!" : "حفظ"}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>ℹ️ عن التطبيق</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>الإصدار</span><span style={{ fontWeight: 600, color: "var(--text)" }}>1.0.0</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>التخزين</span><span style={{ fontWeight: 600, color: "var(--text)" }}>محلي (localStorage)</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>العملة</span><span style={{ fontWeight: 600, color: "var(--text)" }}>ريال عماني (OMR)</span></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>اللغة</span><span style={{ fontWeight: 600, color: "var(--text)" }}>العربية</span></div>
        </div>
      </div>

      {/* Data */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>🗄️ إدارة البيانات</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
          جميع بياناتك محفوظة محلياً على جهازك فقط. لا يتم إرسال أي بيانات إلى خوادم خارجية.
        </p>
        <button className="btn btn-danger" style={{ fontSize: "0.875rem" }} onClick={handleReset}>
          🗑️ إعادة ضبط البيانات
        </button>
      </div>

      {/* Logout */}
      <div className="card">
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 700 }}>🚪 تسجيل الخروج</h3>
        <button className="btn btn-danger" onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </div>
  );
}

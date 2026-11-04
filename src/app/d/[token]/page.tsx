"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API = "https://smartwallet-backend-qv11.onrender.com";

interface Expense {
  id: string;
  category: string;
  subcategory?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
}

interface DashData {
  user: { name: string; phone: string; tier: string };
  expenses: Expense[];
  stats: { totalAll: number; thisMonth: number; lastMonth: number; count: number; categories: Record<string, number> };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatAmt(amount: number, currency: string) {
  if (currency === "بيسة") return amount.toFixed(0) + " بيسة";
  return amount.toFixed(3) + " ر.ع";
}

export default function DashboardToken() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/dashboard/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject("not found"))
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError("رابط غير صحيح أو منتهي"); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f1117", color: "#e8eaf0", fontFamily: "Segoe UI, Arial, sans-serif", direction: "rtl" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💳</div>
        <p>جاري التحميل...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0f1117", color: "#e8eaf0", fontFamily: "Segoe UI, Arial, sans-serif", direction: "rtl" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚠️</div>
        <p>{error || "خطأ في تحميل البيانات"}</p>
      </div>
    </div>
  );

  const topCats = Object.entries(data.stats.categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const now = new Date();
  const thisMonthExpenses = data.expenses.filter(e => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return (
    <div style={{ background: "#0f1117", minHeight: "100vh", color: "#e8eaf0", fontFamily: "Segoe UI, Tahoma, Arial, sans-serif", direction: "rtl", fontSize: "14px" }}>
      {/* Header */}
      <div style={{ background: "#1a1f2e", borderBottom: "1px solid #2a2f42", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>💳</span>
          <div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#00e676" }}>SmartWallet AI</div>
            <div style={{ color: "#9098b1", fontSize: "11px" }}>لوحة تحكم شخصية</div>
          </div>
        </div>
        <div style={{ fontWeight: 600, fontSize: "14px" }}>{data.user.name || "—"}</div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "14px 16px" }}>
        <div style={{ background: "#1a1f2e", borderRadius: "14px", padding: "14px", border: "1px solid #2a2f42" }}>
          <div style={{ color: "#9098b1", fontSize: "11px", marginBottom: "6px" }}>هذا الشهر (ر.ع)</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#ff9100" }}>{data.stats.thisMonth.toFixed(3)}</div>
        </div>
        <div style={{ background: "#1a1f2e", borderRadius: "14px", padding: "14px", border: "1px solid #2a2f42" }}>
          <div style={{ color: "#9098b1", fontSize: "11px", marginBottom: "6px" }}>الشهر الماضي (ر.ع)</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#448aff" }}>{data.stats.lastMonth.toFixed(3)}</div>
        </div>
        <div style={{ background: "#1a1f2e", borderRadius: "14px", padding: "14px", border: "1px solid #2a2f42" }}>
          <div style={{ color: "#9098b1", fontSize: "11px", marginBottom: "6px" }}>إجمالي كل شيء (ر.ع)</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#ff5252" }}>{data.stats.totalAll.toFixed(3)}</div>
        </div>
        <div style={{ background: "#1a1f2e", borderRadius: "14px", padding: "14px", border: "1px solid #2a2f42" }}>
          <div style={{ color: "#9098b1", fontSize: "11px", marginBottom: "6px" }}>عدد العمليات</div>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#00e676" }}>{data.stats.count}</div>
        </div>
      </div>

      {/* Top Categories */}
      {topCats.length > 0 && (
        <div style={{ margin: "4px 16px 20px" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px" }}>📊 توزيع مصاريف هذا الشهر</div>
          {topCats.map(([cat, amt]) => (
            <div key={cat} style={{ background: "#1a1f2e", borderRadius: "10px", padding: "10px 14px", marginBottom: "6px", display: "flex", justifyContent: "space-between", border: "1px solid #2a2f42" }}>
              <span>{cat}</span>
              <span style={{ color: "#ff9100", fontWeight: 600 }}>{(amt as number).toFixed(3)} ر.ع</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Expenses */}
      <div style={{ margin: "4px 16px 20px" }}>
        <div style={{ fontSize: "15px", fontWeight: 600, marginBottom: "10px" }}>🧾 آخر المصاريف</div>
        {data.expenses.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9098b1", padding: "30px 0" }}>لا توجد مصاريف بعد</div>
        ) : (
          data.expenses.slice(0, 50).map(e => (
            <div key={e.id} style={{ background: "#1a1f2e", borderRadius: "12px", padding: "12px 14px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #2a2f42" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12px", color: "#9098b1" }}>{e.category}{e.subcategory ? " › " + e.subcategory : ""}</div>
                <div style={{ fontSize: "14px", fontWeight: 500, marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description || e.category}</div>
                <div style={{ fontSize: "11px", color: "#9098b1", marginTop: "3px" }}>{formatDate(e.createdAt)}</div>
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#ff5252", marginRight: "14px", whiteSpace: "nowrap" }}>
                {formatAmt(e.amount, e.currency)}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: "center", padding: "24px", color: "#9098b1", fontSize: "11px", borderTop: "1px solid #2a2f42" }}>
        SmartWallet AI • {new Date().toLocaleDateString("ar-SA-u-ca-gregory", { year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

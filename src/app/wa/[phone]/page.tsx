"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Expense {
  id?: string;
  date: string;
  category: string;
  categoryLabel?: string;
  subcategory?: string;
  description?: string;
  amount: number;
  amountOMR: number;
  currency: string;
  paymentMethod?: string;
}

function fmt(n: number, cur = "ر.ع") {
  return n.toFixed(3) + " " + cur;
}

function fmtDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch { return d; }
}

export default function WaDashboard() {
  const params = useParams();
  const phone = params.phone as string;
  const [data, setData] = useState<{ expenses: Expense[]; profile: any; sub: any } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!phone) return;
    fetch(`/api/wa-data?phone=${phone}`)
      .then(r => r.ok ? r.json() : Promise.reject("خطأ في التحميل"))
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, [phone]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif" }}>
      <p>⏳ جاري تحميل مصاريفك...</p>
    </div>
  );
  if (error) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", fontFamily:"sans-serif", color:"red" }}>
      <p>❌ {error}</p>
    </div>
  );
  if (!data) return null;

  const { expenses, profile, sub } = data;
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalOMR = expenses.reduce((s, e) => s + (e.amountOMR ?? e.amount ?? 0), 0);
  const thisMonthOMR = thisMonth.reduce((s, e) => s + (e.amountOMR ?? e.amount ?? 0), 0);

  // Category totals
  const catTotals: Record<string, number> = {};
  thisMonth.forEach(e => {
    const c = e.categoryLabel || e.category || "أخرى";
    catTotals[c] = (catTotals[c] || 0) + (e.amountOMR ?? e.amount ?? 0);
  });
  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div dir="rtl" style={{ fontFamily:"sans-serif", maxWidth:600, margin:"0 auto", padding:16, background:"#f9f9f9", minHeight:"100vh" }}>
      {/* Header */}
      <div style={{ background:"#1a1a2e", color:"white", borderRadius:12, padding:20, marginBottom:16 }}>
        <h2 style={{ margin:0, fontSize:20 }}>💎 داشبورد مصاريفك</h2>
        <p style={{ margin:"6px 0 0", opacity:0.7, fontSize:13 }}>📱 {phone}</p>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"هذا الشهر", value: fmt(thisMonthOMR), color:"#4CAF50" },
          { label:"الإجمالي الكلي", value: fmt(totalOMR), color:"#2196F3" },
          { label:"عدد المصاريف", value: expenses.length + " مصروف", color:"#FF9800" },
          { label:"🔥 سلسلة الأيام", value: (profile?.streak ?? 0) + " يوم", color:"#E91E63" },
        ].map(s => (
          <div key={s.label} style={{ background:"white", borderRadius:10, padding:14, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
            <p style={{ margin:0, fontSize:11, color:"#888" }}>{s.label}</p>
            <p style={{ margin:"4px 0 0", fontSize:18, fontWeight:"bold", color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Top categories */}
      {sortedCats.length > 0 && (
        <div style={{ background:"white", borderRadius:10, padding:16, marginBottom:16, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin:"0 0 10px", fontSize:14, color:"#444" }}>📊 أعلى الفئات هذا الشهر</h3>
          {sortedCats.slice(0,5).map(([cat, amt]) => (
            <div key={cat} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #f0f0f0" }}>
              <span style={{ fontSize:14 }}>{cat}</span>
              <span style={{ fontSize:14, fontWeight:"bold" }}>{fmt(amt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expenses list */}
      <div style={{ background:"white", borderRadius:10, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin:"0 0 10px", fontSize:14, color:"#444" }}>📋 آخر المصاريف ({expenses.length})</h3>
        {expenses.length === 0 ? (
          <p style={{ color:"#aaa", textAlign:"center" }}>لا توجد مصاريف بعد</p>
        ) : (
          [...expenses].reverse().map((e, i) => (
            <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #f5f5f5", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:"bold" }}>{e.description || e.categoryLabel || e.category}</p>
                <p style={{ margin:"2px 0 0", fontSize:12, color:"#888" }}>{fmtDate(e.date)} · {e.categoryLabel || e.category}</p>
              </div>
              <div style={{ textAlign:"left" }}>
                <p style={{ margin:0, fontSize:15, fontWeight:"bold", color:"#e53935" }}>{fmt(e.amountOMR ?? e.amount, e.currency)}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <p style={{ textAlign:"center", marginTop:16, fontSize:11, color:"#aaa" }}>
        SmartWallet AI · {sub?.plan === "premium" ? "💎 بريميوم" : "مجاني"}
      </p>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PricingContent() {
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState("");

  async function handleSubscribe(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError("");
    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "حدث خطأ، يرجى المحاولة مرة أخرى");
        setLoading(null);
      }
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(null);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0fdf4 0%, #e8f4ff 100%)",
      fontFamily: "'Cairo', sans-serif",
      direction: "rtl",
      padding: "2rem 1rem",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💎</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.5rem" }}>
          أسعار بسيطة وشفافة
        </h1>
        <p style={{ color: "#64748b", fontSize: "1.1rem", margin: "0 0 0.75rem" }}>
          اختر الخطة التي تناسبك
        </p>
        <p style={{
          color: "#10b981", fontWeight: 600, fontSize: "0.95rem",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          padding: "0.5rem 1.25rem", borderRadius: "999px", display: "inline-block",
        }}>
          ✅ جرّب مجاناً — 30 مصروف كل شهر بدون دفع
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem", maxWidth: "680px", margin: "0 auto 2rem",
      }}>
        {/* Monthly Card */}
        <div style={{
          background: "#fff", borderRadius: "24px",
          padding: "2rem", boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "2px solid #e2e8f0", position: "relative",
        }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem", color: "#0f172a" }}>
              📅 شهري
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800, color: "#1a6fd4" }}>1.5</span>
              <span style={{ color: "#64748b", fontSize: "1rem" }}>ر.ع / شهر</span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              يمكنك الإلغاء في أي وقت
            </p>
          </div>
          <button
            onClick={() => handleSubscribe("monthly")}
            disabled={loading !== null}
            style={{
              width: "100%", padding: "0.85rem",
              background: loading === "monthly" ? "#94a3b8" : "linear-gradient(135deg, #1a6fd4, #14b8a6)",
              color: "#fff", border: "none", borderRadius: "12px",
              fontSize: "1rem", fontWeight: 700, cursor: loading !== null ? "not-allowed" : "pointer",
              marginBottom: "1.25rem", fontFamily: "'Cairo', sans-serif",
              transition: "all 0.2s",
            }}
          >
            {loading === "monthly" ? "⏳ جاري التجهيز..." : "🚀 اشترك الآن"}
          </button>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {["تسجيل مصاريف غير محدود", "تقارير وإحصائيات متقدمة", "تنبيهات ذكية للميزانية", "تصدير PDF", "داشبورد كامل"].map(f => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#374151", fontSize: "0.9rem" }}>
                <span style={{ color: "#10b981", flexShrink: 0 }}>✅</span> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Yearly Card */}
        <div style={{
          background: "linear-gradient(135deg, #1a6fd4 0%, #14b8a6 100%)",
          borderRadius: "24px", padding: "2rem",
          boxShadow: "0 8px 32px rgba(26,111,212,0.3)",
          position: "relative", color: "#fff",
        }}>
          <div style={{
            position: "absolute", top: "1rem", left: "1rem",
            background: "#fbbf24", color: "#000", fontSize: "0.75rem",
            fontWeight: 700, padding: "0.2rem 0.75rem", borderRadius: "999px",
          }}>
            🎁 شهران مجاناً
          </div>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
              📆 سنوي
            </h2>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "0.25rem" }}>
              <span style={{ fontSize: "3rem", fontWeight: 800 }}>15</span>
              <span style={{ opacity: 0.85, fontSize: "1rem" }}>ر.ع / سنة</span>
            </div>
            <p style={{ opacity: 0.8, fontSize: "0.85rem", margin: "0.25rem 0 0" }}>
              بدلاً من 18 ر.ع — وفّر 3 ر.ع
            </p>
          </div>
          <button
            onClick={() => handleSubscribe("yearly")}
            disabled={loading !== null}
            style={{
              width: "100%", padding: "0.85rem",
              background: loading === "yearly" ? "rgba(255,255,255,0.4)" : "#fff",
              color: loading === "yearly" ? "#fff" : "#1a6fd4",
              border: "none", borderRadius: "12px",
              fontSize: "1rem", fontWeight: 700, cursor: loading !== null ? "not-allowed" : "pointer",
              marginBottom: "1.25rem", fontFamily: "'Cairo', sans-serif",
              transition: "all 0.2s",
            }}
          >
            {loading === "yearly" ? "⏳ جاري التجهيز..." : "🚀 اشترك الآن"}
          </button>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {["تسجيل مصاريف غير محدود", "تقارير وإحصائيات متقدمة", "تنبيهات ذكية للميزانية", "تصدير PDF", "داشبورد كامل"].map(f => (
              <li key={f} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                <span style={{ color: "#bbf7d0", flexShrink: 0 }}>✅</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          maxWidth: "480px", margin: "0 auto 1rem",
          background: "#fef2f2", border: "1px solid #fecaca",
          borderRadius: "12px", padding: "1rem",
          color: "#dc2626", textAlign: "center", fontSize: "0.9rem",
        }}>
          ❌ {error}
        </div>
      )}

      {/* WhatsApp note */}
      {phone && (
        <p style={{ textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
          سيتم تفعيل الاشتراك على رقم واتساب: <strong dir="ltr">+{phone}</strong>
        </p>
      )}

      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", marginTop: "2rem" }}>
        🔒 الدفع الآمن عبر بوابة Amwal Pay
      </p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

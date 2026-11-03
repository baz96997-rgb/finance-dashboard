"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveUser, loadUser } from "@/lib/store";

const COUNTRIES = [
  { code: "+968", flag: "🇴🇲", name: "عُمان" },
  { code: "+966", flag: "🇸🇦", name: "السعودية" },
  { code: "+971", flag: "🇦🇪", name: "الإمارات" },
  { code: "+965", flag: "🇰🇼", name: "الكويت" },
  { code: "+974", flag: "🇶🇦", name: "قطر" },
  { code: "+973", flag: "🇧🇭", name: "البحرين" },
  { code: "+962", flag: "🇯🇴", name: "الأردن" },
  { code: "+20",  flag: "🇪🇬", name: "مصر" },
];

type Step = "phone" | "otp" | "name" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [step, setStep] = useState<Step>("phone");
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // بيانات الإعداد الأولي
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyObligations, setMonthlyObligations] = useState("");
  const [savingsGoalPct, setSavingsGoalPct] = useState("20");

  useEffect(() => {
    const user = loadUser();
    if (user) router.replace("/dashboard");
    const saved = localStorage.getItem("wallet_theme") ?? "light";
    setTheme(saved as "light" | "dark");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, [router]);

  function sendOtp() {
    if (!phone.trim() || phone.length < 7) { setError("أدخل رقم هاتف صحيح"); return; }
    setLoading(true); setError("");
    setTimeout(() => {
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setGeneratedOtp(code);
      setLoading(false);
      setStep("otp");
      alert(`🔐 رمز التحقق التجريبي: ${code}\n\n(في الإنتاج سيُرسَل عبر واتساب)`);
    }, 1200);
  }

  function verifyOtp() {
    if (otp !== generatedOtp) { setError("رمز التحقق غير صحيح"); return; }
    setError("");
    setStep("name");
  }

  function goToSetup() {
    if (!name.trim()) { setError("أدخل اسمك"); return; }
    setError("");
    setStep("setup");
  }

  function finish() {
    const income = parseFloat(monthlyIncome) || 0;
    const obligations = parseFloat(monthlyObligations) || 0;
    const savingsPct = parseInt(savingsGoalPct) || 20;

    saveUser({
      phone: country.code + phone,
      name,
      currency: "OMR",
      theme,
      monthlyIncome: income,
      monthlyObligations: obligations,
      savingsGoalPct: Math.min(100, Math.max(0, savingsPct)),
      setupDone: true,
    });
    router.push("/dashboard");
  }

  function skipSetup() {
    saveUser({
      phone: country.code + phone,
      name,
      currency: "OMR",
      theme,
      monthlyIncome: 0,
      monthlyObligations: 0,
      savingsGoalPct: 20,
      setupDone: false,
    });
    router.push("/dashboard");
  }

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("wallet_theme", next);
  }

  const incomeNum = parseFloat(monthlyIncome) || 0;
  const obligationsNum = parseFloat(monthlyObligations) || 0;
  const savingsPctNum = parseInt(savingsGoalPct) || 20;
  const disposable = incomeNum - obligationsNum;
  const savingsTarget = (disposable * savingsPctNum) / 100;
  const spendingBudget = disposable - savingsTarget;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      {/* Theme toggle */}
      <button onClick={toggleTheme} className="btn btn-ghost" style={{ position: "absolute", top: "1rem", left: "1rem", fontSize: "1.2rem", padding: "8px" }}>
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>💎</div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)", margin: 0 }}>إدارة المصاريف</h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.25rem", fontSize: "0.95rem" }}>تتبع مصاريفك وادخاراتك بذكاء</p>
      </div>

      {/* Card */}
      <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "2rem" }}>

        {/* Step: Phone */}
        {step === "phone" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>تسجيل الدخول</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>أدخل رقم هاتفك لاستلام رمز التحقق</p>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>رقم الهاتف</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <select className="input" value={country.code} onChange={e => setCountry(COUNTRIES.find(c => c.code === e.target.value) ?? COUNTRIES[0])} style={{ width: "130px", flex: "none" }}>
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input className="input" type="tel" placeholder="9XXXXXXXX" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && sendOtp()} />
            </div>
            {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={sendOtp} disabled={loading}>
              {loading ? "جارٍ الإرسال..." : "📱 إرسال رمز التحقق"}
            </button>
          </div>
        )}

        {/* Step: OTP */}
        {step === "otp" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>رمز التحقق</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              أُرسل رمز مكون من 4 أرقام إلى<br />
              <strong style={{ color: "var(--text)" }}>{country.code}{phone}</strong>
            </p>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>الرمز</label>
            <input className="input" type="text" inputMode="numeric" maxLength={4} placeholder="0000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && verifyOtp()} style={{ fontSize: "1.5rem", letterSpacing: "0.3em", textAlign: "center", marginBottom: "1rem" }} />
            {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%", marginBottom: "0.75rem" }} onClick={verifyOtp}>تحقق</button>
            <button className="btn btn-ghost" style={{ width: "100%", fontSize: "0.85rem" }} onClick={() => { setStep("phone"); setOtp(""); setError(""); }}>تغيير الرقم</button>
          </div>
        )}

        {/* Step: Name */}
        {step === "name" && (
          <div className="animate-fade-in">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>أهلاً بك! 🎉</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>كيف تريد أن نناديك؟</p>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>الاسم</label>
            <input className="input" type="text" placeholder="اسمك الكريم" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && goToSetup()} style={{ marginBottom: "1rem" }} />
            {error && <p style={{ color: "#ef4444", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={goToSetup}>التالي ←</button>
          </div>
        )}

        {/* Step: Setup */}
        {step === "setup" && (
          <div className="animate-fade-in">
            <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "4px" }}>📊</div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>إعداد ميزانيتك الشخصية</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: "4px" }}>
                أدخل أرقامك لنعطيك تحليلاً دقيقاً — يمكنك التعديل لاحقاً
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* الدخل */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                  💼 الدخل الشهري (ر.ع)
                </label>
                <input className="input" type="number" placeholder="مثال: 800" value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)} min="0" step="0.5" />
              </div>

              {/* الالتزامات */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                  🏠 الالتزامات الشهرية (ر.ع) <span style={{ fontWeight: 400, fontSize: "0.75rem" }}>إيجار، أقساط، اشتراكات…</span>
                </label>
                <input className="input" type="number" placeholder="مثال: 200" value={monthlyObligations}
                  onChange={e => setMonthlyObligations(e.target.value)} min="0" step="0.5" />
              </div>

              {/* هدف الادخار */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "5px" }}>
                  🎯 هدف الادخار الشهري: <strong style={{ color: "var(--primary)" }}>{savingsGoalPct}٪</strong>
                </label>
                <input type="range" min="0" max="60" step="5" value={savingsGoalPct}
                  onChange={e => setSavingsGoalPct(e.target.value)}
                  style={{ width: "100%", accentColor: "var(--primary)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  <span>0٪</span><span>30٪</span><span>60٪</span>
                </div>
              </div>

              {/* معاينة حية */}
              {incomeNum > 0 && (
                <div style={{ background: "var(--surface-2)", borderRadius: "12px", padding: "12px 14px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "8px" }}>📋 ملخص ميزانيتك</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", fontSize: "0.82rem" }}>
                    <Row label="الدخل الشهري" value={`${incomeNum.toFixed(3)} ر.ع`} color="var(--green)" />
                    <Row label="الالتزامات" value={`− ${obligationsNum.toFixed(3)} ر.ع`} color="#ef4444" />
                    <Row label="المتاح للإنفاق" value={`${disposable.toFixed(3)} ر.ع`} color="var(--primary)" bold />
                    <div style={{ borderTop: "1px solid var(--border)", marginTop: "4px", paddingTop: "6px" }}>
                      <Row label={`ادخار (${savingsPctNum}٪)`} value={`${savingsTarget.toFixed(3)} ر.ع`} color="var(--teal)" />
                      <Row label="ميزانية الإنفاق اليومية" value={`${(spendingBudget / 30).toFixed(3)} ر.ع`} color="var(--text)" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={finish}>
                  ابدأ الرحلة 🚀
                </button>
                <button className="btn btn-ghost" style={{ fontSize: "0.82rem", padding: "0 12px" }} onClick={skipSetup}>
                  تخطّ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "1.5rem", textAlign: "center" }}>
        بياناتك محفوظة على جهازك فقط — لا خوادم خارجية 🔒
      </p>
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color }}>{value}</span>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/store";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ phone: string; name: string } | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = loadUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
    const saved = (localStorage.getItem("wallet_theme") ?? "light") as "light" | "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, [router]);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("wallet_theme", next);
  }

  if (!mounted || !user) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <p style={{ color: "var(--text-muted)" }}>جارٍ التحميل...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        userName={user.name}
        theme={theme}
        onToggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <div style={{
        flex: 1,
        marginRight: "var(--sidebar-w)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Topbar mobile */}
        <header style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 30,
        }} className="mobile-topbar">
          <button className="btn btn-ghost" style={{ padding: "6px" }} onClick={() => setMobileOpen(true)}>☰</button>
          <div style={{ fontWeight: 800, color: "var(--primary)" }}>💎</div>
          <div style={{ width: 32 }} />
        </header>

        <main style={{ flex: 1, padding: "1.5rem", maxWidth: "1200px", width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          div[style*="margin-right: var(--sidebar-w)"] { margin-right: 0 !important; }
        }
      `}</style>
    </div>
  );
}

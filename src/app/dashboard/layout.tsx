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
          padding: "10px 16px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, zIndex: 30,
        }} className="mobile-topbar">
          {/* زر القائمة — مكبّر وواضح */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              width: "44px", height: "44px",
              borderRadius: "12px",
              background: "var(--surface-2)",
              border: "1.5px solid var(--border)",
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "5px", padding: 0,
            }}
          >
            <span style={{ display: "block", width: "22px", height: "2.5px", background: "var(--text)", borderRadius: "2px" }} />
            <span style={{ display: "block", width: "16px", height: "2.5px", background: "var(--text)", borderRadius: "2px", alignSelf: "flex-start", marginRight: "2px", marginLeft: "11px" }} />
            <span style={{ display: "block", width: "22px", height: "2.5px", background: "var(--text)", borderRadius: "2px" }} />
          </button>

          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>💎 Mizar</div>
          <div style={{ width: "44px" }} />
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

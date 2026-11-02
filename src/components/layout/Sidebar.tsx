"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { saveUser } from "@/lib/store";

const NAV = [
  { href: "/dashboard",              icon: "🏠", label: "الرئيسية" },
  { href: "/dashboard/transactions", icon: "💸", label: "المعاملات" },
  { href: "/dashboard/budgets",      icon: "📊", label: "الميزانيات" },
  { href: "/dashboard/goals",        icon: "🎯", label: "الأهداف" },
  { href: "/dashboard/accounts",     icon: "🏦", label: "الحسابات" },
  { href: "/dashboard/reports",      icon: "📈", label: "التقارير" },
  { href: "/dashboard/settings",     icon: "⚙️", label: "الإعدادات" },
];

interface SidebarProps {
  userName: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ userName, theme, onToggleTheme, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    saveUser(null);
    router.push("/login");
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      <aside style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        width: "var(--sidebar-w)",
        background: "var(--surface)",
        borderLeft: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "1.25rem 1rem",
        zIndex: 50,
        transform: mobileOpen ? "translateX(0)" : undefined,
        transition: "transform 0.25s ease",
      }}
      className="sidebar-desktop"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.75rem", padding: "0 4px" }}>
          <span style={{ fontSize: "1.75rem" }}>💎</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--primary)" }}>💎</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>إدارة المصاريف</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ marginRight: "auto", padding: "4px", display: "none" }} id="sidebar-close">✕</button>
        </div>

        {/* User */}
        <div style={{ background: "var(--surface-2)", borderRadius: "10px", padding: "10px 12px", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "0.9rem", fontWeight: 700, flex: "none" }}>
            {userName.charAt(0)}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userName}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>مدير الحساب</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
              onClick={onClose}
            >
              <span style={{ fontSize: "1rem" }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "4px", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
          <button className="sidebar-link" onClick={onToggleTheme} style={{ textAlign: "right" }}>
            <span>{theme === "dark" ? "☀️" : "🌙"}</span>
            <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
          </button>
          <button className="sidebar-link" onClick={logout} style={{ textAlign: "right", color: "#ef4444" }}>
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-desktop { transform: translateX(100%); }
          .sidebar-desktop { ${mobileOpen ? "transform: translateX(0) !important;" : ""} }
          #sidebar-close { display: flex !important; }
        }
      `}</style>
    </>
  );
}

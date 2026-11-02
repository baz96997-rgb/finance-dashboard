"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadUser } from "@/lib/store";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const user = loadUser();
    if (user) router.replace("/dashboard");
    else router.replace("/login");
  }, [router]);
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💎</div>
        <p style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

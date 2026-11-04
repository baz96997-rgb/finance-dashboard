"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadUser } from "@/lib/store";
import { Suspense } from "react";

function RootRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const phone = searchParams.get("phone");
    if (phone) {
      router.replace(`/wa/${phone}`);
      return;
    }
    const user = loadUser();
    if (user) router.replace("/dashboard");
    else router.replace("/login");
  }, [router, searchParams]);
  return null;
}

export default function RootPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💎</div>
          <p style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
        </div>
      </div>
    }>
      <RootRedirect />
    </Suspense>
  );
}

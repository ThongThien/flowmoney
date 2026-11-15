"use client";

import { useEffect } from "react";
import { ensureRecurringTransactions } from "@/lib/recurring";
import { useAppStore } from "@/stores/useAppStore";

export function AppInitializer() {
  const locale = useAppStore((state) => state.locale);
  const theme = useAppStore((state) => state.theme);
  useEffect(() => {
    const run = () => ensureRecurringTransactions().catch((error) => console.error("Không thể khởi tạo dữ liệu", error));
    const resume = () => { if (document.visibilityState === "visible") void run(); };
    void run(); document.addEventListener("visibilitychange", resume);
    return () => document.removeEventListener("visibilitychange", resume);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.lang = locale; }, [locale, theme]);
  return null;
}

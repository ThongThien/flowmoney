"use client";

import { useEffect } from "react";
import { ensureRecurringTransactions } from "@/lib/recurring";
import { useAppStore } from "@/stores/useAppStore";

export function AppInitializer() {
  const locale = useAppStore((state) => state.locale);
  const theme = useAppStore((state) => state.theme);
  useEffect(() => { ensureRecurringTransactions().catch((error) => console.error("Không thể khởi tạo dữ liệu", error)); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.lang = locale; }, [locale, theme]);
  return null;
}

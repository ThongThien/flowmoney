"use client";

import { useEffect } from "react";
import { ensureRecurringTransactions } from "@/lib/recurring";

export function AppInitializer() {
  useEffect(() => { ensureRecurringTransactions().catch((error) => console.error("Không thể khởi tạo dữ liệu", error)); }, []);
  return null;
}

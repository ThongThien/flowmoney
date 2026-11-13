"use client";

import { useEffect } from "react";
import { initializeDatabase } from "@/lib/db";

export function AppInitializer() {
  useEffect(() => { initializeDatabase().catch((error) => console.error("Không thể khởi tạo dữ liệu", error)); }, []);
  return null;
}

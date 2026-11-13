import type { ReactNode } from "react";
import { AppInitializer } from "@/components/AppInitializer";
import { AppShell } from "@/components/AppShell";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <><AppInitializer /><AppShell>{children}</AppShell></>;
}

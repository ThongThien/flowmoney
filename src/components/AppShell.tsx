"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { useAppStore } from "@/stores/useAppStore";

const nav: Array<{ href: string; en: string; vi: string; icon: IconName }> = [
  { href: "/", en: "Manage", vi: "Quản lý", icon: "home" },
  { href: "/transactions", en: "Activity", vi: "Giao dịch", icon: "swap" },
  { href: "/goals", en: "Goals", vi: "Mục tiêu", icon: "target" },
  { href: "/assets", en: "Items", vi: "Tài sản", icon: "box" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const locale = useAppStore((state) => state.locale);
  return (
    <div className="app-frame">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Personal Finance">
          <span className="brand-mark">P</span><span>{locale === "en" ? "Personal Finance" : "Quản lý tài chính"}</span>
        </Link>
        <div className="topbar-actions">
          <span className="offline-pill">● <span>{locale === "en" ? "On device" : "Trên thiết bị"}</span></span>
          <Link className="icon-button" href="/settings" aria-label={locale === "en" ? "Settings" : "Cài đặt"}><Icon name="settings" /></Link>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <Link className="fab" href="/transactions/new" aria-label="Thêm giao dịch"><Icon name="plus" /></Link>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}>
            <Icon name={item.icon} /><span>{locale === "en" ? item.en : item.vi}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}

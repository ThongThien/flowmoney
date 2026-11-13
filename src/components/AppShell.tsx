"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

const nav: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/", label: "Tổng quan", icon: "home" },
  { href: "/accounts", label: "Tài khoản", icon: "wallet" },
  { href: "/transactions", label: "Giao dịch", icon: "swap" },
  { href: "/goals", label: "Mục tiêu", icon: "target" },
  { href: "/stats", label: "Thống kê", icon: "chart" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-frame">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="FlowMoney - Tổng quan">
          <span className="brand-mark">F</span><span>Flow<span>Money</span></span>
        </Link>
        <div className="topbar-actions">
          <span className="offline-pill">● <span>Offline-first</span></span>
          <Link className="icon-button" href="/settings" aria-label="Cài đặt và sao lưu"><Icon name="settings" /></Link>
        </div>
      </header>
      <main className="app-content">{children}</main>
      <Link className="fab" href="/transactions/new" aria-label="Thêm giao dịch"><Icon name="plus" /></Link>
      <nav className="bottom-nav" aria-label="Điều hướng chính">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}>
            <Icon name={item.icon} /><span>{item.label}</span>
          </Link>;
        })}
      </nav>
    </div>
  );
}

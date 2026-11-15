"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { Icon, type IconName } from "@/components/Icon";
import { useAppStore } from "@/stores/useAppStore";

export default function ManagePage() {
  const en = useAppStore((state) => state.locale) === "en";
  const data = useLiveQuery(async () => ({
    accounts: await db.accounts.where("isHidden").equals(0).count(), debts: await db.debts.count(),
    recurring: await db.recurringRules.where("isActive").equals(1).count(), goals: await db.goals.where("isArchived").equals(0).count(),
    items: await db.possessions.where("isArchived").equals(0).count(),
  }));
  const money = [
    { href: "/accounts", icon: "wallet" as IconName, en: "Accounts", vi: "Tài khoản", detail: data?.accounts ?? 0, tone: "green" },
    { href: "/debts", icon: "debt" as IconName, en: "Debts", vi: "Công nợ", detail: data?.debts ?? 0, tone: "purple" },
    { href: "/recurring", icon: "refresh" as IconName, en: "Recurring payments", vi: "Chi cố định", detail: data?.recurring ?? 0, tone: "blue" },
  ];
  const plans = [
    { href: "/goals", icon: "target" as IconName, en: "Goals", vi: "Mục tiêu", detail: data?.goals ?? 0, tone: "green" },
    { href: "/assets", icon: "box" as IconName, en: "Owned items", vi: "Tài sản đang có", detail: data?.items ?? 0, tone: "purple" },
    { href: "/settings", icon: "settings" as IconName, en: "Settings & backup", vi: "Cài đặt và sao lưu", detail: null, tone: "neutral" },
  ];
  return <div className="page-stack manage-page"><PageHeader eyebrow={en ? "Personal Finance" : "Quản lý tài chính"} title={en ? "Manage" : "Quản lý"} />
    <IosGroup title={en ? "Money" : "Dòng tiền"} items={money} en={en} />
    <IosGroup title={en ? "Plans & app" : "Kế hoạch và ứng dụng"} items={plans} en={en} />
  </div>;
}

function IosGroup({ title, items, en }: { title: string; items: Array<{ href: string; icon: IconName; en: string; vi: string; detail: number | null; tone: string }>; en: boolean }) {
  return <section className="ios-group"><h2>{title}</h2><div>{items.map((item) => <Link href={item.href} className="ios-list-row" key={item.href}><span className={`ios-list-icon ${item.tone}`}><Icon name={item.icon} /></span><strong>{en ? item.en : item.vi}</strong>{item.detail !== null && <small>{item.detail}</small>}<b>›</b></Link>)}</div></section>;
}

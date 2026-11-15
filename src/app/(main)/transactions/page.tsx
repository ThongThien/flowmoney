"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type TransactionRecord, type TransactionType } from "@/lib/db";
import { currentMonthKey, formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SwipeActions } from "@/components/SwipeActions";
import { calculateAccountBalance } from "@/lib/finance";
import { useAppStore } from "@/stores/useAppStore";

export default function TransactionsPage() {
  const data = useLiveQuery(async () => ({ transactions: await db.transactions.orderBy("occurredAt").reverse().toArray(), accounts: await db.accounts.toArray(), categories: await db.categories.toArray() }));
  const [type, setType] = useState<TransactionType | "all">("all");
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
  const en = useAppStore((state) => state.locale) === "en";
  const labels: Record<TransactionType | "all", string> = en ? { all: "All", expense: "Paid", income: "Received", transfer: "Moved" } : { all: "Tất cả", expense: "Chi", income: "Thu", transfer: "Chuyển" };
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.transactions.filter((item) => {
      const category = data.categories.find((c) => c.id === item.categoryId)?.name ?? "Chuyển tiền";
      return (type === "all" || item.type === type) && item.occurredAt.startsWith(month) &&
        (!query || `${category} ${item.note}`.toLowerCase().includes(query.toLowerCase()));
    });
  }, [data, month, query, type]);
  if (!data) return null;
  const accounts = new Map(data.accounts.map((item) => [item.id, item.name]));
  const categories = new Map(data.categories.map((item) => [item.id, item]));
  async function postTransaction(item: TransactionRecord) { const source = data!.accounts.find((account) => account.id === item.accountId); if (item.type !== "income" && source && item.amount > calculateAccountBalance(source, data!.transactions)) { window.alert(en ? `Not enough money in ${source.name}.` : `${source.name} không đủ tiền.`); return; } await db.transactions.update(item.id, { status: "posted", updatedAt: new Date().toISOString() }); }

  return <div className="page-stack">
    <PageHeader eyebrow={en ? "Mirror real money" : "Theo dòng tiền thật"} title={en ? "Activity" : "Giao dịch"} action={{ href: "/transactions/new", label: en ? "Add activity" : "Thêm giao dịch" }} />
    <Link className="recurring-link" href="/recurring"><span>↻</span><div><strong>{en ? "Recurring payments" : "Khoản chi cố định"}</strong><small>{en ? "Create monthly reminders" : "Tạo lịch theo ngày mỗi tháng"}</small></div><b>›</b></Link>
    <section className="filter-panel"><div className="segmented scrollable">{Object.entries(labels).map(([value, label]) => <button key={value} className={type === value ? "active" : ""} onClick={() => setType(value as TransactionType | "all")}>{label}</button>)}</div><div className="filter-row"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><input type="search" placeholder={en ? "Search" : "Tìm kiếm"} value={query} onChange={(event) => setQuery(event.target.value)} /></div></section>
    <section className="content-section"><div className="section-title"><h2>{en ? "History" : "Lịch sử"}</h2><span>{filtered.length}</span></div>
      {filtered.length === 0 ? <EmptyState title="Không có giao dịch">Thử đổi bộ lọc hoặc thêm giao dịch mới.</EmptyState> : <div className="transaction-list detailed">{filtered.map((item) => {
        const category = item.categoryId ? categories.get(item.categoryId) : undefined;
        const destination = item.toAccountId ? accounts.get(item.toAccountId) : undefined;
        return <SwipeActions key={item.id} actions={[
          ...(item.status === "pending" ? [{ label: "Mark done", icon: "✓", tone: "success" as const, onClick: () => { void postTransaction(item); } }] : []),
          { label: "Xóa giao dịch", icon: "⌫", tone: "danger" as const, onClick: () => { if (window.confirm("Xóa giao dịch này?")) void db.transactions.delete(item.id); } },
        ]}><article className="transaction-row">
          <span className="category-icon" style={{ background: `${category?.color ?? "#65717d"}20` }}>{item.type === "transfer" ? "⇄" : category?.icon ?? "•"}</span>
          <div className="transaction-main"><strong>{item.type === "transfer" ? (en ? "Transfer" : "Chuyển tiền") : category?.name ?? (en ? "Uncategorized" : "Không phân loại")} {item.status === "pending" && <em className="pending-badge">{en ? "Pending" : "Chờ"}</em>}</strong><span>{formatDate(item.occurredAt)} · {accounts.get(item.accountId)}{destination ? ` → ${destination}` : ""}{item.note ? ` · ${item.note}` : ""}</span></div>
          <div className="transaction-side"><strong className={item.status === "pending" ? "pending-money" : item.type === "income" ? "income-text" : item.type === "expense" ? "expense-text" : ""}>{item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}{formatMoney(item.amount)}</strong></div>
        </article></SwipeActions>;
      })}</div>}
    </section>
  </div>;
}

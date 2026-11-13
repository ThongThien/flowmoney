"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type TransactionType } from "@/lib/db";
import { currentMonthKey, formatDate, formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const labels: Record<TransactionType | "all", string> = { all: "Tất cả", expense: "Chi", income: "Thu", transfer: "Chuyển" };

export default function TransactionsPage() {
  const data = useLiveQuery(async () => ({ transactions: await db.transactions.orderBy("occurredAt").reverse().toArray(), accounts: await db.accounts.toArray(), categories: await db.categories.toArray() }));
  const [type, setType] = useState<TransactionType | "all">("all");
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
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

  return <div className="page-stack">
    <PageHeader eyebrow="Dòng tiền" title="Giao dịch" description="Lịch sử thu, chi và chuyển tiền của bạn." action={{ href: "/transactions/new", label: "+ Thêm" }} />
    <section className="filter-panel"><div className="segmented scrollable">{Object.entries(labels).map(([value, label]) => <button key={value} className={type === value ? "active" : ""} onClick={() => setType(value as TransactionType | "all")}>{label}</button>)}</div><div className="filter-row"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /><input type="search" placeholder="Tìm ghi chú, danh mục" value={query} onChange={(event) => setQuery(event.target.value)} /></div></section>
    <section className="content-section"><div className="section-title"><h2>Lịch sử</h2><span>{filtered.length} giao dịch</span></div>
      {filtered.length === 0 ? <EmptyState title="Không có giao dịch">Thử đổi bộ lọc hoặc thêm giao dịch mới.</EmptyState> : <div className="transaction-list detailed">{filtered.map((item) => {
        const category = item.categoryId ? categories.get(item.categoryId) : undefined;
        const destination = item.toAccountId ? accounts.get(item.toAccountId) : undefined;
        return <article className="transaction-row" key={item.id}>
          <span className="category-icon" style={{ background: `${category?.color ?? "#65717d"}20` }}>{item.type === "transfer" ? "⇄" : category?.icon ?? "•"}</span>
          <div className="transaction-main"><strong>{item.type === "transfer" ? "Chuyển tiền" : category?.name ?? "Không phân loại"}</strong><span>{formatDate(item.occurredAt)} · {accounts.get(item.accountId)}{destination ? ` → ${destination}` : ""}{item.note ? ` · ${item.note}` : ""}</span></div>
          <div className="transaction-side"><strong className={item.type === "income" ? "income-text" : item.type === "expense" ? "expense-text" : ""}>{item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}{formatMoney(item.amount)}</strong><button aria-label="Xóa giao dịch" onClick={() => { if (window.confirm("Xóa giao dịch này?")) db.transactions.delete(item.id); }}>Xóa</button></div>
        </article>;
      })}</div>}
    </section>
  </div>;
}

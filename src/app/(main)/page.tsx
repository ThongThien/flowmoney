"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { calculateMonthTotals, calculateNetWorth, debtRemaining } from "@/lib/finance";
import { currentMonthKey, formatMoney } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";

export default function DashboardPage() {
  const data = useLiveQuery(async () => ({
    accounts: await db.accounts.toArray(), transactions: await db.transactions.orderBy("occurredAt").reverse().toArray(),
    categories: await db.categories.toArray(), debts: await db.debts.toArray(), payments: await db.debtPayments.toArray(),
  }));
  if (!data) return <DashboardSkeleton />;

  const total = calculateNetWorth(data.accounts, data.transactions);
  const month = calculateMonthTotals(data.transactions, currentMonthKey());
  const categoryMap = new Map(data.categories.map((item) => [item.id, item]));
  const debtReceivable = data.debts.filter((item) => item.direction === "lend")
    .reduce((sum, item) => sum + debtRemaining(item, data.payments), 0);
  const debtPayable = data.debts.filter((item) => item.direction === "borrow")
    .reduce((sum, item) => sum + debtRemaining(item, data.payments), 0);
  const maxFlow = Math.max(month.income, month.expense, 1);

  return <div className="page-stack">
    <section className="balance-hero">
      <span className="kicker">Tổng tài sản</span>
      <h1>{formatMoney(total)}</h1>
      <div className="hero-metrics">
        <div><span className="trend income">↗</span><p>Thu tháng này</p><strong className="income-text">+{formatMoney(month.income)}</strong></div>
        <div><span className="trend expense">↘</span><p>Chi tháng này</p><strong className="expense-text">−{formatMoney(month.expense)}</strong></div>
      </div>
      <div className="flow-chart" aria-label="So sánh thu chi tháng này">
        <div><span>Thu</span><i style={{ width: `${(month.income / maxFlow) * 100}%` }} /></div>
        <div><span>Chi</span><i className="expense-bar" style={{ width: `${(month.expense / maxFlow) * 100}%` }} /></div>
      </div>
    </section>

    <section className="quick-grid">
      <Link href="/accounts" className="quick-card"><span className="quick-icon green"><Icon name="wallet" /></span><div><p>Tài khoản</p><strong>{data.accounts.filter((a) => !a.isHidden).length}</strong></div><Icon name="arrow" className="arrow" /></Link>
      <Link href="/debts" className="quick-card"><span className="quick-icon purple"><Icon name="debt" /></span><div><p>Công nợ ròng</p><strong>{formatMoney(debtReceivable - debtPayable)}</strong></div><Icon name="arrow" className="arrow" /></Link>
    </section>

    <section className="content-section">
      <div className="section-title"><div><span className="kicker">Hoạt động</span><h2>Giao dịch gần đây</h2></div><Link href="/transactions">Xem tất cả</Link></div>
      {data.transactions.length === 0 ? <EmptyState title="Chưa có giao dịch">Nhấn nút + để ghi khoản thu, chi hoặc chuyển tiền đầu tiên.</EmptyState> :
        <div className="transaction-list">{data.transactions.slice(0, 5).map((item) => {
          const category = item.categoryId ? categoryMap.get(item.categoryId) : undefined;
          const account = data.accounts.find((a) => a.id === item.accountId);
          return <div className="transaction-row" key={item.id}>
            <span className="category-icon" style={{ background: `${category?.color ?? "#66717d"}20` }}>{item.type === "transfer" ? "⇄" : category?.icon ?? "•"}</span>
            <div className="transaction-main"><strong>{item.type === "transfer" ? "Chuyển tiền" : category?.name ?? "Không phân loại"}</strong><span>{account?.name}{item.note ? ` · ${item.note}` : ""}</span></div>
            <strong className={item.type === "income" ? "income-text" : item.type === "expense" ? "expense-text" : ""}>{item.type === "income" ? "+" : item.type === "expense" ? "−" : ""}{formatMoney(item.amount)}</strong>
          </div>;
        })}</div>}
    </section>
  </div>;
}

function DashboardSkeleton() {
  return <div className="page-stack"><div className="balance-hero skeleton-block"/><div className="quick-grid"><div className="quick-card skeleton-block"/><div className="quick-card skeleton-block"/></div></div>;
}

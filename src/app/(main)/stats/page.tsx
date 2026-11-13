"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { calculateMonthTotals } from "@/lib/finance";
import { currentMonthKey, formatCompactMoney, formatMoney, monthKey } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function StatsPage() {
  const data = useLiveQuery(async () => ({ transactions: await db.transactions.toArray(), categories: await db.categories.toArray() }));
  const [month, setMonth] = useState(currentMonthKey());
  const analysis = useMemo(() => {
    if (!data) return null;
    const totals = calculateMonthTotals(data.transactions, month);
    const expenses = data.transactions.filter((item) => item.type === "expense" && monthKey(item.occurredAt) === month);
    const categoryTotals = data.categories.filter((item) => item.type === "expense").map((category) => ({ ...category,
      total: expenses.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amount, 0) }))
      .filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
    const base = new Date(`${month}-01T12:00:00`);
    const months = Array.from({ length: 6 }, (_, index) => { const date = new Date(base.getFullYear(), base.getMonth() - (5 - index), 1); const key = monthKey(date); return { key, label: `T${date.getMonth() + 1}`, ...calculateMonthTotals(data.transactions, key) }; });
    return { totals, categoryTotals, months };
  }, [data, month]);
  if (!analysis) return null;
  const maxMonth = Math.max(...analysis.months.flatMap((item) => [item.income, item.expense]), 1);

  return <div className="page-stack"><PageHeader eyebrow="Hiểu dòng tiền" title="Thống kê" description="Nhìn nhanh xu hướng và nơi tiền được sử dụng." />
    <div className="month-control"><button onClick={() => setMonth(shiftMonth(month, -1))}>‹</button><input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /><button onClick={() => setMonth(shiftMonth(month, 1))}>›</button></div>
    <div className="metric-grid"><div className="metric-card"><span>Tổng thu</span><strong className="income-text">{formatMoney(analysis.totals.income)}</strong></div><div className="metric-card"><span>Tổng chi</span><strong className="expense-text">{formatMoney(analysis.totals.expense)}</strong></div></div>
    <section className="content-section"><div className="section-title"><div><span className="kicker">6 tháng</span><h2>Xu hướng thu chi</h2></div><span>Thu / Chi</span></div><div className="bar-chart">{analysis.months.map((item) => <div className="bar-group" key={item.key}><div className="bars"><i className="income-bar" style={{ height: `${Math.max(4, item.income / maxMonth * 100)}%` }} title={`Thu ${formatCompactMoney(item.income)}`} /><i className="expense-bar" style={{ height: `${Math.max(4, item.expense / maxMonth * 100)}%` }} title={`Chi ${formatCompactMoney(item.expense)}`} /></div><span>{item.label}</span></div>)}</div><div className="chart-legend"><span><i className="income-dot"/>Thu</span><span><i className="expense-dot"/>Chi</span></div></section>
    <section className="content-section"><div className="section-title"><div><span className="kicker">Phân bổ</span><h2>Chi theo danh mục</h2></div></div>{analysis.categoryTotals.length === 0 ? <EmptyState title="Chưa có dữ liệu chi">Các khoản chi trong tháng sẽ được phân tích tại đây.</EmptyState> : <div className="category-stats">{analysis.categoryTotals.map((item) => { const percentage = analysis.totals.expense ? item.total / analysis.totals.expense * 100 : 0; return <div key={item.id}><span className="category-icon" style={{ background: `${item.color}20` }}>{item.icon}</span><div><strong>{item.name}</strong><div className="progress"><i style={{ width: `${percentage}%`, background: item.color }} /></div></div><aside><strong>{formatMoney(item.total)}</strong><span>{Math.round(percentage)}%</span></aside></div>; })}</div>}</section>
  </div>;
}

function shiftMonth(value: string, offset: number): string { const date = new Date(`${value}-01T12:00:00`); date.setMonth(date.getMonth() + offset); return monthKey(date); }

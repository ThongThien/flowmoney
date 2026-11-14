"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type AccountRecord, type CategoryRecord } from "@/lib/db";
import { ensureRecurringTransactions } from "@/lib/recurring";
import { formatMoney } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { SwipeActions } from "@/components/SwipeActions";

export default function RecurringPage() {
  const data = useLiveQuery(async () => ({
    rules: await db.recurringRules.orderBy("createdAt").reverse().toArray(),
    accounts: await db.accounts.where("isHidden").equals(0).toArray(),
    categories: await db.categories.where("type").equals("expense").toArray(),
  }));
  const [showForm, setShowForm] = useState(false);
  if (!data) return null;
  const accountNames = new Map(data.accounts.map((item) => [item.id, item.name]));
  const categoryNames = new Map(data.categories.map((item) => [item.id, item.name]));

  return <div className="page-stack">
    <PageHeader eyebrow="Nhắc việc mỗi tháng" title="Khoản chi cố định" description="App tạo khoản chờ đúng ngày; bạn xác nhận sau khi tiền thực sự được trừ." />
    <section className="summary-strip"><div><span>Lịch đang hoạt động</span><strong>{data.rules.filter((item) => item.isActive).length}</strong></div><button className="primary-button compact" onClick={() => setShowForm((value) => !value)}>+ Tạo lịch</button></section>
    {showForm && <RecurringForm accounts={data.accounts} categories={data.categories} onClose={() => setShowForm(false)} />}
    <section className="content-section"><div className="section-title"><h2>Lịch hằng tháng</h2><span>Vuốt trái để thao tác</span></div>
      {data.rules.length === 0 ? <EmptyState icon="↻" title="Chưa có khoản cố định">Thêm tiền nhà, điện, mạng hoặc các khoản định kỳ khác.</EmptyState> : <div className="recurring-list">{data.rules.map((rule) => <SwipeActions key={rule.id} actions={[
        { label: rule.isActive ? "Tạm dừng" : "Bật lại", icon: rule.isActive ? "Ⅱ" : "▶", onClick: () => { void db.recurringRules.update(rule.id, { isActive: rule.isActive ? 0 : 1, updatedAt: new Date().toISOString() }).then(() => ensureRecurringTransactions()); } },
        { label: "Xóa lịch", icon: "⌫", tone: "danger", onClick: () => { if (window.confirm("Xóa lịch này? Giao dịch đã tạo vẫn được giữ lại.")) void db.recurringRules.delete(rule.id); } },
      ]}><article className={`recurring-row ${rule.isActive ? "" : "paused"}`}><span className="recurring-day">{rule.dayOfMonth}<small>hằng tháng</small></span><div><strong>{rule.name}</strong><small>{accountNames.get(rule.accountId)} · {categoryNames.get(rule.categoryId)}</small></div><b>{formatMoney(rule.amount)}</b></article></SwipeActions>)}</div>}
    </section>
  </div>;
}

function RecurringForm({ accounts, categories, onClose }: { accounts: AccountRecord[]; categories: CategoryRecord[]; onClose: () => void }) {
  const [name, setName] = useState(""); const [amount, setAmount] = useState(0); const [day, setDay] = useState(1);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? ""); const [categoryId, setCategoryId] = useState(categories[0]?.id ?? ""); const [note, setNote] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); if (!amount || !accountId || !categoryId) return; const now = new Date().toISOString(); await db.recurringRules.add({ id: crypto.randomUUID(), name: name.trim(), amount, dayOfMonth: day, accountId, categoryId, note: note.trim(), isActive: 1, createdAt: now, updatedAt: now }); await ensureRecurringTransactions(); onClose(); }
  return <form className="form-card" onSubmit={submit}><div className="form-heading"><div><span className="kicker">Tạo một lần</span><h2>Lịch chi hằng tháng</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div>
    <label>Tên khoản chi<input value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: Tiền nhà" required /></label>
    <label>Số tiền<MoneyInput value={amount} onChange={setAmount} /></label>
    <fieldset className="account-picker"><legend>Trừ từ tài khoản</legend>{accounts.map((item) => <button type="button" key={item.id} className={accountId === item.id ? "selected" : ""} onClick={() => setAccountId(item.id)}><i style={{ background: item.color }} /><span>{item.name}</span><small>{item.type === "cash" ? "Tiền mặt" : item.type === "bank" ? "Ngân hàng" : "Ví điện tử"}</small></button>)}</fieldset>
    <fieldset className="category-picker compact-picker"><legend>Danh mục</legend>{categories.map((item) => <button type="button" key={item.id} className={categoryId === item.id ? "selected" : ""} onClick={() => setCategoryId(item.id)}><span style={{ background: `${item.color}20` }}>{item.icon}</span>{item.name}</button>)}</fieldset>
    <div className="two-columns"><label>Ngày tạo khoản chờ mỗi tháng<input type="number" min="1" max="31" inputMode="numeric" value={day} onChange={(event) => setDay(Math.min(31, Math.max(1, Number(event.target.value))))} /></label><label>Ghi chú<input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Không bắt buộc" /></label></div>
    <p className="form-note">Nếu tháng không có ngày đã chọn, lịch dùng ngày cuối tháng. Khoản này chỉ trừ số dư sau khi bạn đánh dấu đã thực hiện.</p>
    <button className="primary-button" disabled={!name.trim() || !amount || !accountId || !categoryId}>Tạo lịch</button>
  </form>;
}

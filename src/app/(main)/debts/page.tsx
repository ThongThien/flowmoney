"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type DebtDirection, type DebtRecord } from "@/lib/db";
import { debtRemaining } from "@/lib/finance";
import { formatDate, formatMoney, localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function DebtsPage() {
  const data = useLiveQuery(async () => ({ debts: await db.debts.orderBy("createdAt").reverse().toArray(), payments: await db.debtPayments.toArray() }));
  const [showForm, setShowForm] = useState(false);
  const [paying, setPaying] = useState<DebtRecord | null>(null);
  if (!data) return null;
  const receivable = data.debts.filter((d) => d.direction === "lend").reduce((sum, d) => sum + debtRemaining(d, data.payments), 0);
  const payable = data.debts.filter((d) => d.direction === "borrow").reduce((sum, d) => sum + debtRemaining(d, data.payments), 0);

  return <div className="page-stack">
    <PageHeader eyebrow="Theo dõi nghĩa vụ" title="Công nợ" description="Khoản phải thu và phải trả được theo dõi độc lập với giao dịch." />
    <div className="metric-grid"><div className="metric-card"><span>Phải thu</span><strong className="income-text">{formatMoney(receivable)}</strong></div><div className="metric-card"><span>Phải trả</span><strong className="expense-text">{formatMoney(payable)}</strong></div></div>
    <button className="primary-button" onClick={() => setShowForm((value) => !value)}>+ Thêm khoản công nợ</button>
    {showForm && <DebtForm onClose={() => setShowForm(false)} />}
    {paying && <PaymentForm debt={paying} remaining={debtRemaining(paying, data.payments)} onClose={() => setPaying(null)} />}
    <section className="content-section"><div className="section-title"><h2>Danh sách công nợ</h2><span>{data.debts.length} khoản</span></div>
      {data.debts.length === 0 ? <EmptyState icon="↔" title="Chưa có công nợ">Thêm khoản cho vay hoặc đi vay để bắt đầu theo dõi.</EmptyState> : <div className="debt-list">{data.debts.map((debt) => {
        const remaining = debtRemaining(debt, data.payments); const progress = Math.min(100, ((debt.originalAmount - remaining) / debt.originalAmount) * 100);
        return <article className="debt-card" key={debt.id}><div className="debt-head"><span className={`direction-tag ${debt.direction}`}>{debt.direction === "lend" ? "Cho vay" : "Đi vay"}</span>{debt.dueDate && <span>Hạn {formatDate(debt.dueDate)}</span>}</div><h3>{debt.person}</h3><strong>{formatMoney(remaining)}</strong><p>Còn lại trên {formatMoney(debt.originalAmount)}</p><div className="progress"><i style={{ width: `${progress}%` }} /></div>{remaining > 0 && <button className="secondary-button" onClick={() => setPaying(debt)}>Ghi nhận trả nợ</button>}</article>;
      })}</div>}
    </section>
  </div>;
}

function DebtForm({ onClose }: { onClose: () => void }) {
  const [direction, setDirection] = useState<DebtDirection>("lend"); const [person, setPerson] = useState("");
  const [amount, setAmount] = useState(0); const [dueDate, setDueDate] = useState(""); const [note, setNote] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); const now = new Date().toISOString(); await db.debts.add({ id: crypto.randomUUID(), direction, person: person.trim(), originalAmount: amount, dueDate: dueDate || undefined, note: note.trim(), createdAt: now, updatedAt: now }); onClose(); }
  return <form className="form-card" onSubmit={submit}><div className="form-heading"><h2>Khoản công nợ mới</h2><button type="button" className="close-button" onClick={onClose}>×</button></div><div className="segmented"><button type="button" className={direction === "lend" ? "active" : ""} onClick={() => setDirection("lend")}>Tôi cho vay</button><button type="button" className={direction === "borrow" ? "active" : ""} onClick={() => setDirection("borrow")}>Tôi đi vay</button></div><label>Người liên quan<input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="Tên người hoặc tổ chức" required /></label><label>Số tiền<MoneyInput value={amount} onChange={setAmount} /></label><label>Ngày đến hạn<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label><label>Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} /></label><button className="primary-button" disabled={!amount}>Lưu công nợ</button></form>;
}

function PaymentForm({ debt, remaining, onClose }: { debt: DebtRecord; remaining: number; onClose: () => void }) {
  const [amount, setAmount] = useState(remaining); const [date, setDate] = useState(localDateInput());
  async function submit(event: FormEvent) { event.preventDefault(); await db.debtPayments.add({ id: crypto.randomUUID(), debtId: debt.id, amount: Math.min(amount, remaining), paidAt: new Date(`${date}T12:00:00`).toISOString(), note: "" }); onClose(); }
  return <form className="form-card accent-form" onSubmit={submit}><div className="form-heading"><div><span className="kicker">Trả nợ</span><h2>{debt.person}</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div><label>Số tiền<MoneyInput value={amount} onChange={setAmount} /></label><label>Ngày thanh toán<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><button className="primary-button" disabled={!amount}>Xác nhận</button></form>;
}

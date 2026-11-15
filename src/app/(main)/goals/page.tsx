"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type AccountRecord, type GoalKind, type GoalRecord, type TransactionRecord } from "@/lib/db";
import { calculateAccountBalance, goalSaved } from "@/lib/finance";
import { formatDate, formatMoney, localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { SwipeActions } from "@/components/SwipeActions";
import { useAppStore } from "@/stores/useAppStore";

const goalColors = ["#25d8a3", "#46a6ff", "#b58cff", "#ff9d66"];

export default function GoalsPage() {
  const data = useLiveQuery(async () => ({ goals: await db.goals.orderBy("createdAt").reverse().toArray(), contributions: await db.goalContributions.toArray(), accounts: await db.accounts.where("isHidden").equals(0).toArray(), transactions: await db.transactions.toArray() }));
  const [showForm, setShowForm] = useState(false); const [contributing, setContributing] = useState<GoalRecord | null>(null); const [showArchived, setShowArchived] = useState(false);
  const en = useAppStore((state) => state.locale) === "en";
  if (!data) return null;
  const goals = data.goals.filter((item) => Boolean(item.isArchived) === showArchived);
  const savedTotal = data.goals.filter((item) => !item.isArchived).reduce((sum, goal) => sum + goalSaved(goal, data.contributions), 0);
  async function remove(goal: GoalRecord) { if (!window.confirm(en ? `Delete “${goal.name}”? Existing account activity stays unchanged.` : `Xóa “${goal.name}”? Dòng tiền đã ghi vẫn được giữ.`)) return; await db.transaction("rw", db.goals, db.goalContributions, async () => { await db.goalContributions.where("goalId").equals(goal.id).delete(); await db.goals.delete(goal.id); }); }
  return <div className="page-stack"><PageHeader eyebrow={en ? "Build progress" : "Theo dõi tiến độ"} title={en ? "Goals" : "Mục tiêu"} />
    <section className="summary-strip"><div><span>{en ? "Allocated" : "Đã phân bổ"}</span><strong>{formatMoney(savedTotal)}</strong></div><button className="round-add" aria-label="Add goal" onClick={() => setShowForm(true)}>+</button></section>
    <div className="segmented compact-tabs"><button className={!showArchived ? "active" : ""} onClick={() => setShowArchived(false)}>{en ? "Active" : "Đang theo dõi"}</button><button className={showArchived ? "active" : ""} onClick={() => setShowArchived(true)}>{en ? "Archived" : "Đã lưu trữ"}</button></div>
    {showForm && <Modal title="New goal" onClose={() => setShowForm(false)}><GoalForm onClose={() => setShowForm(false)} en={en} /></Modal>}
    {contributing && <Modal title="Contribute" onClose={() => setContributing(null)}><ContributionForm goal={contributing} accounts={data.accounts} transactions={data.transactions} saved={goalSaved(contributing, data.contributions)} onClose={() => setContributing(null)} en={en} /></Modal>}
    <section className="content-section compact-section">{goals.length === 0 ? <EmptyState icon="◎" title={en ? "Nothing here" : "Chưa có mục tiêu"}>{en ? "Tap + to start tracking one." : "Nhấn + để tạo mục tiêu."}</EmptyState> : <div className="goal-grid">{goals.map((goal) => {
      const saved = goalSaved(goal, data.contributions); const progress = Math.min(100, saved / goal.targetAmount * 100);
      return <SwipeActions key={goal.id} actions={[{ label: goal.isArchived ? "Restore" : "Archive", icon: "▣", onClick: () => { void db.goals.update(goal.id, { isArchived: goal.isArchived ? 0 : 1, updatedAt: new Date().toISOString() }); } }, { label: "Delete", icon: "⌫", tone: "danger", onClick: () => { void remove(goal); } }]}><article className="goal-card" style={{ "--goal-color": goal.color } as React.CSSProperties}><div className="goal-top"><span>{goal.icon}</span><i>{Math.round(progress)}%</i></div><h3>{goal.name}</h3><strong>{formatMoney(saved)}</strong><p>{en ? "of" : "trên"} {formatMoney(goal.targetAmount)}{goal.deadline ? ` · ${formatDate(goal.deadline)}` : ""}</p><div className="progress goal-progress"><i style={{ width: `${progress}%` }} /></div>{!goal.isArchived && <button className="icon-action goal-add" aria-label="Contribute" onClick={() => setContributing(goal)}>+</button>}</article></SwipeActions>;
    })}</div>}</section>
  </div>;
}

function GoalForm({ onClose, en }: { onClose: () => void; en: boolean }) {
  const [name, setName] = useState(""); const [target, setTarget] = useState(0); const [deadline, setDeadline] = useState(""); const [icon, setIcon] = useState("🎯"); const [color, setColor] = useState(goalColors[0]); const [kind, setKind] = useState<GoalKind>("savings");
  const presets = [{ name: "Emergency fund", icon: "🛟", kind: "savings" as const }, { name: "100 million", icon: "🏁", kind: "milestone" as const, target: 100_000_000 }, { name: "Travel", icon: "✈️", kind: "savings" as const }];
  async function submit(event: FormEvent) { event.preventDefault(); const now = new Date().toISOString(); await db.goals.add({ id: crypto.randomUUID(), name: name.trim(), kind, targetAmount: target, deadline: deadline || undefined, icon, color, isArchived: 0, createdAt: now, updatedAt: now }); onClose(); }
  return <form className="modal-form" onSubmit={submit}><div className="form-heading"><h2>{en ? "New goal" : "Mục tiêu mới"}</h2></div><fieldset className="preset-picker"><legend>{en ? "Quick start" : "Chọn nhanh"}</legend>{presets.map((item) => <button type="button" key={item.name} onClick={() => { setName(item.name); setIcon(item.icon); setKind(item.kind); if (item.target) setTarget(item.target); }}>{item.icon} {item.name}</button>)}</fieldset><label>{en ? "Name" : "Tên"}<input value={name} onChange={(e) => setName(e.target.value)} required /></label><label>{en ? "Target" : "Số tiền cần đạt"}<MoneyInput value={target} onChange={setTarget} /></label><details className="optional-fields"><summary>{en ? "More options" : "Thêm tùy chọn"}</summary><label>{en ? "Deadline" : "Thời hạn"}<input type="date" min={localDateInput()} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><div className="two-columns"><label>Icon<select value={icon} onChange={(e) => setIcon(e.target.value)}>{["🎯","🛟","🏁","🏡","✈️","💻"].map((item) => <option key={item}>{item}</option>)}</select></label><fieldset className="color-picker"><legend>Color</legend>{goalColors.map((item) => <button type="button" key={item} className={color === item ? "selected" : ""} onClick={() => setColor(item)} style={{ background: item }} />)}</fieldset></div></details><button className="primary-button" disabled={!target || !name.trim()}>{en ? "Save" : "Lưu"}</button></form>;
}

function ContributionForm({ goal, accounts, transactions, saved, onClose, en }: { goal: GoalRecord; accounts: AccountRecord[]; transactions: TransactionRecord[]; saved: number; onClose: () => void; en: boolean }) {
  const [amount, setAmount] = useState(0); const [accountId, setAccountId] = useState(accounts[0]?.id ?? ""); const [error, setError] = useState(""); const remaining = Math.max(0, goal.targetAmount - saved); const account = accounts.find((item) => item.id === accountId); const balance = account ? calculateAccountBalance(account, transactions) : 0;
  async function submit(event: FormEvent) { event.preventDefault(); if (!account || amount <= 0 || amount > balance || amount > remaining) { setError(en ? "Amount must fit both the account balance and remaining target." : "Số góp không được vượt số dư tài khoản hoặc phần mục tiêu còn thiếu."); return; } const now = new Date().toISOString(); const transactionId = crypto.randomUUID(); await db.transaction("rw", db.goalContributions, db.transactions, async () => { await db.transactions.add({ id: transactionId, type: "expense", status: "posted", amount, accountId, categoryId: "expense-goal", note: goal.name, occurredAt: now, createdAt: now, updatedAt: now }); await db.goalContributions.add({ id: crypto.randomUUID(), goalId: goal.id, accountId, transactionId, amount, contributedAt: now, note: "" }); }); onClose(); }
  return <form className="modal-form" onSubmit={submit}><div className="form-heading"><div><span className="kicker">{en ? "Contribute" : "Đóng góp"}</span><h2>{goal.name}</h2></div></div><label>{en ? "Amount" : "Số tiền"}<MoneyInput value={amount} onChange={(value) => { setAmount(value); setError(""); }} /></label><fieldset className="account-picker"><legend>{en ? "From account" : "Trừ từ tài khoản"}</legend>{accounts.map((item) => { const itemBalance = calculateAccountBalance(item, transactions); return <button type="button" key={item.id} className={accountId === item.id ? "selected" : ""} onClick={() => { setAccountId(item.id); setError(""); }}><i style={{ background: item.color }} /><span>{item.name}</span><small>{formatMoney(itemBalance)}</small></button>; })}</fieldset><div className="limit-row"><span>{en ? "Available" : "Có thể dùng"}: <b>{formatMoney(balance)}</b></span><span>{en ? "Goal left" : "Còn thiếu"}: <b>{formatMoney(remaining)}</b></span></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={!amount || !accountId}>{en ? "Confirm" : "Xác nhận"}</button></form>;
}

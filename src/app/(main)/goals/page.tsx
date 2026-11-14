"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type GoalKind, type GoalRecord } from "@/lib/db";
import { goalSaved } from "@/lib/finance";
import { formatDate, formatMoney, localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

const goalColors = ["#25d8a3", "#46a6ff", "#b58cff", "#ff9d66"];

export default function GoalsPage() {
  const data = useLiveQuery(async () => ({ goals: await db.goals.orderBy("createdAt").reverse().toArray(), contributions: await db.goalContributions.toArray() }));
  const [showForm, setShowForm] = useState(false); const [contributing, setContributing] = useState<GoalRecord | null>(null);
  if (!data) return null;
  const savedTotal = data.goals.reduce((sum, goal) => sum + goalSaved(goal, data.contributions), 0);

  return <div className="page-stack"><PageHeader eyebrow="Kế hoạch tương lai" title="Mục tiêu" description="Chia mục tiêu lớn thành những lần đóng góp nhỏ." />
    <section className="summary-strip"><div><span>Đã tích lũy</span><strong>{formatMoney(savedTotal)}</strong></div><button className="primary-button compact" onClick={() => setShowForm((value) => !value)}>+ Mục tiêu</button></section>
    {showForm && <GoalForm onClose={() => setShowForm(false)} />}{contributing && <ContributionForm goal={contributing} onClose={() => setContributing(null)} />}
    <section className="content-section"><div className="section-title"><h2>Mục tiêu của bạn</h2><span>{data.goals.length} mục tiêu</span></div>
      {data.goals.length === 0 ? <EmptyState icon="◎" title="Chưa có mục tiêu">Tạo mục tiêu tiết kiệm đầu tiên và ghi nhận từng lần đóng góp.</EmptyState> : <div className="goal-grid">{data.goals.map((goal) => {
        const saved = goalSaved(goal, data.contributions); const progress = Math.min(100, (saved / goal.targetAmount) * 100);
        return <article className="goal-card" key={goal.id} style={{ "--goal-color": goal.color } as React.CSSProperties}><div className="goal-top"><span>{goal.icon}</span><i>{goal.kind === "milestone" ? "CHẠM MỐC" : `${Math.round(progress)}%`}</i></div><h3>{goal.name}</h3><strong>{formatMoney(saved)}</strong><p>trên {formatMoney(goal.targetAmount)}{goal.deadline ? ` · ${formatDate(goal.deadline)}` : ""}</p><div className="progress"><i style={{ width: `${progress}%` }} /></div><button className="secondary-button" onClick={() => setContributing(goal)}>{progress >= 100 ? "Đóng góp thêm" : "+ Góp tiền"}</button></article>;
      })}</div>}
    </section>
  </div>;
}

function GoalForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState(""); const [target, setTarget] = useState(0); const [deadline, setDeadline] = useState(""); const [icon, setIcon] = useState("🎯"); const [color, setColor] = useState(goalColors[0]); const [kind, setKind] = useState<GoalKind>("savings");
  const presets = [{ name: "Quỹ dự phòng", icon: "🛟", kind: "savings" as const }, { name: "Chạm mốc 100 triệu", icon: "🏁", kind: "milestone" as const, target: 100_000_000 }, { name: "Du lịch", icon: "✈️", kind: "savings" as const }, { name: "Mua sắm", icon: "💻", kind: "savings" as const }];
  async function submit(event: FormEvent) { event.preventDefault(); const now = new Date().toISOString(); await db.goals.add({ id: crypto.randomUUID(), name: name.trim(), kind, targetAmount: target, deadline: deadline || undefined, icon, color, createdAt: now, updatedAt: now }); onClose(); }
  return <form className="form-card" onSubmit={submit}><div className="form-heading"><h2>Mục tiêu mới</h2><button type="button" className="close-button" onClick={onClose}>×</button></div><fieldset className="preset-picker"><legend>Chọn nhanh</legend>{presets.map((item) => <button type="button" key={item.name} onClick={() => { setName(item.name); setIcon(item.icon); setKind(item.kind); if (item.target) setTarget(item.target); }}>{item.icon} {item.name}</button>)}</fieldset><div className="segmented"><button type="button" className={kind === "savings" ? "active" : ""} onClick={() => setKind("savings")}>Tiết kiệm</button><button type="button" className={kind === "milestone" ? "active" : ""} onClick={() => setKind("milestone")}>Chạm mốc tiền</button></div><label>Tên mục tiêu<input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Quỹ dự phòng" required /></label><label>Số tiền cần đạt<MoneyInput value={target} onChange={setTarget} /></label><details className="optional-fields"><summary>Thời hạn và giao diện <span>không bắt buộc</span></summary><label>Ngày dự kiến<input type="date" min={localDateInput()} value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label><div className="two-columns"><label>Biểu tượng<select value={icon} onChange={(e) => setIcon(e.target.value)}>{["🎯","🛟","🏁","🏡","✈️","💻","🚗","📚"].map((item) => <option key={item}>{item}</option>)}</select></label><fieldset className="color-picker"><legend>Màu</legend>{goalColors.map((item) => <button type="button" key={item} className={color === item ? "selected" : ""} onClick={() => setColor(item)} style={{ background: item }} />)}</fieldset></div></details><button className="primary-button" disabled={!target || !name.trim()}>Tạo mục tiêu</button></form>;
}

function ContributionForm({ goal, onClose }: { goal: GoalRecord; onClose: () => void }) {
  const [amount, setAmount] = useState(0); const [date, setDate] = useState(localDateInput()); const [note, setNote] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); await db.goalContributions.add({ id: crypto.randomUUID(), goalId: goal.id, amount, contributedAt: new Date(`${date}T12:00:00`).toISOString(), note: note.trim() }); onClose(); }
  return <form className="form-card accent-form" onSubmit={submit}><div className="form-heading"><div><span className="kicker">Đóng góp</span><h2>{goal.name}</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div><label>Số tiền<MoneyInput value={amount} onChange={setAmount} /></label><label>Ngày<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><label>Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} /></label><button className="primary-button" disabled={!amount}>Ghi nhận đóng góp</button></form>;
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type AccountRecord, type AccountType } from "@/lib/db";
import { calculateAccountBalance } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { SwipeActions } from "@/components/SwipeActions";

const typeLabels: Record<AccountType, string> = { cash: "Tiền mặt", bank: "Ngân hàng", ewallet: "Ví điện tử" };
const colors = ["#25d8a3", "#46a6ff", "#b58cff", "#ff9d66", "#ff6f91"];

export default function AccountsPage() {
  const data = useLiveQuery(async () => ({ accounts: await db.accounts.toArray(), transactions: await db.transactions.toArray() }));
  const [editing, setEditing] = useState<AccountRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  if (!data) return null;
  const active = data.accounts.filter((item) => !item.isHidden);
  const hidden = data.accounts.filter((item) => item.isHidden);
  const total = active.reduce((sum, item) => sum + calculateAccountBalance(item, data.transactions), 0);

  return <div className="page-stack">
    <PageHeader eyebrow="Nơi giữ tiền" title="Tài khoản" description="Theo dõi tiền mặt, ngân hàng và ví điện tử." />
    <section className="summary-strip"><div><span>Tổng số dư</span><strong>{formatMoney(total)}</strong></div><button className="primary-button compact" onClick={() => { setEditing(null); setShowForm(true); }}>+ Thêm tài khoản</button></section>

    {(showForm || editing) && <AccountForm account={editing} onClose={() => { setShowForm(false); setEditing(null); }} />}

    <section className="content-section">
      <div className="section-title"><h2>Đang sử dụng</h2><span>{active.length} tài khoản</span></div>
      <div className="account-list">{active.map((account) => <SwipeActions key={account.id} actions={[
        { label: "Chỉnh sửa tài khoản", icon: "✎", onClick: () => setEditing(account) },
        { label: "Ẩn tài khoản", icon: "◌", tone: "danger", onClick: () => { void db.accounts.update(account.id, { isHidden: 1, updatedAt: new Date().toISOString() }); } },
      ]}><article className="account-card" style={{ "--account-color": account.color } as React.CSSProperties}>
        <div className="account-card-top"><span className="account-symbol"><Icon name="wallet" /></span><span className="account-type">{typeLabels[account.type]}</span></div>
        <div><h3>{account.name}</h3><strong>{formatMoney(calculateAccountBalance(account, data.transactions))}</strong></div>
        <small className="swipe-hint">Vuốt sang trái để thao tác</small>
      </article></SwipeActions>)}</div>
    </section>

    <Link className="wide-link" href="/debts"><span className="quick-icon purple"><Icon name="debt" /></span><div><strong>Quản lý công nợ</strong><p>Theo dõi khoản cho vay, đi vay và trả nợ.</p></div><Icon name="arrow" /></Link>

    {hidden.length > 0 && <section className="content-section muted-section"><div className="section-title"><h2>Đã ẩn</h2></div>{hidden.map((account) => <div className="simple-row" key={account.id}><span>{account.name}</span><button onClick={() => db.accounts.update(account.id, { isHidden: 0, updatedAt: new Date().toISOString() })}>Hiện lại</button></div>)}</section>}
  </div>;
}

function AccountForm({ account, onClose }: { account: AccountRecord | null; onClose: () => void }) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "cash");
  const [openingBalance, setOpeningBalance] = useState(account?.openingBalance ?? 0);
  const [color, setColor] = useState(account?.color ?? colors[0]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    if (account) await db.accounts.update(account.id, { name: name.trim(), type, openingBalance, color, updatedAt: now });
    else await db.accounts.add({ id: crypto.randomUUID(), name: name.trim(), type, openingBalance, color, isHidden: 0, createdAt: now, updatedAt: now });
    onClose();
  }

  return <form className="form-card" onSubmit={submit}>
    <div className="form-heading"><div><span className="kicker">{account ? "Cập nhật" : "Tạo mới"}</span><h2>{account ? account.name : "Tài khoản mới"}</h2></div><button type="button" className="close-button" onClick={onClose}>×</button></div>
    <label>Tên tài khoản<input value={name} onChange={(event) => setName(event.target.value)} placeholder="VD: Vietcombank" required /></label>
    <label>Loại tài khoản<select value={type} onChange={(event) => setType(event.target.value as AccountType)}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    <label>Số dư ban đầu<MoneyInput id="opening-balance" value={openingBalance} onChange={setOpeningBalance} required={false} /></label>
    <fieldset className="color-picker"><legend>Màu nhận diện</legend>{colors.map((item) => <button type="button" key={item} onClick={() => setColor(item)} className={color === item ? "selected" : ""} style={{ background: item }} aria-label={`Chọn màu ${item}`} />)}</fieldset>
    <button className="primary-button" type="submit">{account ? "Lưu thay đổi" : "Tạo tài khoản"}</button>
  </form>;
}

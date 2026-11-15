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
import { Modal } from "@/components/Modal";
import { useAppStore } from "@/stores/useAppStore";

const colors = ["#25d8a3", "#46a6ff", "#b58cff", "#ff9d66", "#ff6f91"];

export default function AccountsPage() {
  const data = useLiveQuery(async () => ({ accounts: await db.accounts.toArray(), transactions: await db.transactions.toArray() }));
  const [editing, setEditing] = useState<AccountRecord | null>(null);
  const [addingBalance, setAddingBalance] = useState<AccountRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const en = useAppStore((state) => state.locale) === "en";
  if (!data) return null;
  const active = data.accounts.filter((item) => !item.isHidden);
  const hidden = data.accounts.filter((item) => item.isHidden);
  const total = active.reduce((sum, item) => sum + calculateAccountBalance(item, data.transactions), 0);

  return <div className="page-stack">
    <PageHeader eyebrow={en ? "Your money" : "Tiền của bạn"} title={en ? "Accounts" : "Tài khoản"} />
    <section className="summary-strip"><div><span>{en ? "Total balance" : "Tổng số dư"}</span><strong>{formatMoney(total)}</strong></div><button className="round-add" aria-label="Add account" onClick={() => { setEditing(null); setShowForm(true); }}>+</button></section>

    {(showForm || editing) && <Modal title="Account" onClose={() => { setShowForm(false); setEditing(null); }}><AccountForm account={editing} onClose={() => { setShowForm(false); setEditing(null); }} en={en} /></Modal>}
    {addingBalance && <Modal title="Add balance" onClose={() => setAddingBalance(null)}><DirectBalanceForm account={addingBalance} currentBalance={calculateAccountBalance(addingBalance, data.transactions)} onClose={() => setAddingBalance(null)} en={en} /></Modal>}

    <section className="content-section">
      <div className="section-title"><h2>{en ? "Available" : "Đang sử dụng"}</h2><span>{active.length}</span></div>
      <div className="account-list">{active.map((account) => <SwipeActions key={account.id} actions={[
        { label: "Chỉnh sửa tài khoản", icon: "✎", onClick: () => setEditing(account) },
        { label: "Ẩn tài khoản", icon: "◌", tone: "danger", onClick: () => { void db.accounts.update(account.id, { isHidden: 1, updatedAt: new Date().toISOString() }); } },
      ]}><article className="account-card" style={{ "--account-color": account.color } as React.CSSProperties}>
        <span className="account-wordmark">{accountBrand(account.name, account.type)}</span><div className="account-card-top"><span className="account-symbol"><Icon name="wallet" /></span><span className="account-type">{typeLabel(account.type, en)}</span></div>
        <div><h3>{account.name}</h3><strong>{formatMoney(calculateAccountBalance(account, data.transactions))}</strong></div><button className="account-quick-add" aria-label={en ? `Add balance to ${account.name}` : `Cộng số dư vào ${account.name}`} onClick={() => setAddingBalance(account)}>+</button>
      </article></SwipeActions>)}</div>
    </section>

    <Link className="wide-link" href="/debts"><span className="quick-icon purple"><Icon name="debt" /></span><div><strong>{en ? "Debts" : "Quản lý công nợ"}</strong><p>{en ? "Track money lent and borrowed." : "Theo dõi khoản cho vay, đi vay và trả nợ."}</p></div><Icon name="arrow" /></Link>

    {hidden.length > 0 && <section className="content-section muted-section"><div className="section-title"><h2>Đã ẩn</h2></div>{hidden.map((account) => <div className="simple-row" key={account.id}><span>{account.name}</span><button onClick={() => db.accounts.update(account.id, { isHidden: 0, updatedAt: new Date().toISOString() })}>Hiện lại</button></div>)}</section>}
  </div>;
}

function DirectBalanceForm({ account, currentBalance, onClose, en }: { account: AccountRecord; currentBalance: number; onClose: () => void; en: boolean }) {
  const [amount, setAmount] = useState(0);
  async function submit(event: FormEvent) { event.preventDefault(); if (amount <= 0) return; await db.accounts.update(account.id, { openingBalance: account.openingBalance + amount, updatedAt: new Date().toISOString() }); onClose(); }
  return <form className="modal-form" onSubmit={submit}><span className="kicker">{en ? "Direct adjustment" : "Điều chỉnh trực tiếp"}</span><h2>{account.name}</h2><label>{en ? "Amount to add" : "Số tiền cộng thêm"}<MoneyInput value={amount} onChange={setAmount} /></label><div className="balance-preview"><span>{en ? "Current" : "Hiện tại"}<b>{formatMoney(currentBalance)}</b></span><i>→</i><span>{en ? "After" : "Sau khi cộng"}<b>{formatMoney(currentBalance + amount)}</b></span></div><p className="form-note">{en ? "This changes the account balance directly and creates no activity record." : "Thao tác này đổi số dư trực tiếp và không tạo giao dịch."}</p><button className="primary-button" disabled={!amount}>{en ? "Add balance" : "Cộng số dư"}</button></form>;
}

function AccountForm({ account, onClose, en }: { account: AccountRecord | null; onClose: () => void; en: boolean }) {
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

  return <form className="modal-form" onSubmit={submit}>
    <div className="form-heading"><div><span className="kicker">{account ? (en ? "Update" : "Cập nhật") : (en ? "Create" : "Tạo mới")}</span><h2>{account ? account.name : (en ? "New account" : "Tài khoản mới")}</h2></div></div>
    <label>{en ? "Account name" : "Tên tài khoản"}<input value={name} onChange={(event) => setName(event.target.value)} placeholder="MBBank, MoMo…" required /></label>
    <label>{en ? "Account type" : "Loại tài khoản"}<select value={type} onChange={(event) => setType(event.target.value as AccountType)}>{(["cash","bank","ewallet"] as AccountType[]).map((value) => <option value={value} key={value}>{typeLabel(value, en)}</option>)}</select></label>
    <label>{en ? "Opening balance" : "Số dư ban đầu"}<MoneyInput id="opening-balance" value={openingBalance} onChange={setOpeningBalance} required={false} /></label>
    <fieldset className="color-picker"><legend>Màu nhận diện</legend>{colors.map((item) => <button type="button" key={item} onClick={() => setColor(item)} className={color === item ? "selected" : ""} style={{ background: item }} aria-label={`Chọn màu ${item}`} />)}</fieldset>
    <button className="primary-button" type="submit">{en ? "Save" : "Lưu"}</button>
  </form>;
}

function typeLabel(type: AccountType, en: boolean): string { return en ? ({ cash: "Cash", bank: "Bank", ewallet: "E-wallet" }[type]) : ({ cash: "Tiền mặt", bank: "Ngân hàng", ewallet: "Ví điện tử" }[type]); }

function accountBrand(name: string, type: AccountType): string {
  const value = name.toLowerCase();
  if (value.includes("mb") || value.includes("military")) return "MBBANK";
  if (value.includes("momo")) return "MoMo";
  if (value.includes("vietcom")) return "VCB";
  if (value.includes("techcom")) return "TCB";
  if (value.includes("bidv")) return "BIDV";
  if (type === "cash") return "CASH";
  return name.replace(/\s+/g, "").slice(0, 10).toUpperCase();
}

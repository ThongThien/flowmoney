"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type TransactionType } from "@/lib/db";
import { localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";

export default function NewTransactionPage() {
  const router = useRouter();
  const data = useLiveQuery(async () => ({ accounts: await db.accounts.where("isHidden").equals(0).toArray(), categories: await db.categories.toArray() }));
  const [type, setType] = useState<TransactionType>("expense"); const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(""); const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState(""); const [date, setDate] = useState(localDateInput()); const [note, setNote] = useState("");
  const categories = useMemo(() => data?.categories.filter((item) => item.type === type) ?? [], [data, type]);
  const selectedAccountId = accountId || data?.accounts[0]?.id || "";
  const selectedCategoryId = categoryId || categories[0]?.id || "";

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!amount || !selectedAccountId || (type === "transfer" && (!toAccountId || toAccountId === selectedAccountId))) return;
    const now = new Date().toISOString();
    await db.transactions.add({ id: crypto.randomUUID(), type, amount, accountId: selectedAccountId,
      toAccountId: type === "transfer" ? toAccountId : undefined, categoryId: type === "transfer" ? undefined : selectedCategoryId,
      note: note.trim(), occurredAt: new Date(`${date}T12:00:00`).toISOString(), createdAt: now, updatedAt: now });
    router.push("/transactions");
  }

  return <div className="page-stack narrow-page">
    <PageHeader eyebrow="Ghi nhanh" title="Thêm giao dịch" description="Chỉ giữ lại những trường thật sự cần thiết." />
    <form className="transaction-form" onSubmit={submit}>
      <div className="segmented transaction-type"><button type="button" className={type === "expense" ? "active expense-active" : ""} onClick={() => { setType("expense"); setCategoryId(""); }}>Khoản chi</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => { setType("income"); setCategoryId(""); }}>Khoản thu</button><button type="button" className={type === "transfer" ? "active" : ""} onClick={() => setType("transfer")}>Chuyển tiền</button></div>
      <div className="amount-stage"><span>Số tiền</span><MoneyInput value={amount} onChange={setAmount} /></div>
      <div className="form-card flat">
        <label>{type === "transfer" ? "Từ tài khoản" : "Tài khoản"}<select value={selectedAccountId} onChange={(e) => setAccountId(e.target.value)} required>{data?.accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        {type === "transfer" ? <label>Đến tài khoản<select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} required><option value="">Chọn tài khoản nhận</option>{data?.accounts.filter((item) => item.id !== selectedAccountId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label> : <fieldset className="category-picker"><legend>Danh mục</legend>{categories.map((item) => <button type="button" key={item.id} className={selectedCategoryId === item.id ? "selected" : ""} onClick={() => setCategoryId(item.id)}><span style={{ background: `${item.color}20` }}>{item.icon}</span>{item.name}</button>)}</fieldset>}
        <div className="two-columns"><label>Ngày<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><label>Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Không bắt buộc" /></label></div>
      </div>
      <button className="primary-button large" type="submit" disabled={!amount || !selectedAccountId}>{type === "expense" ? "Lưu khoản chi" : type === "income" ? "Lưu khoản thu" : "Chuyển tiền"}</button>
    </form>
  </div>;
}

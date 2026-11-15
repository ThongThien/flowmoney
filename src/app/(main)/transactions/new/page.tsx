"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type AccountRecord, type TransactionType } from "@/lib/db";
import { localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";
import { calculateAccountBalance } from "@/lib/finance";
import { useAppStore } from "@/stores/useAppStore";

export default function NewTransactionPage() {
  const router = useRouter();
  const data = useLiveQuery(async () => ({ accounts: await db.accounts.where("isHidden").equals(0).toArray(), categories: await db.categories.toArray(), transactions: await db.transactions.toArray() }));
  const [type, setType] = useState<TransactionType>("expense"); const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(""); const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState(""); const [date, setDate] = useState(localDateInput()); const [note, setNote] = useState("");
  const [postedOverride, setPostedOverride] = useState<boolean | null>(null);
  const [error, setError] = useState(""); const en = useAppStore((state) => state.locale) === "en";
  const categories = useMemo(() => { const allowed = type === "expense" ? ["expense-work", "expense-food", "expense-sport", "expense-personal", "expense-other"] : ["income-work", "income-other"]; return data?.categories.filter((item) => allowed.includes(item.id)) ?? []; }, [data, type]);
  const selectedAccountId = accountId || data?.accounts[0]?.id || "";
  const selectedCategoryId = categoryId || categories[0]?.id || "";
  const source = data?.accounts.find((item) => item.id === selectedAccountId);
  const destination = data?.accounts.find((item) => item.id === toAccountId);
  const involvesExternalAccount = source?.type !== "cash" || (type === "transfer" && destination?.type !== "cash");
  const isPosted = postedOverride ?? !involvesExternalAccount;
  const sourceBalance = source ? calculateAccountBalance(source, data?.transactions ?? []) : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!amount || !selectedAccountId || (type === "transfer" && (!toAccountId || toAccountId === selectedAccountId))) return;
    if (isPosted && type !== "income" && amount > sourceBalance) { setError(en ? "Not enough money in this account." : "Tài khoản này không đủ tiền."); return; }
    if (selectedCategoryId === "expense-other" && !note.trim()) { setError(en ? "Describe the Other expense in the note." : "Hãy ghi nội dung cho danh mục Khác."); return; }
    const now = new Date().toISOString();
    await db.transactions.add({ id: crypto.randomUUID(), type, status: isPosted ? "posted" : "pending", amount, accountId: selectedAccountId,
      toAccountId: type === "transfer" ? toAccountId : undefined, categoryId: type === "transfer" ? undefined : selectedCategoryId,
      note: note.trim(), occurredAt: new Date(`${date}T12:00:00`).toISOString(), createdAt: now, updatedAt: now });
    router.push("/transactions");
  }

  function selectType(next: TransactionType) { setType(next); setCategoryId(""); setPostedOverride(null); }

  return <div className="page-stack narrow-page">
    <PageHeader eyebrow={en ? "Follow the real action" : "Làm theo giao dịch thật"} title={en ? "New activity" : "Giao dịch mới"} />
    <form className="transaction-form" onSubmit={submit}>
      <div className="segmented transaction-type"><button type="button" className={type === "expense" ? "active expense-active" : ""} onClick={() => selectType("expense")}>{en ? "Pay" : "Chi"}</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => selectType("income")}>{en ? "Receive" : "Thu"}</button><button type="button" className={type === "transfer" ? "active" : ""} onClick={() => selectType("transfer")}>{en ? "Transfer" : "Chuyển"}</button></div>
      <div className="amount-stage"><span>{en ? "Amount" : "Số tiền"}</span><MoneyInput value={amount} onChange={(value) => { setAmount(value); setError(""); }} /></div>
      <div className="form-card flat">
        <AccountPicker en={en} label={type === "transfer" ? (en ? "From" : "Từ tài khoản") : (en ? "Account" : "Tài khoản")} accounts={data?.accounts ?? []} value={selectedAccountId} onChange={(id) => { setAccountId(id); setPostedOverride(null); setError(""); }} />
        {type === "transfer" ? <AccountPicker en={en} label={en ? "To" : "Đến tài khoản"} accounts={(data?.accounts ?? []).filter((item) => item.id !== selectedAccountId)} value={toAccountId} onChange={(id) => { setToAccountId(id); setPostedOverride(null); }} /> : <fieldset className="category-picker"><legend>{en ? "Category" : "Danh mục"}</legend>{categories.map((item) => <button type="button" key={item.id} className={selectedCategoryId === item.id ? "selected" : ""} onClick={() => setCategoryId(item.id)}><span style={{ background: `${item.color}20` }}>{item.icon}</span>{item.name}</button>)}</fieldset>}
        {involvesExternalAccount && <label className="status-toggle"><input type="checkbox" checked={isPosted} onChange={(event) => setPostedOverride(event.target.checked)} /><span><strong>{en ? "Already done in real life" : "Đã thực hiện ngoài thực tế"}</strong><small>{isPosted ? (en ? "Update the balance now." : "Cập nhật số dư ngay.") : (en ? "Keep pending until you mark it done." : "Lưu chờ đến khi hoàn tất.")}</small></span></label>}
        <details className="optional-fields" open={selectedCategoryId === "expense-other" || undefined}><summary>{en ? "Date and note" : "Ngày và ghi chú"}</summary><div className="two-columns"><label>{en ? "Date" : "Ngày"}<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><label>{en ? "Note" : "Ghi chú"}<input value={note} onChange={(e) => { setNote(e.target.value); setError(""); }} placeholder={selectedCategoryId === "expense-other" ? (en ? "What was it?" : "Bạn đã chi gì?") : "Optional"} /></label></div></details>
      </div>
      {error && <p className="form-error">{error}</p>}<button className="primary-button large" type="submit" disabled={!amount || !selectedAccountId}>{isPosted ? (en ? "Confirm" : "Xác nhận") : (en ? "Save as pending" : "Lưu chờ hoàn tất")}</button>
    </form>
  </div>;
}

function AccountPicker({ label, accounts, value, onChange, en }: { label: string; accounts: AccountRecord[]; value: string; onChange: (id: string) => void; en: boolean }) {
  return <fieldset className="account-picker"><legend>{label}</legend>{accounts.map((item) => <button type="button" key={item.id} className={value === item.id ? "selected" : ""} onClick={() => onChange(item.id)}><i style={{ background: item.color }} /> <span>{item.name}</span><small>{item.type === "cash" ? (en ? "Cash" : "Tiền mặt") : item.type === "bank" ? (en ? "Bank" : "Ngân hàng") : (en ? "E-wallet" : "Ví điện tử")}</small></button>)}</fieldset>;
}

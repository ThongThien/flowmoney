"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type AccountRecord, type TransactionType } from "@/lib/db";
import { localDateInput } from "@/lib/format";
import { MoneyInput } from "@/components/MoneyInput";
import { PageHeader } from "@/components/PageHeader";

export default function NewTransactionPage() {
  const router = useRouter();
  const data = useLiveQuery(async () => ({ accounts: await db.accounts.where("isHidden").equals(0).toArray(), categories: await db.categories.toArray() }));
  const [type, setType] = useState<TransactionType>("expense"); const [amount, setAmount] = useState(0);
  const [accountId, setAccountId] = useState(""); const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState(""); const [date, setDate] = useState(localDateInput()); const [note, setNote] = useState("");
  const [postedOverride, setPostedOverride] = useState<boolean | null>(null);
  const categories = useMemo(() => data?.categories.filter((item) => item.type === type) ?? [], [data, type]);
  const selectedAccountId = accountId || data?.accounts[0]?.id || "";
  const selectedCategoryId = categoryId || categories[0]?.id || "";
  const source = data?.accounts.find((item) => item.id === selectedAccountId);
  const destination = data?.accounts.find((item) => item.id === toAccountId);
  const involvesExternalAccount = source?.type !== "cash" || (type === "transfer" && destination?.type !== "cash");
  const isPosted = postedOverride ?? !involvesExternalAccount;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!amount || !selectedAccountId || (type === "transfer" && (!toAccountId || toAccountId === selectedAccountId))) return;
    const now = new Date().toISOString();
    await db.transactions.add({ id: crypto.randomUUID(), type, status: isPosted ? "posted" : "pending", amount, accountId: selectedAccountId,
      toAccountId: type === "transfer" ? toAccountId : undefined, categoryId: type === "transfer" ? undefined : selectedCategoryId,
      note: note.trim(), occurredAt: new Date(`${date}T12:00:00`).toISOString(), createdAt: now, updatedAt: now });
    router.push("/transactions");
  }

  function selectType(next: TransactionType) { setType(next); setCategoryId(""); setPostedOverride(null); }

  return <div className="page-stack narrow-page">
    <PageHeader eyebrow="Ghi nhanh" title="Thêm giao dịch" description="Nhập số tiền, chọn nơi giữ tiền, rồi lưu." />
    <form className="transaction-form" onSubmit={submit}>
      <div className="segmented transaction-type"><button type="button" className={type === "expense" ? "active expense-active" : ""} onClick={() => selectType("expense")}>Khoản chi</button><button type="button" className={type === "income" ? "active" : ""} onClick={() => selectType("income")}>Khoản thu</button><button type="button" className={type === "transfer" ? "active" : ""} onClick={() => selectType("transfer")}>Chuyển tiền</button></div>
      <div className="amount-stage"><span>Số tiền</span><MoneyInput value={amount} onChange={setAmount} /></div>
      <div className="form-card flat">
        <AccountPicker label={type === "transfer" ? "Từ tài khoản" : "Tài khoản"} accounts={data?.accounts ?? []} value={selectedAccountId} onChange={(id) => { setAccountId(id); setPostedOverride(null); }} />
        {type === "transfer" ? <AccountPicker label="Đến tài khoản" accounts={(data?.accounts ?? []).filter((item) => item.id !== selectedAccountId)} value={toAccountId} onChange={(id) => { setToAccountId(id); setPostedOverride(null); }} /> : <fieldset className="category-picker"><legend>Danh mục</legend>{categories.map((item) => <button type="button" key={item.id} className={selectedCategoryId === item.id ? "selected" : ""} onClick={() => setCategoryId(item.id)}><span style={{ background: `${item.color}20` }}>{item.icon}</span>{item.name}</button>)}</fieldset>}
        {involvesExternalAccount && <label className="status-toggle"><input type="checkbox" checked={isPosted} onChange={(event) => setPostedOverride(event.target.checked)} /><span><strong>Đã thực hiện ngoài thực tế</strong><small>{isPosted ? "Số dư sẽ được cập nhật ngay." : "Lưu ở trạng thái chờ; vuốt giao dịch để hoàn tất."}</small></span></label>}
        <details className="optional-fields"><summary>Ngày và ghi chú <span>không bắt buộc chỉnh</span></summary><div className="two-columns"><label>Ngày<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label><label>Ghi chú<input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Không bắt buộc" /></label></div></details>
      </div>
      <button className="primary-button large" type="submit" disabled={!amount || !selectedAccountId}>{isPosted ? "Lưu giao dịch" : "Lưu và chờ hoàn tất"}</button>
    </form>
  </div>;
}

function AccountPicker({ label, accounts, value, onChange }: { label: string; accounts: AccountRecord[]; value: string; onChange: (id: string) => void }) {
  return <fieldset className="account-picker"><legend>{label}</legend>{accounts.map((item) => <button type="button" key={item.id} className={value === item.id ? "selected" : ""} onClick={() => onChange(item.id)}><i style={{ background: item.color }} /> <span>{item.name}</span><small>{item.type === "cash" ? "Tiền mặt" : item.type === "bank" ? "Ngân hàng" : "Ví điện tử"}</small></button>)}</fieldset>;
}

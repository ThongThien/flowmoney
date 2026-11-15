"use client";

import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { formatDate, formatMoney, localDateInput } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { MoneyInput } from "@/components/MoneyInput";
import { Modal } from "@/components/Modal";
import { SwipeActions } from "@/components/SwipeActions";
import { useAppStore } from "@/stores/useAppStore";

export default function AssetsPage() {
  const items = useLiveQuery(() => db.possessions.orderBy("createdAt").reverse().toArray()); const [showForm, setShowForm] = useState(false); const [archived, setArchived] = useState(false); const en = useAppStore((state) => state.locale) === "en";
  if (!items) return null; const visible = items.filter((item) => Boolean(item.isArchived) === archived); const total = items.filter((item) => !item.isArchived).reduce((sum, item) => sum + item.price, 0);
  return <div className="page-stack"><PageHeader eyebrow={en ? "Things you own" : "Đồ đang sở hữu"} title={en ? "Items" : "Tài sản"} />
    <section className="summary-strip"><div><span>{en ? "Recorded value" : "Giá trị đã ghi"}</span><strong>{formatMoney(total)}</strong></div><button className="round-add" aria-label="Add item" onClick={() => setShowForm(true)}>+</button></section>
    <div className="segmented compact-tabs"><button className={!archived ? "active" : ""} onClick={() => setArchived(false)}>{en ? "Owned" : "Đang có"}</button><button className={archived ? "active" : ""} onClick={() => setArchived(true)}>{en ? "Archived" : "Đã lưu trữ"}</button></div>
    {showForm && <Modal title="New item" onClose={() => setShowForm(false)}><ItemForm onClose={() => setShowForm(false)} en={en} /></Modal>}
    <section className="content-section compact-section">{visible.length === 0 ? <EmptyState icon="□" title={en ? "No items" : "Chưa có tài sản"}>{en ? "Keep a simple list of things you bought." : "Lưu danh sách đơn giản những món đã mua."}</EmptyState> : <div className="item-list">{visible.map((item) => <SwipeActions key={item.id} actions={[{ label: item.isArchived ? "Restore" : "Archive", icon: "▣", onClick: () => { void db.possessions.update(item.id, { isArchived: item.isArchived ? 0 : 1, updatedAt: new Date().toISOString() }); } }, { label: "Delete", icon: "⌫", tone: "danger", onClick: () => { if (window.confirm(en ? "Delete this item?" : "Xóa mục này?")) void db.possessions.delete(item.id); } }]}><article className="item-row"><span>□</span><div><strong>{item.name}</strong><small>{item.purchasedAt ? formatDate(item.purchasedAt) : ""}{item.note ? ` · ${item.note}` : ""}</small></div><b>{formatMoney(item.price)}</b></article></SwipeActions>)}</div>}</section>
  </div>;
}

function ItemForm({ onClose, en }: { onClose: () => void; en: boolean }) {
  const [name, setName] = useState(""); const [price, setPrice] = useState(0); const [date, setDate] = useState(localDateInput()); const [note, setNote] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); const now = new Date().toISOString(); await db.possessions.add({ id: crypto.randomUUID(), name: name.trim(), price, purchasedAt: date ? new Date(`${date}T12:00:00`).toISOString() : undefined, note: note.trim(), isArchived: 0, createdAt: now, updatedAt: now }); onClose(); }
  return <form className="modal-form" onSubmit={submit}><h2>{en ? "New item" : "Tài sản mới"}</h2><label>{en ? "Name" : "Tên"}<input value={name} onChange={(event) => setName(event.target.value)} required /></label><label>{en ? "Purchase price" : "Giá mua"}<MoneyInput value={price} onChange={setPrice} /></label><details className="optional-fields"><summary>{en ? "Date and note" : "Ngày và ghi chú"}</summary><label>{en ? "Purchased" : "Ngày mua"}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><label>{en ? "Note" : "Ghi chú"}<input value={note} onChange={(event) => setNote(event.target.value)} /></label></details><button className="primary-button" disabled={!name.trim()}>{en ? "Save" : "Lưu"}</button></form>;
}

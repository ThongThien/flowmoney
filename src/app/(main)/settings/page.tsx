"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createBackup, parseBackup, replaceDatabaseFromBackup, serializeBackup } from "@/lib/backup";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";

export default function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function exportData() {
    setBusy(true); setMessage("");
    try {
      const backup = await createBackup(); const content = serializeBackup(backup);
      const filename = `flowmoney-backup-${backup.exportedAt.slice(0, 10)}.json`;
      const file = new File([content], filename, { type: "application/json" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: "Sao lưu FlowMoney", files: [file] });
      else { const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
      setMessage("Đã tạo bản sao lưu. Hãy lưu file vào Files hoặc iCloud Drive.");
    } catch (error) { if ((error as DOMException).name !== "AbortError") setMessage(`Không thể xuất dữ liệu: ${(error as Error).message}`); }
    finally { setBusy(false); }
  }
  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; if (!file) return; setBusy(true); setMessage("");
    try { const backup = parseBackup(await file.text()); const tableCount = Object.keys(backup.tables).length;
      if (!window.confirm(`Khôi phục bản sao ngày ${formatDate(backup.exportedAt)} gồm ${tableCount} bảng? Dữ liệu hiện tại sẽ được thay thế.`)) return;
      await replaceDatabaseFromBackup(backup); setMessage("Khôi phục thành công. Ứng dụng sẽ tải lại."); window.setTimeout(() => window.location.reload(), 700);
    } catch (error) { setMessage(`Không thể khôi phục: ${(error as Error).message}`); }
    finally { setBusy(false); event.target.value = ""; }
  }
  return <div className="page-stack narrow-page"><PageHeader eyebrow="Dữ liệu của bạn" title="Cài đặt" description="FlowMoney không gửi dữ liệu lên máy chủ. Bạn hoàn toàn kiểm soát bản sao lưu." />
    <section className="settings-card"><span className="settings-icon"><Icon name="backup" /></span><div><h2>Sao lưu dữ liệu</h2><p>Tạo file JSON chứa tài khoản, giao dịch, công nợ, mục tiêu và danh mục.</p></div><button className="primary-button" onClick={exportData} disabled={busy}>Xuất file backup</button></section>
    <section className="settings-card"><span className="settings-icon purple"><Icon name="backup" /></span><div><h2>Khôi phục dữ liệu</h2><p>Chọn file FlowMoney từ thiết bị khác. Bạn sẽ được xác nhận trước khi thay thế.</p></div><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={importData} /><button className="secondary-button" onClick={() => inputRef.current?.click()} disabled={busy}>Chọn file để nhập</button></section>
    {message && <p className="message" role="status">{message}</p>}
    <section className="privacy-note"><strong>Riêng tư mặc định</strong><p>Không tài khoản đăng nhập, không backend, không theo dõi. Xóa dữ liệu Safari hoặc gỡ PWA có thể làm mất dữ liệu nếu chưa sao lưu.</p></section>
  </div>;
}

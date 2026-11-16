"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { createBackup, parseBackup, replaceDatabaseFromBackup, resetDatabase, serializeBackup, type FlowMoneyBackup } from "@/lib/backup";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { useAppStore } from "@/stores/useAppStore";
import { checkForAppUpdate } from "@/lib/pwaUpdate";

function downloadBackup(backup: FlowMoneyBackup) {
  const file = new File([serializeBackup(backup)], `personal-finance-${backup.exportedAt.slice(0, 10)}.json`, { type: "application/json" });
  const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url);
  return file;
}

export default function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const locale = useAppStore((state) => state.locale); const setLocale = useAppStore((state) => state.setLocale);
  const theme = useAppStore((state) => state.theme); const setTheme = useAppStore((state) => state.setTheme); const en = locale === "en";
  async function exportData() { setBusy(true); setMessage(""); try { const backup = await createBackup(); const file = downloadBackup(backup); if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ title: "Personal Finance backup", files: [file] }); setMessage(en ? "Backup created." : "Đã tạo bản sao lưu."); } catch (error) { if ((error as DOMException).name !== "AbortError") setMessage((error as Error).message); } finally { setBusy(false); } }
  async function importData(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setBusy(true); setMessage(""); try { const backup = parseBackup(await file.text()); if (!window.confirm(en ? `Replace current data with the backup from ${formatDate(backup.exportedAt)}?` : `Thay dữ liệu hiện tại bằng bản sao ngày ${formatDate(backup.exportedAt)}?`)) return; await replaceDatabaseFromBackup(backup); window.location.reload(); } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); event.target.value = ""; } }
  async function reset() { if (!window.confirm(en ? "Reset all data to zero? A recovery backup will be downloaded first." : "Đưa toàn bộ dữ liệu về 0? Một bản sao phục hồi sẽ được tải xuống trước.")) return; setBusy(true); try { downloadBackup(await createBackup()); await resetDatabase(); window.location.reload(); } catch (error) { setMessage((error as Error).message); setBusy(false); } }
  async function checkUpdate() { setBusy(true); setMessage(en ? "Checking for updates…" : "Đang kiểm tra cập nhật…"); try { const result = await checkForAppUpdate(); const messages = en ? { updated: "Update downloaded. The app will reopen automatically.", current: "You already have the latest version.", unsupported: "Updates are available after installing the app from Safari.", offline: "Connect to the internet to check for updates." } : { updated: "Đã tải bản mới. Ứng dụng sẽ tự mở lại.", current: "Bạn đang dùng phiên bản mới nhất.", unsupported: "Chức năng cập nhật hoạt động sau khi cài app từ Safari.", offline: "Hãy kết nối mạng để kiểm tra cập nhật." }; setMessage(messages[result]); } catch (error) { setMessage(en ? `Could not check for updates: ${(error as Error).message}` : `Không thể kiểm tra cập nhật: ${(error as Error).message}`); } finally { setBusy(false); } }
  return <div className="page-stack narrow-page"><PageHeader eyebrow={en ? "Your app" : "Ứng dụng"} title={en ? "Settings" : "Cài đặt"} />
    <section className="settings-panel" aria-label={en ? "Preferences" : "Tuỳ chọn"}>
      <div className="setting-choice">
        <div className="setting-choice-title"><span className="settings-symbol">Aa</span><strong>{en ? "Language" : "Ngôn ngữ"}</strong></div>
        <div className="segmented compact-segmented"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>EN</button><button className={locale === "vi" ? "active" : ""} onClick={() => setLocale("vi")}>VI</button></div>
      </div>
      <div className="setting-choice">
        <div className="setting-choice-title"><span className="settings-symbol purple">◐</span><strong>{en ? "Appearance" : "Giao diện"}</strong></div>
        <div className="segmented compact-segmented"><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>{en ? "Dark" : "Tối"}</button><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>{en ? "Light" : "Sáng"}</button></div>
      </div>
    </section>
    <section className="settings-action-card" aria-label={en ? "Data and app" : "Dữ liệu và ứng dụng"}>
      <button className="setting-action" aria-label={en ? "Check for updates" : "Kiểm tra cập nhật"} onClick={checkUpdate} disabled={busy}><span><Icon name="refresh" /></span><strong>{en ? "Update" : "Cập nhật"}</strong></button>
      <button className="setting-action" aria-label={en ? "Export backup" : "Xuất sao lưu"} onClick={exportData} disabled={busy}><span><Icon name="backup" /></span><strong>{en ? "Backup" : "Sao lưu"}</strong></button>
      <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={importData} />
      <button className="setting-action" aria-label={en ? "Import backup" : "Nhập sao lưu"} onClick={() => inputRef.current?.click()} disabled={busy}><span><Icon name="archive" /></span><strong>{en ? "Restore" : "Khôi phục"}</strong></button>
      <button className="setting-action danger" aria-label={en ? "Reset data" : "Đặt lại dữ liệu"} onClick={reset} disabled={busy}><span><Icon name="trash" /></span><strong>{en ? "Reset" : "Đặt lại"}</strong></button>
    </section>
    {message && <p className="message" role="status">{message}</p>}
  </div>;
}

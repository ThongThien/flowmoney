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
    <section className="settings-card preference-card"><span className="settings-icon">Aa</span><div><h2>{en ? "Language" : "Ngôn ngữ"}</h2><p>{en ? "English is the default language." : "Tiếng Anh là ngôn ngữ mặc định."}</p></div><div className="segmented"><button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>English</button><button className={locale === "vi" ? "active" : ""} onClick={() => setLocale("vi")}>Tiếng Việt</button></div></section>
    <section className="settings-card preference-card"><span className="settings-icon purple">◐</span><div><h2>{en ? "Appearance" : "Giao diện"}</h2><p>{en ? "Dark mode is used by default." : "Chế độ tối được dùng mặc định."}</p></div><div className="segmented"><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}>Dark</button><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}>Light</button></div></section>
    <section className="settings-card update-card"><span className="settings-icon"><Icon name="refresh" /></span><div><h2>{en ? "App update" : "Cập nhật ứng dụng"}</h2><p>{en ? "Check and install the newest published version." : "Kiểm tra và cài phiên bản mới nhất đã triển khai."}</p></div><button className="icon-action" aria-label={en ? "Check for updates" : "Kiểm tra cập nhật"} title={en ? "Update" : "Cập nhật"} onClick={checkUpdate} disabled={busy}><Icon name="refresh" /></button></section>
    <section className="settings-card"><span className="settings-icon"><Icon name="backup" /></span><div><h2>{en ? "Backup" : "Sao lưu"}</h2><p>{en ? "Export a portable JSON file." : "Xuất file JSON để chuyển thiết bị."}</p></div><button className="icon-action" aria-label="Export backup" title="Export" onClick={exportData} disabled={busy}><Icon name="backup" /></button></section>
    <section className="settings-card"><span className="settings-icon purple"><Icon name="backup" /></span><div><h2>{en ? "Restore" : "Khôi phục"}</h2><p>{en ? "Import a Personal Finance backup." : "Nhập bản sao từ thiết bị khác."}</p></div><input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={importData} /><button className="icon-action" aria-label="Import backup" title="Import" onClick={() => inputRef.current?.click()} disabled={busy}>↓</button></section>
    <section className="settings-card danger-card"><span className="settings-icon"><Icon name="trash" /></span><div><h2>{en ? "Reset data" : "Đặt lại dữ liệu"}</h2><p>{en ? "Download a recovery file, then reset everything to zero." : "Tải bản phục hồi rồi đưa mọi dữ liệu về 0."}</p></div><button className="icon-action danger" aria-label="Reset data" title="Reset" onClick={reset} disabled={busy}><Icon name="trash" /></button></section>
    {message && <p className="message" role="status">{message}</p>}
  </div>;
}

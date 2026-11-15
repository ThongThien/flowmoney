import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-shell">
      <section className="offline-card">
        <span className="offline-icon" aria-hidden="true">!</span>
        <div>
          <h1>Bạn đang offline</h1>
          <p>
            Personal Finance keeps your data on this device. Return to the home screen or
            kết nối mạng để tải nội dung chưa từng mở.
          </p>
          <Link className="primary-button offline-button" href="/">Về trang chính</Link>
        </div>
      </section>
    </main>
  );
}

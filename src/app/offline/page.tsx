import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="offline-shell">
      <section className="offline-card">
        <span className="offline-icon" aria-hidden="true">!</span>
        <div>
          <h1>Bạn đang offline</h1>
          <p>
            FlowMoney vẫn giữ dữ liệu trên thiết bị. Hãy quay lại trang chính hoặc
            kết nối mạng để tải nội dung chưa từng mở.
          </p>
          <Link className="primary-button offline-button" href="/">Về trang chính</Link>
        </div>
      </section>
    </main>
  );
}

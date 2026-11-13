import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FlowMoney",
    template: "%s · FlowMoney",
  },
  description: "Quản lý thu chi, tài khoản, công nợ và mục tiêu hoàn toàn offline.",
  applicationName: "FlowMoney",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlowMoney",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#080a0c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="vi">
      <body>
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}

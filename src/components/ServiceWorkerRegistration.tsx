"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function ServiceWorkerRegistration() {
  const setOnline = useAppStore((state) => state.setOnline);
  const setServiceWorkerReady = useAppStore((state) => state.setServiceWorkerReady);

  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    updateOnlineState();

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => setServiceWorkerReady(true))
        .catch((error: unknown) => {
          console.error("Không thể đăng ký service worker", error);
          setServiceWorkerReady(false);
        });
    }

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, [setOnline, setServiceWorkerReady]);

  return null;
}

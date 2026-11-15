"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";

export function ServiceWorkerRegistration() {
  const setOnline = useAppStore((state) => state.setOnline);
  const setServiceWorkerReady = useAppStore((state) => state.setServiceWorkerReady);

  useEffect(() => {
    let refreshing = false;
    let lastUpdateCheck = 0;
    const updateOnlineState = () => setOnline(navigator.onLine);
    const reloadForUpdate = () => { if (refreshing) return; refreshing = true; window.location.reload(); };
    const checkWhenVisible = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || Date.now() - lastUpdateCheck < 300_000) return;
      lastUpdateCheck = Date.now();
      void navigator.serviceWorker?.getRegistration("/").then((registration) => registration?.update()).catch(() => undefined);
    };
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    updateOnlineState();
    navigator.serviceWorker?.addEventListener("controllerchange", reloadForUpdate);
    document.addEventListener("visibilitychange", checkWhenVisible);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then(async (registration) => {
          await navigator.serviceWorker.ready;
          setServiceWorkerReady(true);
          if (navigator.onLine) await registration.update();
        })
        .catch((error: unknown) => {
          console.error("Không thể đăng ký service worker", error);
          setServiceWorkerReady(false);
        });
    }

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
      navigator.serviceWorker?.removeEventListener("controllerchange", reloadForUpdate);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [setOnline, setServiceWorkerReady]);

  return null;
}

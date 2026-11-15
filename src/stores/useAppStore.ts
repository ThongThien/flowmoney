import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type AppLocale = "en" | "vi";
export type AppTheme = "dark" | "light";

interface AppState {
  isOnline: boolean;
  serviceWorkerReady: boolean;
  locale: AppLocale;
  theme: AppTheme;
  setOnline: (isOnline: boolean) => void;
  setServiceWorkerReady: (ready: boolean) => void;
  setLocale: (locale: AppLocale) => void;
  setTheme: (theme: AppTheme) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  isOnline: true,
  serviceWorkerReady: false,
  locale: "en",
  theme: "dark",
  setOnline: (isOnline) => set({ isOnline }),
  setServiceWorkerReady: (serviceWorkerReady) => set({ serviceWorkerReady }),
  setLocale: (locale) => set({ locale }),
  setTheme: (theme) => set({ theme }),
}), { name: "personal-finance-ui", storage: createJSONStorage(() => localStorage), partialize: (state) => ({ locale: state.locale, theme: state.theme }) }));

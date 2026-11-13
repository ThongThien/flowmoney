import { create } from "zustand";

interface AppState {
  isOnline: boolean;
  serviceWorkerReady: boolean;
  setOnline: (isOnline: boolean) => void;
  setServiceWorkerReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: true,
  serviceWorkerReady: false,
  setOnline: (isOnline) => set({ isOnline }),
  setServiceWorkerReady: (serviceWorkerReady) => set({ serviceWorkerReady }),
}));

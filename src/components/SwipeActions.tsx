"use client";

import { useRef, useState, type ReactNode } from "react";

export interface SwipeAction {
  label: string;
  icon: string;
  tone?: "success" | "danger" | "neutral";
  onClick: () => void;
}

export function SwipeActions({ children, actions }: { children: ReactNode; actions: SwipeAction[] }) {
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);

  return <div className={`swipe-row ${open ? "is-open" : ""}`}>
    <div className="swipe-actions" aria-hidden={!open}>
      {actions.map((action) => <button type="button" key={action.label} className={action.tone ?? "neutral"} tabIndex={open ? 0 : -1}
        aria-label={action.label} title={action.label} onClick={() => { setOpen(false); action.onClick(); }}>
        <span aria-hidden="true">{action.icon}</span>
      </button>)}
    </div>
    <div className="swipe-content" onTouchStart={(event) => { startX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => { if (startX.current === null) return; const distance = event.changedTouches[0].clientX - startX.current; if (distance < -35) setOpen(true); if (distance > 35) setOpen(false); startX.current = null; }}>
      {children}
      <button type="button" className="swipe-more" aria-label={open ? "Đóng menu thao tác" : "Mở menu thao tác"} onClick={() => setOpen((value) => !value)}>…</button>
    </div>
  </div>;
}

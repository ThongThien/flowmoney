import type { ReactNode } from "react";

export function EmptyState({ icon = "✦", title, children }: { icon?: string; title: string; children: ReactNode }) {
  return <div className="empty-state"><span>{icon}</span><h3>{title}</h3><p>{children}</p></div>;
}

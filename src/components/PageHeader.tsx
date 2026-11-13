import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: { href: string; label: string }; children?: ReactNode;
}) {
  return <header className="page-header"><div>{eyebrow && <span className="kicker">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <Link className="text-button" href={action.href}>{action.label}</Link>}</header>;
}

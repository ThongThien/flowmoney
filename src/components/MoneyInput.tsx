"use client";

import { formatMoneyInput, parseMoneyInput } from "@/lib/format";

export function MoneyInput({ value, onChange, id = "amount", required = true }: {
  value: number; onChange: (value: number) => void; id?: string; required?: boolean;
}) {
  return <div className="money-input-wrap">
    <input id={id} inputMode="numeric" autoComplete="off" placeholder="0" value={formatMoneyInput(value)}
      onChange={(event) => onChange(parseMoneyInput(event.target.value))} required={required} />
    <span>₫</span>
  </div>;
}

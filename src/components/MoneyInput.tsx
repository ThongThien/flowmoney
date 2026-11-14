"use client";

import { formatMoneyInput, parseMoneyInput } from "@/lib/format";

export function MoneyInput({ value, onChange, id = "amount", required = true }: {
  value: number; onChange: (value: number) => void; id?: string; required?: boolean;
}) {
  const suggestions = value > 0 && value < 1000
    ? [value * 1000, value * 10_000, value * 100_000]
    : value === 0 ? [10_000, 50_000, 100_000] : [];
  return <div className="money-input-group">
    <div className="money-input-wrap">
      <input id={id} inputMode="numeric" autoComplete="off" placeholder="0" value={formatMoneyInput(value)}
        onChange={(event) => onChange(parseMoneyInput(event.target.value))} required={required} />
      <span>₫</span>
    </div>
    {suggestions.length > 0 && <div className="money-suggestions" aria-label="Gợi ý số tiền">
      {suggestions.map((amount) => <button type="button" key={amount} onClick={() => onChange(amount)}>{formatMoneyInput(amount)} ₫</button>)}
    </div>}
  </div>;
}

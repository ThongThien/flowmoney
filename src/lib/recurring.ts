import { db, initializeDatabase, type RecurringRuleRecord, type TransactionStatus } from "./db";
import { calculateAccountBalance } from "./finance";

function scheduledDate(rule: RecurringRuleRecord, now: Date): string {
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.min(Math.max(rule.dayOfMonth, 1), lastDay);
  return new Date(now.getFullYear(), now.getMonth(), day, 12).toISOString();
}

function isSameMonth(value: string, target: Date): boolean {
  const date = new Date(value);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
}

export async function ensureRecurringTransactions(): Promise<void> {
  await initializeDatabase();
  const now = new Date();
  const rules = await db.recurringRules.where("isActive").equals(1).toArray();
  const accounts = await db.accounts.toArray();
  const workingTransactions = await db.transactions.toArray();

  await db.transaction("rw", db.transactions, async () => {
    for (const rule of rules) {
      const dueDate = new Date(scheduledDate(rule, now));
      const startDate = new Date(rule.startsAt || rule.createdAt);
      if (now.getDate() < dueDate.getDate()) continue;
      if (isSameMonth(startDate.toISOString(), now) && startDate.getDate() > dueDate.getDate()) continue;
      const existing = await db.transactions.where("recurringRuleId").equals(rule.id).toArray();
      if (existing.some((item) => isSameMonth(item.occurredAt, now))) continue;
      const timestamp = new Date().toISOString();
      const account = accounts.find((item) => item.id === rule.accountId);
      const status: TransactionStatus = account && calculateAccountBalance(account, workingTransactions) >= rule.amount ? "posted" : "pending";
      const record = {
        id: crypto.randomUUID(), type: "expense" as const, status, amount: rule.amount,
        accountId: rule.accountId, categoryId: rule.categoryId, recurringRuleId: rule.id,
        note: rule.note || rule.name, occurredAt: scheduledDate(rule, now), createdAt: timestamp, updatedAt: timestamp,
      };
      await db.transactions.add(record);
      workingTransactions.push(record);
    }
  });
}

import Dexie, { type EntityTable } from "dexie";

export type AccountType = "cash" | "bank" | "ewallet";
export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "pending" | "posted";
export type CategoryType = "income" | "expense";
export type DebtDirection = "lend" | "borrow";
export type GoalKind = "savings" | "milestone";

export interface AppMetaRecord { key: string; value: string }
export interface AccountRecord {
  id: string; name: string; type: AccountType; openingBalance: number; color: string;
  isHidden: 0 | 1; createdAt: string; updatedAt: string;
}
export interface CategoryRecord { id: string; name: string; type: CategoryType; icon: string; color: string }
export interface TransactionRecord {
  id: string; type: TransactionType; amount: number; accountId: string; toAccountId?: string;
  categoryId?: string; note: string; occurredAt: string; status: TransactionStatus;
  recurringRuleId?: string; createdAt: string; updatedAt: string;
}
export interface DebtRecord {
  id: string; direction: DebtDirection; person: string; originalAmount: number; note: string;
  accountId?: string; transactionId?: string; dueDate?: string; createdAt: string; updatedAt: string;
}
export interface DebtPaymentRecord { id: string; debtId: string; accountId?: string; transactionId?: string; amount: number; paidAt: string; note: string }
export interface GoalRecord {
  id: string; name: string; kind: GoalKind; targetAmount: number; deadline?: string; icon: string; color: string;
  isArchived: 0 | 1; createdAt: string; updatedAt: string;
}
export interface GoalContributionRecord { id: string; goalId: string; accountId?: string; transactionId?: string; amount: number; contributedAt: string; note: string }
export interface RecurringRuleRecord {
  id: string; name: string; amount: number; accountId: string; categoryId: string;
  dayOfMonth: number; note: string; isActive: 0 | 1; startsAt: string; createdAt: string; updatedAt: string;
}
export interface PossessionRecord {
  id: string; name: string; price: number; purchasedAt?: string; note: string;
  isArchived: 0 | 1; createdAt: string; updatedAt: string;
}

class FlowMoneyDatabase extends Dexie {
  appMeta!: EntityTable<AppMetaRecord, "key">;
  accounts!: EntityTable<AccountRecord, "id">;
  categories!: EntityTable<CategoryRecord, "id">;
  transactions!: EntityTable<TransactionRecord, "id">;
  debts!: EntityTable<DebtRecord, "id">;
  debtPayments!: EntityTable<DebtPaymentRecord, "id">;
  goals!: EntityTable<GoalRecord, "id">;
  goalContributions!: EntityTable<GoalContributionRecord, "id">;
  recurringRules!: EntityTable<RecurringRuleRecord, "id">;
  possessions!: EntityTable<PossessionRecord, "id">;

  constructor() {
    super("flowmoney");
    this.version(1).stores({ appMeta: "&key" });
    this.version(2).stores({
      appMeta: "&key",
      accounts: "&id, type, isHidden, createdAt",
      categories: "&id, type, name",
      transactions: "&id, type, accountId, toAccountId, categoryId, occurredAt, createdAt",
      debts: "&id, direction, dueDate, createdAt",
      debtPayments: "&id, debtId, paidAt",
      goals: "&id, deadline, createdAt",
      goalContributions: "&id, goalId, contributedAt",
    });
    this.version(3).stores({
      appMeta: "&key",
      accounts: "&id, type, isHidden, createdAt",
      categories: "&id, type, name",
      transactions: "&id, type, status, accountId, toAccountId, categoryId, recurringRuleId, occurredAt, createdAt",
      debts: "&id, direction, dueDate, createdAt",
      debtPayments: "&id, debtId, paidAt",
      goals: "&id, kind, deadline, createdAt",
      goalContributions: "&id, goalId, contributedAt",
      recurringRules: "&id, isActive, accountId, categoryId, dayOfMonth, createdAt",
    }).upgrade(async (transaction) => {
      await transaction.table("transactions").toCollection().modify({ status: "posted" });
      await transaction.table("goals").toCollection().modify({ kind: "savings" });
    });
    this.version(4).stores({
      appMeta: "&key",
      accounts: "&id, type, isHidden, createdAt",
      categories: "&id, type, name",
      transactions: "&id, type, status, accountId, toAccountId, categoryId, recurringRuleId, occurredAt, createdAt",
      debts: "&id, direction, accountId, dueDate, createdAt",
      debtPayments: "&id, debtId, accountId, paidAt",
      goals: "&id, kind, isArchived, deadline, createdAt",
      goalContributions: "&id, goalId, accountId, contributedAt",
      recurringRules: "&id, isActive, accountId, categoryId, dayOfMonth, createdAt",
      possessions: "&id, isArchived, purchasedAt, createdAt",
    }).upgrade(async (transaction) => {
      await transaction.table("goals").toCollection().modify({ isArchived: 0 });
    });
    this.version(5).stores({
      appMeta: "&key",
      accounts: "&id, type, isHidden, createdAt",
      categories: "&id, type, name",
      transactions: "&id, type, status, accountId, toAccountId, categoryId, recurringRuleId, occurredAt, createdAt",
      debts: "&id, direction, accountId, dueDate, createdAt",
      debtPayments: "&id, debtId, accountId, paidAt",
      goals: "&id, kind, isArchived, deadline, createdAt",
      goalContributions: "&id, goalId, accountId, contributedAt",
      recurringRules: "&id, isActive, accountId, categoryId, dayOfMonth, createdAt",
      possessions: "&id, isArchived, purchasedAt, createdAt",
    }).upgrade(async (transaction) => {
      await transaction.table("recurringRules").toCollection().modify((rule) => { rule.startsAt = rule.createdAt; });
    });
  }
}

export const db = new FlowMoneyDatabase();

const DEFAULT_CATEGORIES: CategoryRecord[] = [
  { id: "expense-work", name: "Work", type: "expense", icon: "💼", color: "#46a6ff" },
  { id: "expense-food", name: "Food", type: "expense", icon: "🍜", color: "#ff8a65" },
  { id: "expense-sport", name: "Sports gear", type: "expense", icon: "🏋️", color: "#65d6ad" },
  { id: "expense-personal", name: "Personal", type: "expense", icon: "◉", color: "#ba8cff" },
  { id: "expense-other", name: "Khác", type: "expense", icon: "•••", color: "#88939e" },
  { id: "expense-goal", name: "Goal saving", type: "expense", icon: "◎", color: "#25d8a3" },
  { id: "expense-debt", name: "Debt payment", type: "expense", icon: "↗", color: "#ff6b77" },
  { id: "income-work", name: "Work", type: "income", icon: "💼", color: "#3ddc97" },
  { id: "income-debt", name: "Debt received", type: "income", icon: "↙", color: "#46c2ff" },
  { id: "income-other", name: "Other", type: "income", icon: "+", color: "#8be9c7" },
];

export async function initializeDatabase(): Promise<void> {
  await db.open();
  const now = new Date().toISOString();
  await db.transaction("rw", db.appMeta, db.categories, db.accounts, async () => {
    await db.categories.bulkPut(DEFAULT_CATEGORIES);
    if ((await db.accounts.count()) === 0) {
      await db.accounts.add({
        id: crypto.randomUUID(), name: "Tiền mặt", type: "cash", openingBalance: 0,
        color: "#25d8a3", isHidden: 0, createdAt: now, updatedAt: now,
      });
    }
    await db.appMeta.put({ key: "initializedAt", value: now });
  });
}

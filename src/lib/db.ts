import Dexie, { type EntityTable } from "dexie";

export type AccountType = "cash" | "bank" | "ewallet";
export type TransactionType = "income" | "expense" | "transfer";
export type CategoryType = "income" | "expense";
export type DebtDirection = "lend" | "borrow";

export interface AppMetaRecord { key: string; value: string }
export interface AccountRecord {
  id: string; name: string; type: AccountType; openingBalance: number; color: string;
  isHidden: 0 | 1; createdAt: string; updatedAt: string;
}
export interface CategoryRecord { id: string; name: string; type: CategoryType; icon: string; color: string }
export interface TransactionRecord {
  id: string; type: TransactionType; amount: number; accountId: string; toAccountId?: string;
  categoryId?: string; note: string; occurredAt: string; createdAt: string; updatedAt: string;
}
export interface DebtRecord {
  id: string; direction: DebtDirection; person: string; originalAmount: number; note: string;
  dueDate?: string; createdAt: string; updatedAt: string;
}
export interface DebtPaymentRecord { id: string; debtId: string; amount: number; paidAt: string; note: string }
export interface GoalRecord {
  id: string; name: string; targetAmount: number; deadline?: string; icon: string; color: string;
  createdAt: string; updatedAt: string;
}
export interface GoalContributionRecord { id: string; goalId: string; amount: number; contributedAt: string; note: string }

class FlowMoneyDatabase extends Dexie {
  appMeta!: EntityTable<AppMetaRecord, "key">;
  accounts!: EntityTable<AccountRecord, "id">;
  categories!: EntityTable<CategoryRecord, "id">;
  transactions!: EntityTable<TransactionRecord, "id">;
  debts!: EntityTable<DebtRecord, "id">;
  debtPayments!: EntityTable<DebtPaymentRecord, "id">;
  goals!: EntityTable<GoalRecord, "id">;
  goalContributions!: EntityTable<GoalContributionRecord, "id">;

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
  }
}

export const db = new FlowMoneyDatabase();

const DEFAULT_CATEGORIES: CategoryRecord[] = [
  { id: "expense-food", name: "Ăn uống", type: "expense", icon: "🍜", color: "#ff8a65" },
  { id: "expense-shopping", name: "Mua sắm", type: "expense", icon: "🛍️", color: "#ba8cff" },
  { id: "expense-transport", name: "Di chuyển", type: "expense", icon: "🛵", color: "#55b7ff" },
  { id: "expense-home", name: "Nhà cửa", type: "expense", icon: "🏠", color: "#ffd166" },
  { id: "expense-health", name: "Sức khỏe", type: "expense", icon: "💊", color: "#65d6ad" },
  { id: "expense-entertainment", name: "Giải trí", type: "expense", icon: "🎬", color: "#ff6b9d" },
  { id: "expense-other", name: "Khác", type: "expense", icon: "•••", color: "#88939e" },
  { id: "income-salary", name: "Lương", type: "income", icon: "💼", color: "#3ddc97" },
  { id: "income-bonus", name: "Thưởng", type: "income", icon: "🎁", color: "#7ee787" },
  { id: "income-investment", name: "Đầu tư", type: "income", icon: "📈", color: "#46c2ff" },
  { id: "income-other", name: "Thu nhập khác", type: "income", icon: "+", color: "#8be9c7" },
];

export async function initializeDatabase(): Promise<void> {
  await db.open();
  const now = new Date().toISOString();
  await db.transaction("rw", db.appMeta, db.categories, db.accounts, async () => {
    if ((await db.categories.count()) === 0) await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    if ((await db.accounts.count()) === 0) {
      await db.accounts.add({
        id: crypto.randomUUID(), name: "Tiền mặt", type: "cash", openingBalance: 0,
        color: "#25d8a3", isHidden: 0, createdAt: now, updatedAt: now,
      });
    }
    await db.appMeta.put({ key: "initializedAt", value: now });
  });
}

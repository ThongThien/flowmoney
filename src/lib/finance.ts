import type { AccountRecord, DebtPaymentRecord, DebtRecord, GoalContributionRecord, GoalRecord, TransactionRecord } from "./db";
import { monthKey } from "./format";

export function calculateAccountBalance(account: AccountRecord, transactions: TransactionRecord[]): number {
  return transactions.filter((item) => item.status !== "pending").reduce((balance, item) => {
    if (item.type === "income" && item.accountId === account.id) return balance + item.amount;
    if (item.type === "expense" && item.accountId === account.id) return balance - item.amount;
    if (item.type === "transfer" && item.accountId === account.id) return balance - item.amount;
    if (item.type === "transfer" && item.toAccountId === account.id) return balance + item.amount;
    return balance;
  }, account.openingBalance);
}

export function accountBalanceById(accountId: string, accounts: AccountRecord[], transactions: TransactionRecord[]): number {
  const account = accounts.find((item) => item.id === accountId);
  return account ? calculateAccountBalance(account, transactions) : 0;
}

export function calculateNetWorth(accounts: AccountRecord[], transactions: TransactionRecord[]): number {
  return accounts.filter((account) => !account.isHidden)
    .reduce((total, account) => total + calculateAccountBalance(account, transactions), 0);
}

export function calculateMonthTotals(transactions: TransactionRecord[], targetMonth: string) {
  return transactions.filter((item) => item.status !== "pending").reduce((totals, item) => {
    if (monthKey(item.occurredAt) !== targetMonth) return totals;
    if (item.type === "income") totals.income += item.amount;
    if (item.type === "expense") totals.expense += item.amount;
    return totals;
  }, { income: 0, expense: 0 });
}

export function debtRemaining(debt: DebtRecord, payments: DebtPaymentRecord[]): number {
  const paid = payments.filter((item) => item.debtId === debt.id).reduce((sum, item) => sum + item.amount, 0);
  return Math.max(0, debt.originalAmount - paid);
}

export function goalSaved(goal: GoalRecord, contributions: GoalContributionRecord[]): number {
  return contributions.filter((item) => item.goalId === goal.id).reduce((sum, item) => sum + item.amount, 0);
}

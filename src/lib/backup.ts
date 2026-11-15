import type { Table } from "dexie";
import { db, initializeDatabase } from "./db";

const BACKUP_FORMAT = "flowmoney-backup";
const BACKUP_FORMAT_VERSION = 1;

export interface FlowMoneyBackup {
  format: typeof BACKUP_FORMAT; formatVersion: typeof BACKUP_FORMAT_VERSION;
  databaseVersion: number; exportedAt: string; tables: Record<string, unknown[]>;
}

export async function createBackup(): Promise<FlowMoneyBackup> {
  await initializeDatabase();
  const entries = await Promise.all(db.tables.map(async (table) => [table.name, await table.toArray()] as const));
  return { format: BACKUP_FORMAT, formatVersion: BACKUP_FORMAT_VERSION, databaseVersion: db.verno,
    exportedAt: new Date().toISOString(), tables: Object.fromEntries(entries) };
}

export function serializeBackup(backup: FlowMoneyBackup): string { return JSON.stringify(backup, null, 2) }

export function parseBackup(source: string): FlowMoneyBackup {
  const candidate: unknown = JSON.parse(source);
  if (!isBackup(candidate)) throw new Error("File không phải bản sao lưu FlowMoney hợp lệ.");
  if (candidate.databaseVersion > db.verno) throw new Error("Bản sao lưu được tạo bởi phiên bản FlowMoney mới hơn.");
  return candidate;
}

export async function replaceDatabaseFromBackup(backup: FlowMoneyBackup): Promise<void> {
  await db.open();
  const tables = new Map(db.tables.map((table) => [table.name, table]));
  const unknown = Object.keys(backup.tables).find((name) => !tables.has(name));
  if (unknown) throw new Error(`Bản sao lưu chứa bảng không được hỗ trợ: ${unknown}`);
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) {
      await table.clear();
      let rows = backup.tables[table.name] ?? [];
      if (backup.databaseVersion < 3 && table.name === "transactions") rows = rows.map((row) => ({ ...(row as object), status: "posted" }));
      if (backup.databaseVersion < 3 && table.name === "goals") rows = rows.map((row) => ({ ...(row as object), kind: "savings" }));
      if (backup.databaseVersion < 4 && table.name === "goals") rows = rows.map((row) => ({ ...(row as object), isArchived: 0 }));
      if (rows.length) await (table as Table<unknown>).bulkAdd(rows);
    }
  });
  await initializeDatabase();
}

export async function resetDatabase(): Promise<void> {
  await db.open();
  await db.transaction("rw", db.tables, async () => {
    for (const table of db.tables) await table.clear();
  });
  await initializeDatabase();
}

function isBackup(value: unknown): value is FlowMoneyBackup {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.format === BACKUP_FORMAT && item.formatVersion === BACKUP_FORMAT_VERSION &&
    typeof item.databaseVersion === "number" && typeof item.exportedAt === "string" &&
    Boolean(item.tables) && typeof item.tables === "object" && !Array.isArray(item.tables);
}

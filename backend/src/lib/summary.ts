export type CategoryType = "INCOME" | "EXPENSE";

export interface SummaryTransaction {
  categoryId: string;
  amount: number;
  category: { name: string; color: string; type: CategoryType };
}

export interface SummaryBudget {
  id: string;
  categoryId: string;
  limitAmount: number;
  category: { name: string; color: string };
}

export interface HistoryTransaction {
  amount: number;
  date: Date;
  type: CategoryType;
}

export interface CategoryTotal {
  categoryId: string;
  name: string;
  color: string;
  type: CategoryType;
  total: number;
}

export interface BudgetProgress {
  id: string;
  categoryId: string;
  name: string;
  color: string;
  limit: number;
  spent: number;
}

export interface HistoryEntry {
  year: number;
  month: number;
  income: number;
  expense: number;
}

export function buildMonthSummary(
  transactions: SummaryTransaction[],
  budgets: SummaryBudget[],
): {
  income: number;
  expense: number;
  balance: number;
  byCategory: CategoryTotal[];
  budgets: BudgetProgress[];
} {
  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, CategoryTotal>();
  const spentByCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.category.type === "INCOME") income += t.amount;
    else {
      expense += t.amount;
      spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + t.amount);
    }
    const entry = byCategory.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      name: t.category.name,
      color: t.category.color,
      type: t.category.type,
      total: 0,
    };
    entry.total += t.amount;
    byCategory.set(t.categoryId, entry);
  }

  return {
    income,
    expense,
    balance: income - expense,
    byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    budgets: budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      name: b.category.name,
      color: b.category.color,
      limit: b.limitAmount,
      spent: spentByCategory.get(b.categoryId) ?? 0,
    })),
  };
}

/**
 * Agrupa transacciones en los `months` meses que terminan en (year, month),
 * ambos inclusive. Las transacciones fuera de ese rango se ignoran.
 */
export function buildHistory(
  year: number,
  month: number,
  transactions: HistoryTransaction[],
  months = 6,
): HistoryEntry[] {
  const history: HistoryEntry[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    history.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, income: 0, expense: 0 });
  }
  for (const t of transactions) {
    const entry = history.find(
      (h) => h.year === t.date.getUTCFullYear() && h.month === t.date.getUTCMonth() + 1,
    );
    if (!entry) continue;
    if (t.type === "INCOME") entry.income += t.amount;
    else entry.expense += t.amount;
  }
  return history;
}

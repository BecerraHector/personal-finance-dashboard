import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { monthRange } from "../lib/dates.js";

const router = Router();

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

router.get("/", async (req, res) => {
  const { year, month } = querySchema.parse(req.query);
  const { start, end } = monthRange(year, month);

  const [transactions, budgets] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId: req.userId, year, month },
      include: { category: true },
    }),
  ]);

  let income = 0;
  let expense = 0;
  const byCategory = new Map<
    string,
    { categoryId: string; name: string; color: string; type: string; total: number }
  >();
  const spentByCategory = new Map<string, number>();

  for (const t of transactions) {
    const amount = t.amount.toNumber();
    if (t.category.type === "INCOME") income += amount;
    else {
      expense += amount;
      spentByCategory.set(t.categoryId, (spentByCategory.get(t.categoryId) ?? 0) + amount);
    }
    const entry = byCategory.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      name: t.category.name,
      color: t.category.color,
      type: t.category.type,
      total: 0,
    };
    entry.total += amount;
    byCategory.set(t.categoryId, entry);
  }

  // Historial de los últimos 6 meses (incluido el actual) para la gráfica de evolución
  const history: { year: number; month: number; income: number; expense: number }[] = [];
  const historyStart = new Date(Date.UTC(year, month - 6, 1));
  const historyTransactions = await prisma.transaction.findMany({
    where: { userId: req.userId, date: { gte: historyStart, lt: end } },
    include: { category: { select: { type: true } } },
  });
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    history.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, income: 0, expense: 0 });
  }
  for (const t of historyTransactions) {
    const entry = history.find(
      (h) => h.year === t.date.getUTCFullYear() && h.month === t.date.getUTCMonth() + 1,
    );
    if (!entry) continue;
    if (t.category.type === "INCOME") entry.income += t.amount.toNumber();
    else entry.expense += t.amount.toNumber();
  }

  res.json({
    year,
    month,
    income,
    expense,
    balance: income - expense,
    byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    budgets: budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      name: b.category.name,
      color: b.category.color,
      limit: b.limitAmount.toNumber(),
      spent: spentByCategory.get(b.categoryId) ?? 0,
    })),
    history,
  });
});

export default router;

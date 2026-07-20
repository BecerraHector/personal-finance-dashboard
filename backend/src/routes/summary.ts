import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { monthRange } from "../lib/dates.js";
import { buildHistory, buildMonthSummary } from "../lib/summary.js";
import { materializeRecurring } from "../lib/materializeRecurring.js";
import { buildInsights } from "../lib/insights.js";

const router = Router();

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const HISTORY_MONTHS = 6;

router.get("/", async (req, res) => {
  const { year, month } = querySchema.parse(req.query);
  await materializeRecurring(req.userId);
  const { start, end } = monthRange(year, month);
  const historyStart = new Date(Date.UTC(year, month - HISTORY_MONTHS, 1));

  const [transactions, budgets, historyTransactions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end } },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { userId: req.userId, year, month },
      include: { category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: historyStart, lt: end } },
      include: { category: { select: { type: true, name: true } } },
    }),
  ]);

  const summary = buildMonthSummary(
    transactions.map((t) => ({
      categoryId: t.categoryId,
      amount: t.amount.toNumber(),
      category: { name: t.category.name, color: t.category.color, type: t.category.type },
    })),
    budgets.map((b) => ({
      id: b.id,
      categoryId: b.categoryId,
      limitAmount: b.limitAmount.toNumber(),
      category: { name: b.category.name, color: b.category.color },
    })),
  );

  const history = buildHistory(
    year,
    month,
    historyTransactions.map((t) => ({
      amount: t.amount.toNumber(),
      date: t.date,
      type: t.category.type,
    })),
    HISTORY_MONTHS,
  );

  // Desglose del mes anterior (ya está en las transacciones del historial)
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = prevDate.getUTCMonth() + 1;
  const prevByCategory = new Map<
    string,
    { categoryId: string; name: string; type: "INCOME" | "EXPENSE"; total: number }
  >();
  let prevExpense = 0;
  for (const t of historyTransactions) {
    if (t.date.getUTCFullYear() !== prevYear || t.date.getUTCMonth() + 1 !== prevMonth) continue;
    const amount = t.amount.toNumber();
    if (t.category.type === "EXPENSE") prevExpense += amount;
    const entry = prevByCategory.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      name: t.category.name,
      type: t.category.type,
      total: 0,
    };
    entry.total += amount;
    prevByCategory.set(t.categoryId, entry);
  }

  // La proyección de presupuestos solo aplica al mes en curso; para meses
  // pasados se considera el mes completo (y por tanto no proyecta nada).
  const now = new Date();
  const isCurrentMonth = now.getUTCFullYear() === year && now.getUTCMonth() + 1 === month;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const insights = buildInsights({
    income: summary.income,
    expense: summary.expense,
    byCategory: summary.byCategory.map((c) => ({
      ...c,
      type: c.type as "INCOME" | "EXPENSE",
    })),
    prevExpense,
    prevByCategory: [...prevByCategory.values()],
    budgets: summary.budgets.map((b) => ({ name: b.name, limit: b.limit, spent: b.spent })),
    dayOfMonth: isCurrentMonth ? now.getUTCDate() : daysInMonth,
    daysInMonth,
  });

  res.json({ year, month, ...summary, history, insights });
});

export default router;

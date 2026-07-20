import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { monthRange } from "../lib/dates.js";
import { buildHistory, buildMonthSummary } from "../lib/summary.js";

const router = Router();

const querySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

const HISTORY_MONTHS = 6;

router.get("/", async (req, res) => {
  const { year, month } = querySchema.parse(req.query);
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
      include: { category: { select: { type: true } } },
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

  res.json({ year, month, ...summary, history });
});

export default router;

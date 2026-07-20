import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { monthRange } from "../lib/dates.js";
import { transactionsToCsv } from "../lib/csv.js";
import { materializeRecurring } from "../lib/materializeRecurring.js";

const router = Router();

const transactionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().max(200).default(""),
  date: z.coerce.date(),
  categoryId: z.string().min(1),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  categoryId: z.string().optional(),
});

async function ownedCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new HttpError(400, "Categoría inválida");
  return category;
}

router.get("/", async (req, res) => {
  const { year, month, categoryId } = listQuerySchema.parse(req.query);
  await materializeRecurring(req.userId);
  const { start, end } = monthRange(year, month);
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      date: { gte: start, lt: end },
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: true },
    orderBy: { date: "desc" },
  });
  res.json(transactions);
});

router.get("/export", async (req, res) => {
  const { year, month, categoryId } = listQuerySchema.parse(req.query);
  await materializeRecurring(req.userId);
  const { start, end } = monthRange(year, month);
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: req.userId,
      date: { gte: start, lt: end },
      ...(categoryId ? { categoryId } : {}),
    },
    include: { category: { select: { name: true, type: true } } },
    orderBy: { date: "asc" },
  });
  const csv = transactionsToCsv(
    transactions.map((t) => ({
      date: t.date,
      categoryName: t.category.name,
      type: t.category.type,
      description: t.description,
      amount: t.amount.toNumber(),
    })),
  );
  const filename = `transacciones-${year}-${String(month).padStart(2, "0")}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  // BOM para que Excel detecte UTF-8 (tildes en categorías/descripciones)
  const bom = String.fromCharCode(0xfeff);
  res.send(bom + csv);
});

router.post("/", async (req, res) => {
  const data = transactionSchema.parse(req.body);
  await ownedCategory(req.userId, data.categoryId);
  const transaction = await prisma.transaction.create({
    data: { ...data, userId: req.userId },
    include: { category: true },
  });
  res.status(201).json(transaction);
});

router.put("/:id", async (req, res) => {
  const data = transactionSchema.partial().parse(req.body);
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Transacción no encontrada");
  if (data.categoryId) await ownedCategory(req.userId, data.categoryId);
  const transaction = await prisma.transaction.update({
    where: { id: existing.id },
    data,
    include: { category: true },
  });
  res.json(transaction);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.transaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Transacción no encontrada");
  await prisma.transaction.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;

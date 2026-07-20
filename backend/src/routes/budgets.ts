import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

const router = Router();

const budgetSchema = z.object({
  categoryId: z.string().min(1),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  limitAmount: z.coerce.number().positive().multipleOf(0.01),
});

const listQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

router.get("/", async (req, res) => {
  const { year, month } = listQuerySchema.parse(req.query);
  const budgets = await prisma.budget.findMany({
    where: { userId: req.userId, year, month },
    include: { category: true },
  });
  res.json(budgets);
});

router.post("/", async (req, res) => {
  const data = budgetSchema.parse(req.body);
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, userId: req.userId },
  });
  if (!category) throw new HttpError(400, "Categoría inválida");
  if (category.type !== "EXPENSE") {
    throw new HttpError(400, "Solo se pueden presupuestar categorías de gasto");
  }
  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_year_month: {
        userId: req.userId,
        categoryId: data.categoryId,
        year: data.year,
        month: data.month,
      },
    },
    create: { ...data, userId: req.userId },
    update: { limitAmount: data.limitAmount },
    include: { category: true },
  });
  res.status(201).json(budget);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.budget.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Presupuesto no encontrado");
  await prisma.budget.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;

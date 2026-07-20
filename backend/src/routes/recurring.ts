import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

const router = Router();

const recurringSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.coerce.number().positive().multipleOf(0.01),
  description: z.string().max(200).default(""),
  dayOfMonth: z.coerce.number().int().min(1).max(31),
  startDate: z.coerce.date().optional(),
});

const updateSchema = recurringSchema.omit({ startDate: true }).partial().extend({
  active: z.boolean().optional(),
});

async function ownedCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new HttpError(400, "Categoría inválida");
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

router.get("/", async (req, res) => {
  const rules = await prisma.recurringTransaction.findMany({
    where: { userId: req.userId },
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(rules);
});

router.post("/", async (req, res) => {
  const data = recurringSchema.parse(req.body);
  await ownedCategory(req.userId, data.categoryId);
  const rule = await prisma.recurringTransaction.create({
    data: { ...data, startDate: data.startDate ?? todayUTC(), userId: req.userId },
    include: { category: true },
  });
  res.status(201).json(rule);
});

router.put("/:id", async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Regla recurrente no encontrada");
  if (data.categoryId) await ownedCategory(req.userId, data.categoryId);

  // Al reactivar una regla pausada, saltamos el período de pausa: no se
  // generan retroactivamente las ocurrencias que cayeron mientras estaba
  // inactiva.
  const reactivating = data.active === true && !existing.active;
  const rule = await prisma.recurringTransaction.update({
    where: { id: existing.id },
    data: { ...data, ...(reactivating ? { lastGenerated: todayUTC() } : {}) },
    include: { category: true },
  });
  res.json(rule);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.recurringTransaction.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Regla recurrente no encontrada");
  // Las transacciones ya generadas se conservan (recurringId pasa a null)
  await prisma.recurringTransaction.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

router.get("/", async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { userId: req.userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  res.json(categories);
});

router.post("/", async (req, res) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({
    data: { ...data, userId: req.userId },
  });
  res.status(201).json(category);
});

router.put("/:id", async (req, res) => {
  const data = categorySchema.partial().parse(req.body);
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!existing) throw new HttpError(404, "Categoría no encontrada");
  const category = await prisma.category.update({ where: { id: existing.id }, data });
  res.json(category);
});

router.delete("/:id", async (req, res) => {
  const existing = await prisma.category.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { _count: { select: { transactions: true } } },
  });
  if (!existing) throw new HttpError(404, "Categoría no encontrada");
  if (existing._count.transactions > 0) {
    throw new HttpError(409, "No se puede eliminar una categoría con transacciones");
  }
  await prisma.category.delete({ where: { id: existing.id } });
  res.status(204).end();
});

export default router;

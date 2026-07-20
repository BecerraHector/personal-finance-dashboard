import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/error.js";
import { buildGoalProgress } from "../lib/goals.js";

const router = Router();

const goalSchema = z.object({
  name: z.string().min(1).max(100),
  targetAmount: z.coerce.number().positive().multipleOf(0.01),
  targetYear: z.coerce.number().int().min(2000).max(2100),
  targetMonth: z.coerce.number().int().min(1).max(12),
});

const contributionSchema = z.object({
  amount: z.coerce.number().positive().multipleOf(0.01),
  note: z.string().max(200).default(""),
  date: z.coerce.date().optional(),
});

function assertFutureDeadline(targetYear: number, targetMonth: number) {
  const now = new Date();
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const deadline = targetYear * 12 + (targetMonth - 1);
  if (deadline < current) {
    throw new HttpError(400, "El mes límite no puede estar en el pasado");
  }
}

async function ownedGoal(userId: string, goalId: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new HttpError(404, "Meta no encontrada");
  return goal;
}

function withProgress(goal: {
  id: string;
  name: string;
  targetAmount: { toNumber(): number };
  targetYear: number;
  targetMonth: number;
  createdAt: Date;
  contributions: { id: string; amount: { toNumber(): number }; note: string; date: Date }[];
}) {
  const saved = goal.contributions.reduce((sum, c) => sum + c.amount.toNumber(), 0);
  const progress = buildGoalProgress({
    targetAmount: goal.targetAmount.toNumber(),
    saved,
    createdAt: goal.createdAt,
    targetYear: goal.targetYear,
    targetMonth: goal.targetMonth,
    now: new Date(),
  });
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount.toNumber(),
    targetYear: goal.targetYear,
    targetMonth: goal.targetMonth,
    createdAt: goal.createdAt,
    contributions: goal.contributions.map((c) => ({
      id: c.id,
      amount: c.amount.toNumber(),
      note: c.note,
      date: c.date,
    })),
    ...progress,
  };
}

const includeContributions = { contributions: { orderBy: { date: "desc" as const } } };

router.get("/", async (req, res) => {
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: req.userId },
    include: includeContributions,
    orderBy: { createdAt: "asc" },
  });
  res.json(goals.map(withProgress));
});

router.post("/", async (req, res) => {
  const data = goalSchema.parse(req.body);
  assertFutureDeadline(data.targetYear, data.targetMonth);
  const goal = await prisma.savingsGoal.create({
    data: { ...data, userId: req.userId },
    include: includeContributions,
  });
  res.status(201).json(withProgress(goal));
});

router.put("/:id", async (req, res) => {
  const data = goalSchema.partial().parse(req.body);
  const existing = await ownedGoal(req.userId, req.params.id);
  if (data.targetYear !== undefined || data.targetMonth !== undefined) {
    assertFutureDeadline(
      data.targetYear ?? existing.targetYear,
      data.targetMonth ?? existing.targetMonth,
    );
  }
  const goal = await prisma.savingsGoal.update({
    where: { id: existing.id },
    data,
    include: includeContributions,
  });
  res.json(withProgress(goal));
});

router.delete("/:id", async (req, res) => {
  const existing = await ownedGoal(req.userId, req.params.id);
  await prisma.savingsGoal.delete({ where: { id: existing.id } });
  res.status(204).end();
});

router.post("/:id/contributions", async (req, res) => {
  const data = contributionSchema.parse(req.body);
  const goal = await ownedGoal(req.userId, req.params.id);
  await prisma.goalContribution.create({
    data: { ...data, goalId: goal.id, userId: req.userId },
  });
  const updated = await prisma.savingsGoal.findUniqueOrThrow({
    where: { id: goal.id },
    include: includeContributions,
  });
  res.status(201).json(withProgress(updated));
});

router.delete("/:id/contributions/:contributionId", async (req, res) => {
  await ownedGoal(req.userId, req.params.id);
  const contribution = await prisma.goalContribution.findFirst({
    where: { id: req.params.contributionId, goalId: req.params.id, userId: req.userId },
  });
  if (!contribution) throw new HttpError(404, "Aporte no encontrado");
  await prisma.goalContribution.delete({ where: { id: contribution.id } });
  res.status(204).end();
});

export default router;

import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { signToken } from "../lib/jwt.js";
import { DEFAULT_CATEGORIES } from "../lib/defaultCategories.js";
import { requireAuth } from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string(),
});

function publicUser(user: { id: string; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new HttpError(409, "Ya existe una cuenta con ese correo");

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      categories: { create: DEFAULT_CATEGORIES },
    },
  });
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  const valid = user && (await bcrypt.compare(data.password, user.passwordHash));
  if (!valid) throw new HttpError(401, "Correo o contraseña incorrectos");
  res.json({ token: signToken(user.id), user: publicUser(user) });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) throw new HttpError(401, "No autorizado");
  res.json({ user: publicUser(user) });
});

export default router;

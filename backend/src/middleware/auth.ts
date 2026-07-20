import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    userId: string;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  req.userId = userId;
  next();
}

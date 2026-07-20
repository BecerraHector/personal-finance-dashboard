import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import categoriesRouter from "./routes/categories.js";
import transactionsRouter from "./routes/transactions.js";
import budgetsRouter from "./routes/budgets.js";
import summaryRouter from "./routes/summary.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/categories", requireAuth, categoriesRouter);
  app.use("/api/transactions", requireAuth, transactionsRouter);
  app.use("/api/budgets", requireAuth, budgetsRouter);
  app.use("/api/summary", requireAuth, summaryRouter);

  app.use(errorHandler);
  return app;
}

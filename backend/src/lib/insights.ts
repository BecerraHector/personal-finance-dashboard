export type InsightSeverity = "good" | "warning" | "info";

export interface Insight {
  type: string;
  severity: InsightSeverity;
  message: string;
}

interface CategoryTotal {
  categoryId: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  total: number;
}

export interface InsightsInput {
  income: number;
  expense: number;
  byCategory: CategoryTotal[];
  prevExpense: number;
  prevByCategory: CategoryTotal[];
  budgets: { name: string; limit: number; spent: number }[];
  /** Día del mes en curso (1-31) y días totales, para proyectar presupuestos */
  dayOfMonth: number;
  daysInMonth: number;
}

const pct = (value: number) => Math.round(value * 100);
const SEVERITY_ORDER: InsightSeverity[] = ["warning", "good", "info"];
const MAX_INSIGHTS = 5;

/**
 * Observaciones automáticas del mes. Los umbrales son relativos al gasto
 * total (no montos fijos) para que funcionen en cualquier moneda y escala.
 */
export function buildInsights(input: InsightsInput): Insight[] {
  const { income, expense, byCategory, prevExpense, prevByCategory, budgets } = input;
  const out: Insight[] = [];

  // Cambios significativos por categoría de gasto vs. el mes pasado:
  // al menos ±20% y una diferencia mayor al 5% del gasto mensual de referencia.
  const floor = 0.05 * Math.max(expense, prevExpense);
  const prevById = new Map(
    prevByCategory.filter((c) => c.type === "EXPENSE").map((c) => [c.categoryId, c]),
  );
  for (const cat of byCategory.filter((c) => c.type === "EXPENSE")) {
    const prev = prevById.get(cat.categoryId);
    if (!prev || prev.total === 0) {
      if (prevExpense > 0 && cat.total >= floor) {
        out.push({
          type: "new-category",
          severity: "info",
          message: `Este mes apareció un gasto que el mes pasado no tenías: ${cat.name}.`,
        });
      }
      continue;
    }
    const change = (cat.total - prev.total) / prev.total;
    if (Math.abs(change) >= 0.2 && Math.abs(cat.total - prev.total) >= floor) {
      out.push({
        type: "category-change",
        severity: change > 0 ? "warning" : "good",
        message:
          change > 0
            ? `Gastaste ${pct(change)}% más en ${cat.name} que el mes pasado.`
            : `Gastaste ${pct(-change)}% menos en ${cat.name} que el mes pasado.`,
      });
    }
  }

  // Variación del gasto total
  if (prevExpense > 0 && expense > 0) {
    const change = (expense - prevExpense) / prevExpense;
    if (Math.abs(change) >= 0.15) {
      out.push({
        type: "total-change",
        severity: change > 0 ? "warning" : "good",
        message:
          change > 0
            ? `Tus gastos totales subieron ${pct(change)}% respecto al mes pasado.`
            : `Tus gastos totales bajaron ${pct(-change)}% respecto al mes pasado.`,
      });
    }
  }

  // Tasa de ahorro del mes
  if (income > 0) {
    const rate = (income - expense) / income;
    if (rate >= 0.1) {
      out.push({
        type: "savings-rate",
        severity: "good",
        message: `Ahorraste el ${pct(rate)}% de tus ingresos este mes.`,
      });
    } else if (rate < 0) {
      out.push({
        type: "overspend",
        severity: "warning",
        message: "Gastaste más de lo que ingresó este mes.",
      });
    }
  }

  // Proyección de presupuestos al ritmo actual (con al menos una semana de datos)
  if (input.dayOfMonth >= 7) {
    for (const b of budgets) {
      if (b.spent >= b.limit || b.limit <= 0) continue;
      const projected = (b.spent / input.dayOfMonth) * input.daysInMonth;
      if (projected > b.limit * 1.05) {
        out.push({
          type: "budget-pace",
          severity: "warning",
          message: `Al ritmo actual superarías el presupuesto de ${b.name} antes de fin de mes.`,
        });
      }
    }
  }

  // Concentración del gasto en una categoría
  const topExpense = byCategory
    .filter((c) => c.type === "EXPENSE")
    .sort((a, b) => b.total - a.total)[0];
  if (topExpense && expense > 0 && topExpense.total / expense >= 0.45) {
    out.push({
      type: "top-category",
      severity: "info",
      message: `${topExpense.name} concentró el ${pct(topExpense.total / expense)}% de tus gastos.`,
    });
  }

  return out
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity))
    .slice(0, MAX_INSIGHTS);
}

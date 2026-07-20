import { describe, expect, it } from "vitest";
import { buildInsights, type InsightsInput } from "./insights.js";

const cat = (categoryId: string, total: number, type: "INCOME" | "EXPENSE" = "EXPENSE") => ({
  categoryId,
  name: categoryId,
  type,
  total,
});

const base: InsightsInput = {
  income: 0,
  expense: 0,
  byCategory: [],
  prevExpense: 0,
  prevByCategory: [],
  budgets: [],
  dayOfMonth: 15,
  daysInMonth: 30,
};

const types = (input: Partial<InsightsInput>) =>
  buildInsights({ ...base, ...input }).map((i) => i.type);

describe("buildInsights", () => {
  it("sin datos no genera nada", () => {
    expect(buildInsights(base)).toEqual([]);
  });

  it("detecta un aumento significativo en una categoría", () => {
    const insights = buildInsights({
      ...base,
      expense: 130000,
      byCategory: [cat("Comida", 130000)],
      prevExpense: 100000,
      prevByCategory: [cat("Comida", 100000)],
    });
    const change = insights.find((i) => i.type === "category-change");
    expect(change?.severity).toBe("warning");
    expect(change?.message).toContain("30% más en Comida");
  });

  it("detecta una baja significativa como positiva", () => {
    const insights = buildInsights({
      ...base,
      expense: 50000,
      byCategory: [cat("Comida", 50000)],
      prevExpense: 100000,
      prevByCategory: [cat("Comida", 100000)],
    });
    const change = insights.find((i) => i.type === "category-change");
    expect(change?.severity).toBe("good");
    expect(change?.message).toContain("50% menos");
  });

  it("ignora cambios porcentuales grandes pero de monto insignificante", () => {
    // Transporte sube 100% pero son $200 sobre un gasto mensual de $100.000
    expect(
      types({
        expense: 100000,
        byCategory: [cat("Transporte", 400), cat("Renta", 99600)],
        prevExpense: 99800,
        prevByCategory: [cat("Transporte", 200), cat("Renta", 99600)],
      }),
    ).not.toContain("category-change");
  });

  it("detecta un gasto nuevo relevante y omite los menores", () => {
    const insightTypes = types({
      expense: 100000,
      byCategory: [cat("Renta", 90000), cat("Mascotas", 8000), cat("Chicles", 2000)],
      prevExpense: 90000,
      prevByCategory: [cat("Renta", 90000)],
    });
    // Mascotas (8% del gasto) sí; Chicles (2%) no
    const insights = buildInsights({
      ...base,
      expense: 100000,
      byCategory: [cat("Renta", 90000), cat("Mascotas", 8000), cat("Chicles", 2000)],
      prevExpense: 90000,
      prevByCategory: [cat("Renta", 90000)],
    });
    expect(insightTypes).toContain("new-category");
    expect(insights.filter((i) => i.type === "new-category")).toHaveLength(1);
    expect(insights.find((i) => i.type === "new-category")?.message).toContain("Mascotas");
  });

  it("no marca gastos nuevos en el primer mes de uso (sin mes anterior)", () => {
    expect(
      types({
        expense: 100000,
        byCategory: [cat("Renta", 100000)],
        prevExpense: 0,
        prevByCategory: [],
      }),
    ).not.toContain("new-category");
  });

  it("reporta variación del gasto total en ambas direcciones", () => {
    const up = buildInsights({
      ...base,
      expense: 120000,
      byCategory: [],
      prevExpense: 100000,
    }).find((i) => i.type === "total-change");
    expect(up?.severity).toBe("warning");
    expect(up?.message).toContain("subieron 20%");

    const down = buildInsights({
      ...base,
      expense: 80000,
      byCategory: [],
      prevExpense: 100000,
    }).find((i) => i.type === "total-change");
    expect(down?.severity).toBe("good");
  });

  it("celebra la tasa de ahorro y advierte el sobregasto", () => {
    const saving = buildInsights({ ...base, income: 100000, expense: 60000 }).find(
      (i) => i.type === "savings-rate",
    );
    expect(saving?.message).toContain("40%");

    expect(types({ income: 100000, expense: 110000 })).toContain("overspend");
  });

  it("proyecta presupuestos que van camino a excederse", () => {
    // Día 15 de 30: gastado 60% del límite → proyección 120%
    const insights = buildInsights({
      ...base,
      budgets: [{ name: "Comida", limit: 100000, spent: 60000 }],
    });
    expect(insights.find((i) => i.type === "budget-pace")?.message).toContain("Comida");
  });

  it("no proyecta presupuestos con pocos días de datos ni ya excedidos", () => {
    expect(
      types({ dayOfMonth: 3, budgets: [{ name: "Comida", limit: 100000, spent: 60000 }] }),
    ).not.toContain("budget-pace");
    expect(
      types({ budgets: [{ name: "Comida", limit: 100000, spent: 120000 }] }),
    ).not.toContain("budget-pace");
  });

  it("señala cuando una categoría concentra la mayoría del gasto", () => {
    const insight = buildInsights({
      ...base,
      expense: 100000,
      byCategory: [cat("Renta", 60000), cat("Comida", 40000)],
    }).find((i) => i.type === "top-category");
    expect(insight?.message).toContain("Renta concentró el 60%");
  });

  it("ordena advertencias primero y limita a 5 insights", () => {
    const insights = buildInsights({
      ...base,
      income: 100000,
      expense: 200000,
      byCategory: [
        cat("Comida", 60000),
        cat("Renta", 90000),
        cat("Transporte", 30000),
        cat("Salud", 20000),
      ],
      prevExpense: 100000,
      prevByCategory: [
        cat("Comida", 30000),
        cat("Renta", 45000),
        cat("Transporte", 15000),
        cat("Salud", 10000),
      ],
      budgets: [{ name: "Comida", limit: 100000, spent: 60000 }],
    });
    expect(insights.length).toBeLessThanOrEqual(5);
    expect(insights[0].severity).toBe("warning");
    const severities = insights.map((i) => i.severity);
    expect(severities).toEqual([...severities].sort(
      (a, b) => ["warning", "good", "info"].indexOf(a) - ["warning", "good", "info"].indexOf(b),
    ));
  });
});

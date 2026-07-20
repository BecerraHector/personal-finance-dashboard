import { describe, expect, it } from "vitest";
import {
  buildHistory,
  buildMonthSummary,
  type SummaryBudget,
  type SummaryTransaction,
} from "./summary.js";

const cat = (id: string, type: "INCOME" | "EXPENSE", name = id) => ({
  categoryId: id,
  category: { name, color: "#2a78d6", type },
});

const tx = (
  id: string,
  type: "INCOME" | "EXPENSE",
  amount: number,
): SummaryTransaction => ({ ...cat(id, type), amount });

describe("buildMonthSummary", () => {
  it("suma ingresos y gastos por separado y calcula el balance", () => {
    const result = buildMonthSummary(
      [tx("salario", "INCOME", 25000), tx("comida", "EXPENSE", 1450.5), tx("renta", "EXPENSE", 7500)],
      [],
    );
    expect(result.income).toBe(25000);
    expect(result.expense).toBe(8950.5);
    expect(result.balance).toBe(16049.5);
  });

  it("devuelve todo en cero sin transacciones", () => {
    const result = buildMonthSummary([], []);
    expect(result).toMatchObject({ income: 0, expense: 0, balance: 0 });
    expect(result.byCategory).toEqual([]);
    expect(result.budgets).toEqual([]);
  });

  it("acumula varias transacciones de la misma categoría y ordena por total descendente", () => {
    const result = buildMonthSummary(
      [
        tx("comida", "EXPENSE", 100),
        tx("comida", "EXPENSE", 250),
        tx("renta", "EXPENSE", 7500),
        tx("transporte", "EXPENSE", 40),
      ],
      [],
    );
    expect(result.byCategory.map((c) => c.categoryId)).toEqual(["renta", "comida", "transporte"]);
    expect(result.byCategory[1].total).toBe(350);
  });

  it("el balance puede ser negativo", () => {
    const result = buildMonthSummary([tx("comida", "EXPENSE", 500)], []);
    expect(result.balance).toBe(-500);
  });

  it("calcula el gasto de cada presupuesto solo con transacciones de su categoría", () => {
    const budgets: SummaryBudget[] = [
      { id: "b1", categoryId: "comida", limitAmount: 4000, category: { name: "Comida", color: "#2a78d6" } },
      { id: "b2", categoryId: "transporte", limitAmount: 1500, category: { name: "Transporte", color: "#008300" } },
    ];
    const result = buildMonthSummary(
      [tx("comida", "EXPENSE", 1450.5), tx("renta", "EXPENSE", 7500)],
      budgets,
    );
    expect(result.budgets).toEqual([
      expect.objectContaining({ id: "b1", limit: 4000, spent: 1450.5 }),
      expect.objectContaining({ id: "b2", limit: 1500, spent: 0 }),
    ]);
  });

  it("un presupuesto excedido reporta el gasto real, sin recortar al límite", () => {
    const budgets: SummaryBudget[] = [
      { id: "b1", categoryId: "comida", limitAmount: 1000, category: { name: "Comida", color: "#2a78d6" } },
    ];
    const result = buildMonthSummary([tx("comida", "EXPENSE", 1800)], budgets);
    expect(result.budgets[0].spent).toBe(1800);
  });

  it("los ingresos no cuentan como gasto de un presupuesto de la misma categoría", () => {
    const budgets: SummaryBudget[] = [
      { id: "b1", categoryId: "mixta", limitAmount: 1000, category: { name: "Mixta", color: "#2a78d6" } },
    ];
    const result = buildMonthSummary([tx("mixta", "INCOME", 900)], budgets);
    expect(result.budgets[0].spent).toBe(0);
  });
});

describe("buildHistory", () => {
  const htx = (iso: string, type: "INCOME" | "EXPENSE", amount: number) => ({
    date: new Date(iso),
    type,
    amount,
  });

  it("genera 6 meses en orden cronológico terminando en el mes pedido", () => {
    const history = buildHistory(2026, 7, []);
    expect(history).toHaveLength(6);
    expect(history[0]).toMatchObject({ year: 2026, month: 2 });
    expect(history[5]).toMatchObject({ year: 2026, month: 7 });
  });

  it("cruza el límite de año hacia atrás", () => {
    const history = buildHistory(2026, 2, []);
    expect(history.map((h) => `${h.year}-${h.month}`)).toEqual([
      "2025-9",
      "2025-10",
      "2025-11",
      "2025-12",
      "2026-1",
      "2026-2",
    ]);
  });

  it("agrupa montos en el mes correcto según la fecha UTC", () => {
    const history = buildHistory(2026, 7, [
      htx("2026-07-15T10:00:00.000Z", "INCOME", 25000),
      htx("2026-07-20T10:00:00.000Z", "EXPENSE", 300),
      htx("2026-06-01T00:00:00.000Z", "EXPENSE", 6900),
    ]);
    const july = history.find((h) => h.month === 7)!;
    const june = history.find((h) => h.month === 6)!;
    expect(july).toMatchObject({ income: 25000, expense: 300 });
    expect(june).toMatchObject({ income: 0, expense: 6900 });
  });

  it("ignora transacciones fuera de la ventana", () => {
    const history = buildHistory(2026, 7, [
      htx("2026-01-15T00:00:00.000Z", "EXPENSE", 999),
      htx("2026-08-01T00:00:00.000Z", "EXPENSE", 999),
    ]);
    expect(history.every((h) => h.income === 0 && h.expense === 0)).toBe(true);
  });

  it("respeta un número de meses distinto", () => {
    const history = buildHistory(2026, 7, [], 12);
    expect(history).toHaveLength(12);
    expect(history[0]).toMatchObject({ year: 2025, month: 8 });
  });
});

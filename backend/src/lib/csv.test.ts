import { describe, expect, it } from "vitest";
import { transactionsToCsv, type CsvTransaction } from "./csv.js";

const row = (overrides: Partial<CsvTransaction> = {}): CsvTransaction => ({
  date: new Date("2026-07-05T00:00:00.000Z"),
  categoryName: "Comida",
  type: "EXPENSE",
  description: "Súper semanal",
  amount: 1450.5,
  ...overrides,
});

describe("transactionsToCsv", () => {
  it("genera encabezado y una línea por transacción con CRLF", () => {
    const csv = transactionsToCsv([row()]);
    expect(csv).toBe(
      "Fecha,Categoría,Tipo,Descripción,Monto\r\n2026-07-05,Comida,Gasto,Súper semanal,1450.5\r\n",
    );
  });

  it("solo el encabezado cuando no hay transacciones", () => {
    expect(transactionsToCsv([])).toBe("Fecha,Categoría,Tipo,Descripción,Monto\r\n");
  });

  it("marca los ingresos como Ingreso", () => {
    const csv = transactionsToCsv([row({ type: "INCOME", categoryName: "Salario" })]);
    expect(csv).toContain("Salario,Ingreso,");
  });

  it("entrecomilla valores con comas y escapa comillas dobles", () => {
    const csv = transactionsToCsv([
      row({ description: 'Cena, restaurante "El Bueno"' }),
    ]);
    expect(csv).toContain('"Cena, restaurante ""El Bueno"""');
  });

  it("entrecomilla valores con saltos de línea", () => {
    const csv = transactionsToCsv([row({ description: "línea1\nlínea2" })]);
    expect(csv).toContain('"línea1\nlínea2"');
  });

  it("usa la fecha en formato ISO (YYYY-MM-DD) según UTC", () => {
    const csv = transactionsToCsv([row({ date: new Date("2026-12-31T23:00:00.000Z") })]);
    expect(csv).toContain("2026-12-31,");
  });
});

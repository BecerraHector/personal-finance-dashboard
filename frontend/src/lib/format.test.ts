import { describe, expect, it } from "vitest";
import { formatMoney, monthLabel, shortMonthLabel } from "./format.ts";

// Intl puede usar espacios no separables; normalizamos para comparar
const plain = (s: string) => s.replace(/ /g, " ");

describe("formatMoney", () => {
  it("formatea números como moneda con dos decimales", () => {
    expect(plain(formatMoney(1450.5))).toContain("1,450.50");
    expect(plain(formatMoney(25000))).toContain("25,000.00");
  });

  it("acepta montos como string (Decimal serializado de la API)", () => {
    expect(plain(formatMoney("7500"))).toContain("7,500.00");
  });

  it("formatea negativos", () => {
    expect(plain(formatMoney(-500))).toContain("500.00");
    expect(formatMoney(-500)).toMatch(/-/);
  });
});

describe("monthLabel", () => {
  it("devuelve el nombre del mes en español y el año", () => {
    expect(monthLabel(2026, 7)).toBe("Julio 2026");
    expect(monthLabel(2027, 1)).toBe("Enero 2027");
  });
});

describe("shortMonthLabel", () => {
  it("abrevia a tres letras", () => {
    expect(shortMonthLabel(9)).toBe("Sep");
    expect(shortMonthLabel(12)).toBe("Dic");
  });
});

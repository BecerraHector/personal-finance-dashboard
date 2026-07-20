import { describe, expect, it } from "vitest";
import { shiftMonth } from "./month.ts";

describe("shiftMonth", () => {
  it("avanza un mes dentro del mismo año", () => {
    expect(shiftMonth({ year: 2026, month: 7 }, 1)).toEqual({ year: 2026, month: 8 });
  });

  it("retrocede un mes dentro del mismo año", () => {
    expect(shiftMonth({ year: 2026, month: 7 }, -1)).toEqual({ year: 2026, month: 6 });
  });

  it("cruza hacia el año siguiente desde diciembre", () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
  });

  it("cruza hacia el año anterior desde enero", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("soporta saltos de varios meses", () => {
    expect(shiftMonth({ year: 2026, month: 7 }, -18)).toEqual({ year: 2025, month: 1 });
    expect(shiftMonth({ year: 2026, month: 7 }, 6)).toEqual({ year: 2027, month: 1 });
  });

  it("delta cero devuelve el mismo mes", () => {
    expect(shiftMonth({ year: 2026, month: 7 }, 0)).toEqual({ year: 2026, month: 7 });
  });
});

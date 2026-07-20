import { describe, expect, it } from "vitest";
import { monthRange } from "./dates.js";

describe("monthRange", () => {
  it("devuelve el primer día del mes y el primer día del mes siguiente en UTC", () => {
    const { start, end } = monthRange(2026, 7);
    expect(start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("cruza el límite de año en diciembre", () => {
    const { start, end } = monthRange(2026, 12);
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("incluye una transacción del último instante del mes y excluye la del siguiente", () => {
    const { start, end } = monthRange(2026, 2);
    const lastMoment = new Date("2026-02-28T23:59:59.999Z");
    const nextMonth = new Date("2026-03-01T00:00:00.000Z");
    expect(lastMoment >= start && lastMoment < end).toBe(true);
    expect(nextMonth >= start && nextMonth < end).toBe(false);
  });

  it("maneja febrero en año bisiesto", () => {
    const { end } = monthRange(2028, 2);
    expect(end.toISOString()).toBe("2028-03-01T00:00:00.000Z");
    const leapDay = new Date("2028-02-29T12:00:00.000Z");
    const { start } = monthRange(2028, 2);
    expect(leapDay >= start && leapDay < end).toBe(true);
  });
});

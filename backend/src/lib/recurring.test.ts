import { describe, expect, it } from "vitest";
import { occurrenceInMonth, pendingOccurrences } from "./recurring.js";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("occurrenceInMonth", () => {
  it("devuelve el día pedido cuando existe en el mes", () => {
    expect(occurrenceInMonth(2026, 6, 15).toISOString()).toBe("2026-07-15T00:00:00.000Z");
  });

  it("recorta al último día del mes cuando el día no existe", () => {
    expect(occurrenceInMonth(2026, 1, 31).toISOString()).toBe("2026-02-28T00:00:00.000Z");
    expect(occurrenceInMonth(2026, 3, 31).toISOString()).toBe("2026-04-30T00:00:00.000Z");
  });

  it("respeta el 29 de febrero en año bisiesto", () => {
    expect(occurrenceInMonth(2028, 1, 31).toISOString()).toBe("2028-02-29T00:00:00.000Z");
  });
});

describe("pendingOccurrences", () => {
  it("genera la ocurrencia del mes actual si el día ya pasó", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-07-01"),
      lastGenerated: null,
      today: utc("2026-07-19"),
      dayOfMonth: 15,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-07-15"]);
  });

  it("no genera nada si el día del mes aún no llega", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-07-01"),
      lastGenerated: null,
      today: utc("2026-07-19"),
      dayOfMonth: 25,
    });
    expect(out).toEqual([]);
  });

  it("incluye la ocurrencia del mismo día (today inclusive)", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-07-01"),
      lastGenerated: null,
      today: utc("2026-07-19"),
      dayOfMonth: 19,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-07-19"]);
  });

  it("hace catch-up de varios meses perdidos, cruzando el año", () => {
    const out = pendingOccurrences({
      startDate: utc("2025-11-10"),
      lastGenerated: null,
      today: utc("2026-02-15"),
      dayOfMonth: 10,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2025-11-10",
      "2025-12-10",
      "2026-01-10",
      "2026-02-10",
    ]);
  });

  it("excluye lo ya generado (lastGenerated exclusivo)", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-05-01"),
      lastGenerated: utc("2026-06-15"),
      today: utc("2026-07-19"),
      dayOfMonth: 15,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-07-15"]);
  });

  it("no genera ocurrencias anteriores a startDate", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-07-20"),
      lastGenerated: null,
      today: utc("2026-08-31"),
      dayOfMonth: 15,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual(["2026-08-15"]);
  });

  it("recorta el día 31 en meses cortos durante el catch-up", () => {
    const out = pendingOccurrences({
      startDate: utc("2026-01-31"),
      lastGenerated: null,
      today: utc("2026-04-30"),
      dayOfMonth: 31,
    });
    expect(out.map((d) => d.toISOString().slice(0, 10))).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
  });
});

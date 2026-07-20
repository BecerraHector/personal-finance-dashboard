import { describe, expect, it } from "vitest";
import { buildGoalProgress } from "./goals.js";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

// Meta base: creada en julio 2026, objetivo $600.000 para diciembre 2026
// (6 meses en total: julio a diciembre inclusive)
const base = {
  targetAmount: 600000,
  createdAt: utc("2026-07-19"),
  targetYear: 2026,
  targetMonth: 12,
};

describe("buildGoalProgress", () => {
  it("recién creada: en camino, sugiere el objetivo dividido en los meses disponibles", () => {
    const p = buildGoalProgress({ ...base, saved: 0, now: utc("2026-07-19") });
    expect(p.status).toBe("ON_TRACK");
    expect(p.monthsLeft).toBe(6);
    expect(p.suggestedMonthly).toBe(100000);
    expect(p.pct).toBe(0);
  });

  it("al ritmo esperado sigue en camino", () => {
    // En octubre (3 meses transcurridos de 6) lo esperado es 300.000
    const p = buildGoalProgress({ ...base, saved: 300000, now: utc("2026-10-10") });
    expect(p.status).toBe("ON_TRACK");
    expect(p.monthsLeft).toBe(3);
    expect(p.suggestedMonthly).toBe(100000);
  });

  it("por debajo del ritmo esperado queda atrasada y la sugerencia sube", () => {
    const p = buildGoalProgress({ ...base, saved: 150000, now: utc("2026-10-10") });
    expect(p.status).toBe("BEHIND");
    expect(p.suggestedMonthly).toBe(150000); // 450.000 restantes / 3 meses
  });

  it("completada cuando lo ahorrado alcanza el objetivo, aunque sobre tiempo", () => {
    const p = buildGoalProgress({ ...base, saved: 600000, now: utc("2026-09-01") });
    expect(p.status).toBe("COMPLETED");
    expect(p.suggestedMonthly).toBe(0);
    expect(p.remaining).toBe(0);
    expect(p.pct).toBe(100);
  });

  it("el porcentaje se recorta a 100 aunque se ahorre de más", () => {
    const p = buildGoalProgress({ ...base, saved: 900000, now: utc("2026-09-01") });
    expect(p.pct).toBe(100);
    expect(p.status).toBe("COMPLETED");
  });

  it("vencida si pasó el mes límite sin completarse", () => {
    const p = buildGoalProgress({ ...base, saved: 400000, now: utc("2027-01-05") });
    expect(p.status).toBe("OVERDUE");
    expect(p.monthsLeft).toBe(0);
    expect(p.suggestedMonthly).toBe(200000); // lo que falta, de una vez
  });

  it("el mes límite cuenta como último mes disponible", () => {
    const p = buildGoalProgress({ ...base, saved: 0, now: utc("2026-12-15") });
    expect(p.monthsLeft).toBe(1);
    expect(p.suggestedMonthly).toBe(600000);
  });

  it("cruza años al calcular meses restantes", () => {
    const p = buildGoalProgress({
      targetAmount: 1200000,
      createdAt: utc("2026-11-01"),
      targetYear: 2027,
      targetMonth: 10,
      saved: 0,
      now: utc("2026-11-01"),
    });
    expect(p.monthsLeft).toBe(12);
    expect(p.suggestedMonthly).toBe(100000);
  });
});

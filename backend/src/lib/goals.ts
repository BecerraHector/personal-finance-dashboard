export type GoalStatus = "COMPLETED" | "ON_TRACK" | "BEHIND" | "OVERDUE";

export interface GoalProgress {
  saved: number;
  remaining: number;
  pct: number;
  monthsLeft: number;
  suggestedMonthly: number;
  status: GoalStatus;
}

/** Meses de (y1,m1) a (y2,m2), ambos inclusive. Negativo o cero si ya pasó. */
function monthsInclusive(y1: number, m1: number, y2: number, m2: number): number {
  return (y2 - y1) * 12 + (m2 - m1) + 1;
}

/**
 * Progreso de una meta. "En camino" compara lo ahorrado contra el ritmo
 * lineal esperado entre el mes de creación y el mes límite: al llevar la
 * mitad de los meses, debería haber al menos la mitad del objetivo.
 */
export function buildGoalProgress(opts: {
  targetAmount: number;
  saved: number;
  createdAt: Date;
  targetYear: number;
  targetMonth: number;
  now: Date;
}): GoalProgress {
  const { targetAmount, saved, createdAt, targetYear, targetMonth, now } = opts;
  const startYear = createdAt.getUTCFullYear();
  const startMonth = createdAt.getUTCMonth() + 1;
  const nowYear = now.getUTCFullYear();
  const nowMonth = now.getUTCMonth() + 1;

  const remaining = Math.max(0, targetAmount - saved);
  const pct = targetAmount > 0 ? Math.min(100, (saved / targetAmount) * 100) : 100;
  const monthsLeft = Math.max(0, monthsInclusive(nowYear, nowMonth, targetYear, targetMonth));

  if (saved >= targetAmount) {
    return { saved, remaining, pct, monthsLeft, suggestedMonthly: 0, status: "COMPLETED" };
  }
  if (monthsLeft === 0) {
    return { saved, remaining, pct, monthsLeft, suggestedMonthly: remaining, status: "OVERDUE" };
  }

  const suggestedMonthly = remaining / monthsLeft;
  const totalMonths = Math.max(1, monthsInclusive(startYear, startMonth, targetYear, targetMonth));
  const elapsed = Math.min(
    totalMonths,
    Math.max(0, monthsInclusive(startYear, startMonth, nowYear, nowMonth) - 1),
  );
  const expected = targetAmount * (elapsed / totalMonths);
  const status: GoalStatus = saved >= expected ? "ON_TRACK" : "BEHIND";
  return { saved, remaining, pct, monthsLeft, suggestedMonthly, status };
}

/**
 * Fecha (UTC, medianoche) en que cae la ocurrencia del mes dado. Si el día
 * pedido no existe en ese mes (p. ej. 31 en febrero), se usa el último día.
 */
export function occurrenceInMonth(year: number, monthIndex: number, dayOfMonth: number): Date {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(dayOfMonth, lastDay)));
}

/**
 * Ocurrencias pendientes de generar: posteriores a lastGenerated (si existe),
 * no anteriores a startDate y no posteriores a today.
 */
export function pendingOccurrences(opts: {
  startDate: Date;
  lastGenerated: Date | null;
  today: Date;
  dayOfMonth: number;
}): Date[] {
  const { startDate, lastGenerated, today, dayOfMonth } = opts;
  const out: Date[] = [];
  let year = startDate.getUTCFullYear();
  let month = startDate.getUTCMonth();
  const endYear = today.getUTCFullYear();
  const endMonth = today.getUTCMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const occ = occurrenceInMonth(year, month, dayOfMonth);
    if (occ >= startDate && occ <= today && (!lastGenerated || occ > lastGenerated)) {
      out.push(occ);
    }
    month += 1;
    if (month === 12) {
      month = 0;
      year += 1;
    }
  }
  return out;
}

export const LOCALE = "es-CL";
export const CURRENCY = "CLP";

// CLP no usa decimales: Intl redondea al peso entero
const currency = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
});

export function formatMoney(value: number | string): string {
  return currency.format(typeof value === "string" ? Number(value) : value);
}

export function formatCompact(value: number): string {
  return Intl.NumberFormat(LOCALE, { notation: "compact" }).format(value);
}

export const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function shortMonthLabel(month: number): string {
  return MONTH_NAMES[month - 1].slice(0, 3);
}

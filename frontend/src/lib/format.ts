const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

export function formatMoney(value: number | string): string {
  return currency.format(typeof value === "string" ? Number(value) : value);
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

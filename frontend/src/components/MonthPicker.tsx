import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../lib/format.ts";

export interface YearMonth {
  year: number;
  month: number;
}

export function currentYearMonth(): YearMonth {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function MonthPicker({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[--gridline] bg-[--surface-1] px-1 py-1">
      <button
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="rounded-md p-1.5 text-[--ink-secondary] hover:bg-black/5"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-36 text-center text-sm font-medium">
        {monthLabel(value.year, value.month)}
      </span>
      <button
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="rounded-md p-1.5 text-[--ink-secondary] hover:bg-black/5"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

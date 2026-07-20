import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "../lib/format.ts";
import { shiftMonth, type YearMonth } from "../lib/month.ts";

export { currentYearMonth, shiftMonth, type YearMonth } from "../lib/month.ts";

export default function MonthPicker({
  value,
  onChange,
}: {
  value: YearMonth;
  onChange: (next: YearMonth) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-(--gridline) bg-(--surface-1) px-1 py-1">
      <button
        aria-label="Mes anterior"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="rounded-md p-1.5 text-(--ink-secondary) hover:bg-(--hover)"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-36 text-center text-sm font-medium">
        {monthLabel(value.year, value.month)}
      </span>
      <button
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="rounded-md p-1.5 text-(--ink-secondary) hover:bg-(--hover)"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

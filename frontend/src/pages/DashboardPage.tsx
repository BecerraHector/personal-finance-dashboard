import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { api } from "../api/client.ts";
import type { Summary } from "../api/types.ts";
import { formatMoney, shortMonthLabel } from "../lib/format.ts";
import MonthPicker, { currentYearMonth } from "../components/MonthPicker.tsx";
import { Card } from "../components/ui.tsx";

const INCOME_SERIES = "#008300";
const EXPENSE_SERIES = "#e34948";

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "auto" }) {
  const color =
    tone === "auto" ? (value >= 0 ? "text-[#006300]" : "text-[#d03b3b]") : "text-[--ink-primary]";
  return (
    <Card>
      <p className="text-sm text-[--ink-secondary]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{formatMoney(value)}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const [ym, setYm] = useState(currentYearMonth());

  const { data: summary, isLoading } = useQuery({
    queryKey: ["summary", ym.year, ym.month],
    queryFn: async () =>
      (await api.get<Summary>("/summary", { params: { year: ym.year, month: ym.month } })).data,
  });

  const expenseByCategory = summary?.byCategory.filter((c) => c.type === "EXPENSE") ?? [];
  const historyData =
    summary?.history.map((h) => ({
      label: shortMonthLabel(h.month),
      Ingresos: h.income,
      Gastos: h.expense,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <MonthPicker value={ym} onChange={setYm} />
      </div>

      {isLoading || !summary ? (
        <p className="text-[--ink-muted]">Cargando resumen…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Ingresos del mes" value={summary.income} />
            <StatTile label="Gastos del mes" value={summary.expense} />
            <StatTile label="Balance" value={summary.balance} tone="auto" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-sm font-medium text-[--ink-secondary]">
                Gastos por categoría
              </h2>
              {expenseByCategory.length === 0 ? (
                <p className="py-12 text-center text-sm text-[--ink-muted]">
                  Sin gastos registrados este mes
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div className="h-56 min-w-52 flex-1">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={expenseByCategory}
                          dataKey="total"
                          nameKey="name"
                          innerRadius="55%"
                          outerRadius="85%"
                          paddingAngle={2}
                          stroke="var(--surface-1)"
                          strokeWidth={2}
                        >
                          {expenseByCategory.map((c) => (
                            <Cell key={c.categoryId} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatMoney(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex-1 space-y-2 text-sm">
                    {expenseByCategory.map((c) => (
                      <li key={c.categoryId} className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: c.color }}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-[--ink-secondary]">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-medium text-[--ink-secondary]">
                Últimos 6 meses
              </h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={historyData} barGap={2}>
                    <CartesianGrid vertical={false} stroke="var(--gridline)" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: "#c3c2b7" }}
                      tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--ink-muted)", fontSize: 12 }}
                      tickFormatter={(v: number) =>
                        Intl.NumberFormat("es-MX", { notation: "compact" }).format(v)
                      }
                    />
                    <Tooltip formatter={(v) => formatMoney(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Ingresos" fill={INCOME_SERIES} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="Gastos" fill={EXPENSE_SERIES} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-medium text-[--ink-secondary]">
              Presupuestos del mes
            </h2>
            {summary.budgets.length === 0 ? (
              <p className="py-6 text-center text-sm text-[--ink-muted]">
                No has definido presupuestos para este mes
              </p>
            ) : (
              <ul className="space-y-4">
                {summary.budgets.map((b) => {
                  const pct = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
                  const over = b.spent > b.limit;
                  return (
                    <li key={b.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: b.color }}
                            aria-hidden
                          />
                          {b.name}
                          {over && (
                            <span className="flex items-center gap-1 text-xs font-medium text-[#d03b3b]">
                              <AlertTriangle className="size-3.5" aria-hidden />
                              Excedido
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums text-[--ink-secondary]">
                          {formatMoney(b.spent)} / {formatMoney(b.limit)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: over ? "#d03b3b" : b.color,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

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
import { AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { api } from "../api/client.ts";
import type { Summary } from "../api/types.ts";
import { formatCompact, formatMoney, shortMonthLabel } from "../lib/format.ts";
import { categoryColor } from "../lib/palette.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import MonthPicker, { currentYearMonth } from "../components/MonthPicker.tsx";
import { Card } from "../components/ui.tsx";

// Recharts escribe estos valores como atributos SVG, que no soportan var(),
// así que los hex se resuelven según el tema activo.
const CHART_COLORS = {
  light: {
    surface: "#fcfcfb",
    axis: "#c3c2b7",
    grid: "#e1e0d9",
    tick: "#898781",
    ink: "#0b0b0b",
    tooltipBorder: "rgba(11, 11, 11, 0.1)",
    income: "#008300",
    expense: "#e34948",
  },
  dark: {
    surface: "#1a1a19",
    axis: "#383835",
    grid: "#2c2c2a",
    tick: "#898781",
    ink: "#ffffff",
    tooltipBorder: "rgba(255, 255, 255, 0.1)",
    income: "#008300",
    expense: "#e66767",
  },
};

function StatTile({ label, value, tone }: { label: string; value: number; tone?: "auto" }) {
  const color =
    tone === "auto" ? (value >= 0 ? "text-(--income)" : "text-(--danger)") : "text-(--ink-primary)";
  return (
    <Card>
      <p className="text-sm text-(--ink-secondary)">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{formatMoney(value)}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const [ym, setYm] = useState(currentYearMonth());
  const { theme } = useTheme();
  const dark = theme === "dark";
  const chart = CHART_COLORS[theme];
  const tooltipStyle = {
    background: chart.surface,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: 8,
    color: chart.ink,
  };

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
        <p className="text-(--ink-muted)">Cargando resumen…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Ingresos del mes" value={summary.income} />
            <StatTile label="Gastos del mes" value={summary.expense} />
            <StatTile label="Balance" value={summary.balance} tone="auto" />
          </div>

          {summary.insights.length > 0 && (
            <Card>
              <h2 className="mb-3 text-sm font-medium text-(--ink-secondary)">Insights del mes</h2>
              <ul className="space-y-2">
                {summary.insights.map((insight) => {
                  const style = {
                    warning: { Icon: AlertTriangle, className: "text-(--danger)" },
                    good: { Icon: TrendingUp, className: "text-(--income)" },
                    info: { Icon: Lightbulb, className: "text-(--accent-text)" },
                  }[insight.severity];
                  return (
                    <li key={insight.message} className="flex items-start gap-2.5 text-sm">
                      <style.Icon
                        className={`mt-0.5 size-4 shrink-0 ${style.className}`}
                        aria-hidden
                      />
                      <span className="text-(--ink-secondary)">{insight.message}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="mb-4 text-sm font-medium text-(--ink-secondary)">
                Gastos por categoría
              </h2>
              {expenseByCategory.length === 0 ? (
                <p className="py-12 text-center text-sm text-(--ink-muted)">
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
                          stroke={chart.surface}
                          strokeWidth={2}
                        >
                          {expenseByCategory.map((c) => (
                            <Cell key={c.categoryId} fill={categoryColor(c.color, dark)} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => formatMoney(Number(v))}
                          contentStyle={tooltipStyle}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex-1 space-y-2 text-sm">
                    {expenseByCategory.map((c) => (
                      <li key={c.categoryId} className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ background: categoryColor(c.color, dark) }}
                          aria-hidden
                        />
                        <span className="flex-1 truncate text-(--ink-secondary)">{c.name}</span>
                        <span className="font-medium tabular-nums">{formatMoney(c.total)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-4 text-sm font-medium text-(--ink-secondary)">
                Últimos 6 meses
              </h2>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={historyData} barGap={2}>
                    <CartesianGrid vertical={false} stroke={chart.grid} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: chart.axis }}
                      tick={{ fill: chart.tick, fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: chart.tick, fontSize: 12 }}
                      tickFormatter={formatCompact}
                    />
                    <Tooltip
                      formatter={(v) => formatMoney(Number(v))}
                      contentStyle={tooltipStyle}
                      cursor={{ fill: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => <span style={{ color: chart.ink }}>{value}</span>}
                    />
                    <Bar dataKey="Ingresos" fill={chart.income} radius={[4, 4, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="Gastos" fill={chart.expense} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 text-sm font-medium text-(--ink-secondary)">
              Presupuestos del mes
            </h2>
            {summary.budgets.length === 0 ? (
              <p className="py-6 text-center text-sm text-(--ink-muted)">
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
                            style={{ background: categoryColor(b.color, dark) }}
                            aria-hidden
                          />
                          {b.name}
                          {over && (
                            <span className="flex items-center gap-1 text-xs font-medium text-(--danger)">
                              <AlertTriangle className="size-3.5" aria-hidden />
                              Excedido
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums text-(--ink-secondary)">
                          {formatMoney(b.spent)} / {formatMoney(b.limit)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-(--hover)">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            background: over ? "var(--danger)" : categoryColor(b.color, dark),
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

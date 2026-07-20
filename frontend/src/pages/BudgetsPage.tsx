import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../api/client.ts";
import type { Budget, Category, Summary } from "../api/types.ts";
import { formatMoney } from "../lib/format.ts";
import { categoryColor } from "../lib/palette.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import MonthPicker, { currentYearMonth } from "../components/MonthPicker.tsx";
import { Button, Card, ErrorText, Field, Input, Select } from "../components/ui.tsx";

export default function BudgetsPage() {
  const [ym, setYm] = useState(currentYearMonth());
  const [form, setForm] = useState({ categoryId: "", limitAmount: "" });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const dark = useTheme().theme === "dark";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets", ym.year, ym.month],
    queryFn: async () =>
      (await api.get<Budget[]>("/budgets", { params: { year: ym.year, month: ym.month } })).data,
  });

  const { data: summary } = useQuery({
    queryKey: ["summary", ym.year, ym.month],
    queryFn: async () =>
      (await api.get<Summary>("/summary", { params: { year: ym.year, month: ym.month } })).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["budgets"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  }

  const saveMutation = useMutation({
    mutationFn: (payload: { categoryId: string; limitAmount: string }) =>
      api.post("/budgets", { ...payload, year: ym.year, month: ym.month }),
    onSuccess: () => {
      invalidate();
      setForm({ categoryId: "", limitAmount: "" });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: invalidate,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  const spentFor = (categoryId: string) =>
    summary?.budgets.find((b) => b.categoryId === categoryId)?.spent ?? 0;

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Presupuestos</h1>
        <MonthPicker value={ym} onChange={setYm} />
      </div>

      <Card>
        <h2 className="mb-4 text-sm font-medium text-(--ink-secondary)">
          Definir límite mensual por categoría
        </h2>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-3">
          <Field label="Categoría de gasto">
            <Select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            >
              <option value="">Selecciona…</option>
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Límite">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.limitAmount}
              onChange={(e) => setForm({ ...form, limitAmount: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Guardando…" : "Guardar límite"}
            </Button>
          </div>
        </form>
        <ErrorText>{error}</ErrorText>
      </Card>

      {isLoading ? (
        <p className="text-(--ink-muted)">Cargando presupuestos…</p>
      ) : budgets.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-(--ink-muted)">
            No hay presupuestos para este mes. Define el primero arriba.
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="space-y-4">
            {budgets.map((b) => {
              const limit = Number(b.limitAmount);
              const spent = spentFor(b.categoryId);
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const over = spent > limit;
              return (
                <li key={b.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ background: categoryColor(b.category.color, dark) }}
                          aria-hidden
                        />
                        {b.category.name}
                      </span>
                      <span className="tabular-nums text-(--ink-secondary)">
                        {formatMoney(spent)} / {formatMoney(limit)} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-(--hover)">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: over ? "var(--danger)" : categoryColor(b.category.color, dark),
                        }}
                      />
                    </div>
                  </div>
                  <button
                    aria-label="Eliminar presupuesto"
                    onClick={() => deleteMutation.mutate(b.id)}
                    className="rounded-md p-1.5 text-(--ink-muted) hover:bg-(--danger-soft) hover:text-(--danger)"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

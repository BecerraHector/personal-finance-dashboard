import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../api/client.ts";
import type { Category, Transaction } from "../api/types.ts";
import { formatMoney } from "../lib/format.ts";
import MonthPicker, { currentYearMonth } from "../components/MonthPicker.tsx";
import { Button, Card, ErrorText, Field, Input, Select } from "../components/ui.tsx";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const [ym, setYm] = useState(currentYearMonth());
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ amount: "", description: "", date: todayISO(), categoryId: "" });
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", ym.year, ym.month],
    queryFn: async () =>
      (
        await api.get<Transaction[]>("/transactions", {
          params: { year: ym.year, month: ym.month },
        })
      ).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/transactions", payload),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm({ amount: "", description: "", date: todayISO(), categoryId: "" });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/transactions/${id}`),
    onSuccess: invalidate,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  const grouped = useMemo(() => {
    const byDate = new Map<string, Transaction[]>();
    for (const t of transactions) {
      const key = t.date.slice(0, 10);
      byDate.set(key, [...(byDate.get(key) ?? []), t]);
    }
    return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transacciones</h1>
        <div className="flex items-center gap-3">
          <MonthPicker value={ym} onChange={setYm} />
          <Button onClick={() => setShowForm((v) => !v)}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-4" aria-hidden />
              Nueva
            </span>
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Monto">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Categoría">
              <Select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Selecciona…</option>
                <optgroup label="Ingresos">
                  {categories
                    .filter((c) => c.type === "INCOME")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Gastos">
                  {categories
                    .filter((c) => c.type === "EXPENSE")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              </Select>
            </Field>
            <Field label="Fecha">
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </Field>
            <Field label="Descripción (opcional)">
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-4">
              <ErrorText>{error}</ErrorText>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Guardando…" : "Guardar transacción"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isLoading ? (
        <p className="text-[--ink-muted]">Cargando transacciones…</p>
      ) : grouped.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-[--ink-muted]">
            No hay transacciones en este mes. Registra la primera con «Nueva».
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <Card key={date}>
              <h2 className="mb-3 text-sm font-medium text-[--ink-secondary]">
                {new Date(`${date}T00:00:00`).toLocaleDateString("es-MX", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              <ul className="divide-y divide-[--gridline]">
                {items.map((t) => {
                  const isIncome = t.category.type === "INCOME";
                  return (
                    <li key={t.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: t.category.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.category.name}</p>
                        {t.description && (
                          <p className="truncate text-xs text-[--ink-muted]">{t.description}</p>
                        )}
                      </div>
                      <span
                        className={`tabular-nums text-sm font-semibold ${
                          isIncome ? "text-[#006300]" : "text-[--ink-primary]"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {formatMoney(t.amount)}
                      </span>
                      <button
                        aria-label="Eliminar transacción"
                        onClick={() => deleteMutation.mutate(t.id)}
                        className="rounded-md p-1.5 text-[--ink-muted] hover:bg-[#d03b3b]/10 hover:text-[#d03b3b]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

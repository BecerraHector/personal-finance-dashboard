import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pause, Play, Plus, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../api/client.ts";
import type { Category, RecurringRule } from "../api/types.ts";
import { formatMoney } from "../lib/format.ts";
import { categoryColor } from "../lib/palette.ts";
import { useTheme } from "../context/ThemeContext.tsx";
import { Button, Card, ErrorText, Field, Input, Select } from "../components/ui.tsx";

export default function RecurringPage() {
  const [form, setForm] = useState({ amount: "", description: "", dayOfMonth: "1", categoryId: "" });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const dark = useTheme().theme === "dark";

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: async () => (await api.get<RecurringRule[]>("/recurring")).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["recurring"] });
    // La materialización ocurre al leer, así que refrescamos lo derivado
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/recurring", payload),
    onSuccess: () => {
      invalidate();
      setForm({ amount: "", description: "", dayOfMonth: "1", categoryId: "" });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: RecurringRule) => api.put(`/recurring/${rule.id}`, { active: !rule.active }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/recurring/${id}`),
    onSuccess: invalidate,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Transacciones recurrentes</h1>
      <p className="max-w-2xl text-sm text-(--ink-secondary)">
        Renta, suscripciones, salario… se registran solas el día del mes que elijas. Si una regla
        está pausada, no genera transacciones ni se ponen al día al reactivarla.
      </p>

      <Card>
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
          <Field label="Día del mes (1-31)">
            <Input
              type="number"
              min="1"
              max="31"
              required
              value={form.dayOfMonth}
              onChange={(e) => setForm({ ...form, dayOfMonth: e.target.value })}
            />
          </Field>
          <Field label="Descripción (opcional)">
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={createMutation.isPending}>
              <span className="flex items-center gap-1.5">
                <Plus className="size-4" aria-hidden />
                Crear regla
              </span>
            </Button>
          </div>
        </form>
        <ErrorText>{error}</ErrorText>
        <p className="mt-3 text-xs text-(--ink-muted)">
          Si el mes no tiene ese día (p. ej. 31 en febrero), se usa el último día del mes.
        </p>
      </Card>

      {isLoading ? (
        <p className="text-(--ink-muted)">Cargando reglas…</p>
      ) : rules.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-(--ink-muted)">
            No tienes reglas recurrentes. Crea la primera arriba.
          </p>
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-(--gridline)">
            {rules.map((r) => {
              const isIncome = r.category.type === "INCOME";
              return (
                <li key={r.id} className={`flex items-center gap-3 py-3 ${r.active ? "" : "opacity-50"}`}>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: categoryColor(r.category.color, dark) }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {r.category.name}
                      {r.description && (
                        <span className="font-normal text-(--ink-muted)"> · {r.description}</span>
                      )}
                    </p>
                    <p className="text-xs text-(--ink-muted)">
                      Día {r.dayOfMonth} de cada mes{r.active ? "" : " · pausada"}
                    </p>
                  </div>
                  <span
                    className={`tabular-nums text-sm font-semibold ${
                      isIncome ? "text-(--income)" : "text-(--ink-primary)"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {formatMoney(r.amount)}
                  </span>
                  <button
                    aria-label={r.active ? "Pausar regla" : "Reactivar regla"}
                    title={r.active ? "Pausar" : "Reactivar"}
                    onClick={() => toggleMutation.mutate(r)}
                    className="rounded-md p-1.5 text-(--ink-muted) hover:bg-(--hover) hover:text-(--ink-primary)"
                  >
                    {r.active ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button
                    aria-label="Eliminar regla"
                    onClick={() => deleteMutation.mutate(r.id)}
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

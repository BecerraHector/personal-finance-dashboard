import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api, apiErrorMessage } from "../api/client.ts";
import type { Category, TransactionType } from "../api/types.ts";
import { Button, Card, ErrorText, Field, Input, Select } from "../components/ui.tsx";

// Slots de la paleta categórica validada (CVD-safe), en su orden canónico
const PALETTE = [
  "#2a78d6",
  "#008300",
  "#e87ba4",
  "#eda100",
  "#1baf7a",
  "#eb6834",
  "#4a3aa7",
  "#e34948",
];

export default function CategoriesPage() {
  const [form, setForm] = useState<{ name: string; type: TransactionType; color: string }>({
    name: "",
    type: "EXPENSE",
    color: PALETTE[0],
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await api.get<Category[]>("/categories")).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  }

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/categories", payload),
    onSuccess: () => {
      invalidate();
      setForm({ name: "", type: "EXPENSE", color: PALETTE[0] });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      invalidate();
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  const incomeCategories = categories.filter((c) => c.type === "INCOME");
  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  function CategoryList({ title, items }: { title: string; items: Category[] }) {
    return (
      <Card>
        <h2 className="mb-3 text-sm font-medium text-[--ink-secondary]">{title}</h2>
        {items.length === 0 ? (
          <p className="py-4 text-center text-sm text-[--ink-muted]">Sin categorías</p>
        ) : (
          <ul className="divide-y divide-[--gridline]">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: c.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate text-sm">{c.name}</span>
                <button
                  aria-label={`Eliminar categoría ${c.name}`}
                  onClick={() => deleteMutation.mutate(c.id)}
                  className="rounded-md p-1.5 text-[--ink-muted] hover:bg-[#d03b3b]/10 hover:text-[#d03b3b]"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Categorías</h1>

      <Card>
        <form onSubmit={onSubmit} className="grid items-end gap-4 sm:grid-cols-4">
          <Field label="Nombre">
            <Input
              required
              maxLength={50}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Tipo">
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
            >
              <option value="EXPENSE">Gasto</option>
              <option value="INCOME">Ingreso</option>
            </Select>
          </Field>
          <Field label="Color">
            <div className="flex gap-1.5 py-1.5">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  aria-label={`Color ${hex}`}
                  onClick={() => setForm({ ...form, color: hex })}
                  className={`size-6 rounded-full transition-transform ${
                    form.color === hex ? "scale-110 ring-2 ring-offset-1 ring-[--ink-secondary]" : ""
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </Field>
          <Button type="submit" disabled={createMutation.isPending}>
            <span className="flex items-center gap-1.5">
              <Plus className="size-4" aria-hidden />
              Agregar
            </span>
          </Button>
        </form>
        <ErrorText>{error}</ErrorText>
      </Card>

      {isLoading ? (
        <p className="text-[--ink-muted]">Cargando categorías…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryList title="Ingresos" items={incomeCategories} />
          <CategoryList title="Gastos" items={expenseCategories} />
        </div>
      )}
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarX, CircleCheck, Plus, Trash2, TrendingUp } from "lucide-react";
import { api, apiErrorMessage } from "../api/client.ts";
import type { GoalStatus, SavingsGoal } from "../api/types.ts";
import { LOCALE, MONTH_NAMES, formatMoney, monthLabel } from "../lib/format.ts";
import { Button, Card, ErrorText, Field, Input, Select } from "../components/ui.tsx";

const STATUS: Record<GoalStatus, { label: string; className: string; Icon: typeof CircleCheck }> = {
  COMPLETED: { label: "Completada", className: "text-(--income)", Icon: CircleCheck },
  ON_TRACK: { label: "En camino", className: "text-(--income)", Icon: TrendingUp },
  BEHIND: { label: "Atrasada", className: "text-(--danger)", Icon: AlertTriangle },
  OVERDUE: { label: "Vencida", className: "text-(--danger)", Icon: CalendarX },
};

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["goals"] });

  const contributeMutation = useMutation({
    mutationFn: (value: string) => api.post(`/goals/${goal.id}/contributions`, { amount: value }),
    onSuccess: () => {
      invalidate();
      setAmount("");
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: () => api.delete(`/goals/${goal.id}`),
    onSuccess: invalidate,
  });

  const deleteContributionMutation = useMutation({
    mutationFn: (contributionId: string) =>
      api.delete(`/goals/${goal.id}/contributions/${contributionId}`),
    onSuccess: invalidate,
  });

  const { label, className, Icon } = STATUS[goal.status];
  const completed = goal.status === "COMPLETED";

  return (
    <Card>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">{goal.name}</h2>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-medium ${className}`}>
            <Icon className="size-3.5" aria-hidden />
            {label}
          </span>
          <button
            aria-label={`Eliminar meta ${goal.name}`}
            onClick={() => deleteGoalMutation.mutate()}
            className="rounded-md p-1.5 text-(--ink-muted) hover:bg-(--danger-soft) hover:text-(--danger)"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
      <p className="mb-3 text-xs text-(--ink-muted)">
        Para {monthLabel(goal.targetYear, goal.targetMonth)}
      </p>

      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="tabular-nums font-medium">
          {formatMoney(goal.saved)}{" "}
          <span className="font-normal text-(--ink-secondary)">
            de {formatMoney(goal.targetAmount)}
          </span>
        </span>
        <span className="tabular-nums text-(--ink-secondary)">{Math.round(goal.pct)}%</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-(--hover)">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${goal.pct}%`,
            background: completed ? "var(--income)" : "var(--accent)",
          }}
        />
      </div>

      {!completed && goal.monthsLeft > 0 && (
        <p className="mb-3 text-sm text-(--ink-secondary)">
          Ahorra ~<strong className="tabular-nums">{formatMoney(goal.suggestedMonthly)}</strong> al
          mes durante {goal.monthsLeft} {goal.monthsLeft === 1 ? "mes" : "meses"} para llegar.
        </p>
      )}
      {goal.status === "OVERDUE" && (
        <p className="mb-3 text-sm text-(--ink-secondary)">
          El plazo venció; faltan <strong className="tabular-nums">{formatMoney(goal.remaining)}</strong>.
          Puedes editar la meta o registrar el aporte final.
        </p>
      )}

      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          contributeMutation.mutate(amount);
        }}
        className="flex gap-2"
      >
        <Input
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Monto del aporte"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="max-w-48"
        />
        <Button type="submit" disabled={contributeMutation.isPending}>
          Aportar
        </Button>
      </form>
      <ErrorText>{error}</ErrorText>

      {goal.contributions.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-(--ink-muted) hover:text-(--ink-secondary)">
            {goal.contributions.length} {goal.contributions.length === 1 ? "aporte" : "aportes"}
          </summary>
          <ul className="mt-2 divide-y divide-(--gridline)">
            {goal.contributions.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                <span className="text-(--ink-muted)">
                  {new Date(c.date).toLocaleDateString(LOCALE)}
                </span>
                <span className="min-w-0 flex-1 truncate text-(--ink-secondary)">{c.note}</span>
                <span className="tabular-nums font-medium text-(--income)">
                  +{formatMoney(c.amount)}
                </span>
                <button
                  aria-label="Eliminar aporte"
                  onClick={() => deleteContributionMutation.mutate(c.id)}
                  className="rounded-md p-1 text-(--ink-muted) hover:bg-(--danger-soft) hover:text-(--danger)"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Card>
  );
}

export default function GoalsPage() {
  const now = new Date();
  const [form, setForm] = useState({
    name: "",
    targetAmount: "",
    targetMonth: String(now.getMonth() + 1),
    targetYear: String(now.getFullYear()),
  });
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => (await api.get<SavingsGoal[]>("/goals")).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post("/goals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setForm({ ...form, name: "", targetAmount: "" });
      setError("");
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const years = Array.from({ length: 11 }, (_, i) => now.getFullYear() + i);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Metas de ahorro</h1>
      <p className="max-w-2xl text-sm text-(--ink-secondary)">
        Define cuánto quieres juntar y para cuándo; la app calcula cuánto apartar al mes y si vas
        en camino. Los aportes son independientes de tus transacciones.
      </p>

      <Card>
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            createMutation.mutate(form);
          }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <Field label="Nombre">
            <Input
              required
              maxLength={100}
              placeholder="Vacaciones, fondo de emergencia…"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Monto objetivo">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
            />
          </Field>
          <Field label="Mes límite">
            <Select
              value={form.targetMonth}
              onChange={(e) => setForm({ ...form, targetMonth: e.target.value })}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Año límite">
            <Select
              value={form.targetYear}
              onChange={(e) => setForm({ ...form, targetYear: e.target.value })}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={createMutation.isPending}>
              <span className="flex items-center gap-1.5">
                <Plus className="size-4" aria-hidden />
                Crear meta
              </span>
            </Button>
          </div>
        </form>
        <ErrorText>{error}</ErrorText>
      </Card>

      {isLoading ? (
        <p className="text-(--ink-muted)">Cargando metas…</p>
      ) : goals.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-sm text-(--ink-muted)">
            No tienes metas de ahorro. Crea la primera arriba.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}
    </div>
  );
}

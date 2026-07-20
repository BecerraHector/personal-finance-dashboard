import type { TransactionType } from "@prisma/client";

// Colores tomados de una paleta categórica validada para daltonismo (CVD-safe).
// Los gastos usan los slots 1-7 en el orden validado; los ingresos reutilizan
// tonos verdes/azules (nunca comparten gráfica con los gastos).
export const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  { name: "Salario", type: "INCOME", color: "#008300" },
  { name: "Freelance", type: "INCOME", color: "#1baf7a" },
  { name: "Otros ingresos", type: "INCOME", color: "#2a78d6" },
  { name: "Comida", type: "EXPENSE", color: "#2a78d6" },
  { name: "Transporte", type: "EXPENSE", color: "#008300" },
  { name: "Renta", type: "EXPENSE", color: "#e87ba4" },
  { name: "Servicios", type: "EXPENSE", color: "#eda100" },
  { name: "Entretenimiento", type: "EXPENSE", color: "#1baf7a" },
  { name: "Salud", type: "EXPENSE", color: "#eb6834" },
  { name: "Otros gastos", type: "EXPENSE", color: "#4a3aa7" },
];

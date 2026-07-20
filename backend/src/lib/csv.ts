export interface CsvTransaction {
  date: Date;
  categoryName: string;
  type: "INCOME" | "EXPENSE";
  description: string;
  amount: number;
}

function escapeCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Genera el CSV (separado por comas, CRLF, con encabezado). El monto va como
 * número crudo con punto decimal para que sea legible por máquinas; el signo
 * lo da la columna Tipo.
 */
export function transactionsToCsv(rows: CsvTransaction[]): string {
  const header = "Fecha,Categoría,Tipo,Descripción,Monto";
  const lines = rows.map((r) =>
    [
      r.date.toISOString().slice(0, 10),
      escapeCsv(r.categoryName),
      r.type === "INCOME" ? "Ingreso" : "Gasto",
      escapeCsv(r.description),
      String(r.amount),
    ].join(","),
  );
  return [header, ...lines].join("\r\n") + "\r\n";
}

import { prisma } from "./prisma.js";
import { pendingOccurrences } from "./recurring.js";

/**
 * Genera las transacciones pendientes de las reglas recurrentes activas del
 * usuario. Se llama de forma perezosa al leer transacciones o el resumen, así
 * el catch-up funciona aunque el servidor haya estado apagado. La condición
 * sobre lastGenerated dentro de la transacción evita duplicados si dos
 * requests concurrentes materializan a la vez.
 */
export async function materializeRecurring(userId: string): Promise<void> {
  const rules = await prisma.recurringTransaction.findMany({
    where: { userId, active: true },
  });
  const today = new Date();

  for (const rule of rules) {
    const occurrences = pendingOccurrences({
      startDate: rule.startDate,
      lastGenerated: rule.lastGenerated,
      today,
      dayOfMonth: rule.dayOfMonth,
    });
    if (occurrences.length === 0) continue;

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.recurringTransaction.updateMany({
        where: { id: rule.id, lastGenerated: rule.lastGenerated },
        data: { lastGenerated: occurrences[occurrences.length - 1] },
      });
      if (claimed.count === 0) return; // otro request ya generó estas ocurrencias

      await tx.transaction.createMany({
        data: occurrences.map((date) => ({
          userId,
          categoryId: rule.categoryId,
          amount: rule.amount,
          description: rule.description,
          date,
          recurringId: rule.id,
        })),
      });
    });
  }
}

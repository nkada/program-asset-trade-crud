
import { db } from '../db';
import { programsTable, tradesTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteProgram = async (input: IdInput): Promise<{ success: boolean }> => {
  try {
    // First, delete all trade-asset relationships for trades in this program
    await db.delete(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, 
        db.select({ id: tradesTable.id })
          .from(tradesTable)
          .where(eq(tradesTable.program_id, input.id))
      ))
      .execute();

    // Then delete all trades for this program
    await db.delete(tradesTable)
      .where(eq(tradesTable.program_id, input.id))
      .execute();

    // Finally delete the program
    const result = await db.delete(programsTable)
      .where(eq(programsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Program deletion failed:', error);
    throw error;
  }
};

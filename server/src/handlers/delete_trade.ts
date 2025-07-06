
import { db } from '../db';
import { tradesTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTrade = async (input: IdInput): Promise<{ success: boolean }> => {
  try {
    // First delete from junction table (trade_assets)
    await db.delete(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, input.id))
      .execute();

    // Then delete the trade record
    const result = await db.delete(tradesTable)
      .where(eq(tradesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Trade deletion failed:', error);
    throw error;
  }
};


import { db } from '../db';
import { tradesTable, assetsTable, tradeAssetsTable } from '../db/schema';
import { type IdInput, type TradeWithAssets } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTrade(input: IdInput): Promise<TradeWithAssets | null> {
  try {
    // Query trade with its associated assets through the junction table
    const results = await db.select({
      trade: tradesTable,
      asset: assetsTable
    })
    .from(tradesTable)
    .leftJoin(tradeAssetsTable, eq(tradesTable.id, tradeAssetsTable.trade_id))
    .leftJoin(assetsTable, eq(tradeAssetsTable.asset_id, assetsTable.id))
    .where(eq(tradesTable.id, input.id))
    .execute();

    if (results.length === 0) {
      return null;
    }

    // Group assets by trade (there should only be one trade since we're querying by ID)
    const trade = results[0].trade;
    const assets = results
      .filter(result => result.asset !== null)
      .map(result => ({
        ...result.asset!,
        value: parseFloat(result.asset!.value) // Convert numeric field to number
      }));

    return {
      ...trade,
      assets
    };
  } catch (error) {
    console.error('Get trade failed:', error);
    throw error;
  }
}

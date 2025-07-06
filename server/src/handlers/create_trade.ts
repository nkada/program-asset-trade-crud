
import { db } from '../db';
import { tradesTable, tradeAssetsTable, programsTable, assetsTable } from '../db/schema';
import { type CreateTradeInput, type Trade } from '../schema';
import { eq } from 'drizzle-orm';

export async function createTrade(input: CreateTradeInput): Promise<Trade> {
  try {
    // Validate that start_date is before end_date
    if (input.start_date >= input.end_date) {
      throw new Error('Start date must be before end date');
    }

    // Validate that program_id exists
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, input.program_id))
      .execute();

    if (programs.length === 0) {
      throw new Error('Program not found');
    }

    // If asset_ids provided, validate they exist
    if (input.asset_ids && input.asset_ids.length > 0) {
      const assets = await db.select()
        .from(assetsTable)
        .execute();

      const existingAssetIds = assets.map(asset => asset.id);
      const invalidAssetIds = input.asset_ids.filter(id => !existingAssetIds.includes(id));

      if (invalidAssetIds.length > 0) {
        throw new Error(`Assets not found: ${invalidAssetIds.join(', ')}`);
      }
    }

    // Insert trade record
    const tradeResult = await db.insert(tradesTable)
      .values({
        name: input.name,
        description: input.description,
        status: input.status,
        start_date: input.start_date,
        end_date: input.end_date,
        program_id: input.program_id
      })
      .returning()
      .execute();

    const trade = tradeResult[0];

    // Create entries in trade_assets junction table if asset_ids provided
    if (input.asset_ids && input.asset_ids.length > 0) {
      const tradeAssetValues = input.asset_ids.map(asset_id => ({
        trade_id: trade.id,
        asset_id: asset_id
      }));

      await db.insert(tradeAssetsTable)
        .values(tradeAssetValues)
        .execute();
    }

    return trade;
  } catch (error) {
    console.error('Trade creation failed:', error);
    throw error;
  }
}

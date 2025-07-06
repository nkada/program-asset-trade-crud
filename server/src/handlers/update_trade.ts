
import { db } from '../db';
import { tradesTable, tradeAssetsTable, programsTable } from '../db/schema';
import { type UpdateTradeInput, type Trade } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateTrade(input: UpdateTradeInput): Promise<Trade | null> {
  try {
    // Validate date logic if both dates are provided
    if (input.start_date && input.end_date && input.start_date >= input.end_date) {
      throw new Error('Start date must be before end date');
    }

    // Validate program exists if program_id is provided
    if (input.program_id) {
      const program = await db.select()
        .from(programsTable)
        .where(eq(programsTable.id, input.program_id))
        .execute();
      
      if (program.length === 0) {
        throw new Error('Program not found');
      }
    }

    // Build update values, excluding asset_ids and id
    const updateValues: any = {};
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.status !== undefined) updateValues.status = input.status;
    if (input.start_date !== undefined) updateValues.start_date = input.start_date;
    if (input.end_date !== undefined) updateValues.end_date = input.end_date;
    if (input.program_id !== undefined) updateValues.program_id = input.program_id;

    // Update trade record if there are fields to update
    if (Object.keys(updateValues).length > 0) {
      const result = await db.update(tradesTable)
        .set(updateValues)
        .where(eq(tradesTable.id, input.id))
        .returning()
        .execute();
      
      if (result.length === 0) {
        return null;
      }
    }

    // Handle asset_ids update if provided
    if (input.asset_ids !== undefined) {
      // Remove existing trade-asset relationships
      await db.delete(tradeAssetsTable)
        .where(eq(tradeAssetsTable.trade_id, input.id))
        .execute();

      // Add new trade-asset relationships
      if (input.asset_ids.length > 0) {
        const tradeAssetValues = input.asset_ids.map(assetId => ({
          trade_id: input.id,
          asset_id: assetId
        }));
        
        await db.insert(tradeAssetsTable)
          .values(tradeAssetValues)
          .execute();
      }
    }

    // Fetch and return the updated trade
    const updatedTrade = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, input.id))
      .execute();

    if (updatedTrade.length === 0) {
      return null;
    }

    return updatedTrade[0];
  } catch (error) {
    console.error('Trade update failed:', error);
    throw error;
  }
}

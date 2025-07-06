
import { db } from '../db';
import { tradesTable } from '../db/schema';
import { type Trade } from '../schema';

export async function getTrades(): Promise<Trade[]> {
  try {
    const results = await db.select()
      .from(tradesTable)
      .execute();

    // Convert the results to match the schema types
    return results.map(trade => ({
      ...trade,
      start_date: trade.start_date,
      end_date: trade.end_date,
      created_at: trade.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch trades:', error);
    throw error;
  }
}

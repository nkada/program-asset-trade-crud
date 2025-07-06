
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type Asset } from '../schema';

export async function getAssets(): Promise<Asset[]> {
  try {
    const results = await db.select()
      .from(assetsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(asset => ({
      ...asset,
      value: parseFloat(asset.value) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch assets:', error);
    throw error;
  }
}

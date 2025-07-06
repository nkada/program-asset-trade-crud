
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdInput, type Asset } from '../schema';

export async function getAsset(input: IdInput): Promise<Asset | null> {
  try {
    const results = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const asset = results[0];
    return {
      ...asset,
      value: parseFloat(asset.value) // Convert numeric field to number
    };
  } catch (error) {
    console.error('Asset retrieval failed:', error);
    throw error;
  }
}

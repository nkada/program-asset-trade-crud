
import { db } from '../db';
import { assetsTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteAsset(input: IdInput): Promise<{ success: boolean }> {
  try {
    // First, delete all references in the junction table
    await db.delete(tradeAssetsTable)
      .where(eq(tradeAssetsTable.asset_id, input.id))
      .execute();

    // Then delete the asset itself
    const result = await db.delete(assetsTable)
      .where(eq(assetsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Asset deletion failed:', error);
    throw error;
  }
}

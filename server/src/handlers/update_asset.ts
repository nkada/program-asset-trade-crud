
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type UpdateAssetInput, type Asset } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateAsset(input: UpdateAssetInput): Promise<Asset | null> {
  try {
    // Validate that value is positive if provided
    if (input.value !== undefined && input.value <= 0) {
      throw new Error('Asset value must be positive');
    }

    // Build update object with only defined fields
    const updateData: any = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.currency !== undefined) {
      updateData.currency = input.currency;
    }
    
    if (input.value !== undefined) {
      updateData.value = input.value.toString(); // Convert number to string for numeric column
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the asset
    const result = await db.update(assetsTable)
      .set(updateData)
      .where(eq(assetsTable.id, input.id))
      .returning()
      .execute();

    // Return null if no rows were updated (asset not found)
    if (result.length === 0) {
      return null;
    }

    // Convert numeric field back to number before returning
    const asset = result[0];
    return {
      ...asset,
      value: parseFloat(asset.value) // Convert string back to number
    };
  } catch (error) {
    console.error('Asset update failed:', error);
    throw error;
  }
}

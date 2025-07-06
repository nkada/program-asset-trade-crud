
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type CreateAssetInput, type Asset } from '../schema';

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  try {
    // Validate that value is positive
    if (input.value <= 0) {
      throw new Error('Asset value must be positive');
    }

    // Insert asset record
    const result = await db.insert(assetsTable)
      .values({
        name: input.name,
        description: input.description,
        currency: input.currency,
        value: input.value.toString(), // Convert number to string for numeric column
        date: input.date
      })
      .returning()
      .execute();

    // Convert numeric field back to number before returning
    const asset = result[0];
    return {
      ...asset,
      value: parseFloat(asset.value) // Convert string back to number
    };
  } catch (error) {
    console.error('Asset creation failed:', error);
    throw error;
  }
}

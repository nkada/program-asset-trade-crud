
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable, programsTable, tradesTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { deleteAsset } from '../handlers/delete_asset';
import { eq } from 'drizzle-orm';

describe('deleteAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an asset that exists', async () => {
    // Create test asset
    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        description: 'An asset for testing',
        currency: 'USD',
        value: '100.50',
        date: new Date()
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Delete the asset
    const result = await deleteAsset({ id: assetId });

    expect(result.success).toBe(true);

    // Verify asset was deleted
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(0);
  });

  it('should return false for non-existent asset', async () => {
    const result = await deleteAsset({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should remove asset from trade_assets junction table', async () => {
    // Create prerequisite data
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A program for testing',
        status: 'active',
        start_date: new Date(),
        end_date: new Date()
      })
      .returning()
      .execute();

    const programId = programResult[0].id;

    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        description: 'An asset for testing',
        currency: 'USD',
        value: '100.50',
        date: new Date()
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    const tradeResult = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A trade for testing',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(),
        program_id: programId
      })
      .returning()
      .execute();

    const tradeId = tradeResult[0].id;

    // Create trade-asset relationship
    await db.insert(tradeAssetsTable)
      .values({
        trade_id: tradeId,
        asset_id: assetId
      })
      .execute();

    // Verify relationship exists
    const tradeAssetsBefore = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.asset_id, assetId))
      .execute();

    expect(tradeAssetsBefore).toHaveLength(1);

    // Delete the asset
    const result = await deleteAsset({ id: assetId });

    expect(result.success).toBe(true);

    // Verify asset was deleted
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(0);

    // Verify trade-asset relationship was removed
    const tradeAssetsAfter = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.asset_id, assetId))
      .execute();

    expect(tradeAssetsAfter).toHaveLength(0);
  });

  it('should handle asset with multiple trade relationships', async () => {
    // Create prerequisite data
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A program for testing',
        status: 'active',
        start_date: new Date(),
        end_date: new Date()
      })
      .returning()
      .execute();

    const programId = programResult[0].id;

    const assetResult = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        description: 'An asset for testing',
        currency: 'USD',
        value: '100.50',
        date: new Date()
      })
      .returning()
      .execute();

    const assetId = assetResult[0].id;

    // Create two trades
    const trade1Result = await db.insert(tradesTable)
      .values({
        name: 'Test Trade 1',
        description: 'First trade for testing',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(),
        program_id: programId
      })
      .returning()
      .execute();

    const trade2Result = await db.insert(tradesTable)
      .values({
        name: 'Test Trade 2',
        description: 'Second trade for testing',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(),
        program_id: programId
      })
      .returning()
      .execute();

    // Create multiple trade-asset relationships
    await db.insert(tradeAssetsTable)
      .values([
        { trade_id: trade1Result[0].id, asset_id: assetId },
        { trade_id: trade2Result[0].id, asset_id: assetId }
      ])
      .execute();

    // Verify relationships exist
    const tradeAssetsBefore = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.asset_id, assetId))
      .execute();

    expect(tradeAssetsBefore).toHaveLength(2);

    // Delete the asset
    const result = await deleteAsset({ id: assetId });

    expect(result.success).toBe(true);

    // Verify all trade-asset relationships were removed
    const tradeAssetsAfter = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.asset_id, assetId))
      .execute();

    expect(tradeAssetsAfter).toHaveLength(0);
  });
});

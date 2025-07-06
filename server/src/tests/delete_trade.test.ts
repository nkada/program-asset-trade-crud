
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable, assetsTable, tradesTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { deleteTrade } from '../handlers/delete_trade';
import { eq } from 'drizzle-orm';

describe('deleteTrade', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a trade', async () => {
    // Create prerequisite program
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const programId = programResult[0].id;

    // Create test trade
    const tradeResult = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        program_id: programId
      })
      .returning()
      .execute();

    const tradeId = tradeResult[0].id;

    // Delete the trade
    const input: IdInput = { id: tradeId };
    const result = await deleteTrade(input);

    expect(result.success).toBe(true);

    // Verify trade was deleted
    const trades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, tradeId))
      .execute();

    expect(trades).toHaveLength(0);
  });

  it('should delete trade with associated assets', async () => {
    // Create prerequisite program
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const programId = programResult[0].id;

    // Create test assets
    const assetResult = await db.insert(assetsTable)
      .values([
        {
          name: 'Test Asset 1',
          description: 'First test asset',
          currency: 'USD',
          value: '100.00',
          date: new Date('2024-01-01')
        },
        {
          name: 'Test Asset 2',
          description: 'Second test asset',
          currency: 'EUR',
          value: '200.00',
          date: new Date('2024-01-01')
        }
      ])
      .returning()
      .execute();

    const asset1Id = assetResult[0].id;
    const asset2Id = assetResult[1].id;

    // Create test trade
    const tradeResult = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        program_id: programId
      })
      .returning()
      .execute();

    const tradeId = tradeResult[0].id;

    // Create trade-asset associations
    await db.insert(tradeAssetsTable)
      .values([
        { trade_id: tradeId, asset_id: asset1Id },
        { trade_id: tradeId, asset_id: asset2Id }
      ])
      .execute();

    // Verify associations exist before deletion
    const tradeAssetsBefore = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, tradeId))
      .execute();

    expect(tradeAssetsBefore).toHaveLength(2);

    // Delete the trade
    const input: IdInput = { id: tradeId };
    const result = await deleteTrade(input);

    expect(result.success).toBe(true);

    // Verify trade was deleted
    const trades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, tradeId))
      .execute();

    expect(trades).toHaveLength(0);

    // Verify trade-asset associations were deleted
    const tradeAssetsAfter = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, tradeId))
      .execute();

    expect(tradeAssetsAfter).toHaveLength(0);

    // Verify assets themselves still exist
    const assets = await db.select()
      .from(assetsTable)
      .execute();

    expect(assets).toHaveLength(2);
  });

  it('should return false when trade does not exist', async () => {
    const input: IdInput = { id: 999 };
    const result = await deleteTrade(input);

    expect(result.success).toBe(false);
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable, tradesTable, assetsTable, tradeAssetsTable } from '../db/schema';
import { type UpdateTradeInput } from '../schema';
import { updateTrade } from '../handlers/update_trade';
import { eq } from 'drizzle-orm';

describe('updateTrade', () => {
  let testProgramId: number;
  let testTradeId: number;
  let testAssetId1: number;
  let testAssetId2: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test program
    const program = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();
    testProgramId = program[0].id;

    // Create test assets
    const asset1 = await db.insert(assetsTable)
      .values({
        name: 'Test Asset 1',
        description: 'Test asset 1 description',
        currency: 'USD',
        value: '100.50',
        date: new Date('2024-01-01')
      })
      .returning()
      .execute();
    testAssetId1 = asset1[0].id;

    const asset2 = await db.insert(assetsTable)
      .values({
        name: 'Test Asset 2',
        description: 'Test asset 2 description',
        currency: 'EUR',
        value: '200.75',
        date: new Date('2024-01-02')
      })
      .returning()
      .execute();
    testAssetId2 = asset2[0].id;

    // Create test trade
    const trade = await db.insert(tradesTable)
      .values({
        name: 'Original Trade',
        description: 'Original description',
        status: 'pending',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-02-28'),
        program_id: testProgramId
      })
      .returning()
      .execute();
    testTradeId = trade[0].id;
  });

  afterEach(resetDB);

  it('should update basic trade fields', async () => {
    const input: UpdateTradeInput = {
      id: testTradeId,
      name: 'Updated Trade Name',
      description: 'Updated description',
      status: 'active'
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated Trade Name');
    expect(result!.description).toEqual('Updated description');
    expect(result!.status).toEqual('active');
    expect(result!.program_id).toEqual(testProgramId);
  });

  it('should update date fields', async () => {
    const newStartDate = new Date('2024-03-01');
    const newEndDate = new Date('2024-03-31');

    const input: UpdateTradeInput = {
      id: testTradeId,
      start_date: newStartDate,
      end_date: newEndDate
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();
    expect(result!.start_date).toEqual(newStartDate);
    expect(result!.end_date).toEqual(newEndDate);
  });

  it('should update program_id', async () => {
    // Create another program
    const anotherProgram = await db.insert(programsTable)
      .values({
        name: 'Another Program',
        description: 'Another program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const input: UpdateTradeInput = {
      id: testTradeId,
      program_id: anotherProgram[0].id
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();
    expect(result!.program_id).toEqual(anotherProgram[0].id);
  });

  it('should update asset relationships', async () => {
    const input: UpdateTradeInput = {
      id: testTradeId,
      asset_ids: [testAssetId1, testAssetId2]
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();

    // Verify trade-asset relationships were created
    const tradeAssets = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, testTradeId))
      .execute();

    expect(tradeAssets).toHaveLength(2);
    expect(tradeAssets.map(ta => ta.asset_id)).toContain(testAssetId1);
    expect(tradeAssets.map(ta => ta.asset_id)).toContain(testAssetId2);
  });

  it('should replace existing asset relationships', async () => {
    // First, add some assets to the trade
    await db.insert(tradeAssetsTable)
      .values([
        { trade_id: testTradeId, asset_id: testAssetId1 }
      ])
      .execute();

    // Update with different assets
    const input: UpdateTradeInput = {
      id: testTradeId,
      asset_ids: [testAssetId2]
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();

    // Verify only the new asset is associated
    const tradeAssets = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, testTradeId))
      .execute();

    expect(tradeAssets).toHaveLength(1);
    expect(tradeAssets[0].asset_id).toEqual(testAssetId2);
  });

  it('should clear asset relationships when empty array provided', async () => {
    // First, add some assets to the trade
    await db.insert(tradeAssetsTable)
      .values([
        { trade_id: testTradeId, asset_id: testAssetId1 },
        { trade_id: testTradeId, asset_id: testAssetId2 }
      ])
      .execute();

    const input: UpdateTradeInput = {
      id: testTradeId,
      asset_ids: []
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();

    // Verify all asset relationships were removed
    const tradeAssets = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, testTradeId))
      .execute();

    expect(tradeAssets).toHaveLength(0);
  });

  it('should return null for non-existent trade', async () => {
    const input: UpdateTradeInput = {
      id: 99999,
      name: 'Updated Name'
    };

    const result = await updateTrade(input);

    expect(result).toBeNull();
  });

  it('should throw error for invalid date range', async () => {
    const input: UpdateTradeInput = {
      id: testTradeId,
      start_date: new Date('2024-03-31'),
      end_date: new Date('2024-03-01')
    };

    expect(updateTrade(input)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should throw error for non-existent program', async () => {
    const input: UpdateTradeInput = {
      id: testTradeId,
      program_id: 99999
    };

    expect(updateTrade(input)).rejects.toThrow(/program not found/i);
  });

  it('should handle partial updates without affecting other fields', async () => {
    const input: UpdateTradeInput = {
      id: testTradeId,
      name: 'Only Name Updated'
    };

    const result = await updateTrade(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Only Name Updated');
    expect(result!.description).toEqual('Original description');
    expect(result!.status).toEqual('pending');
    expect(result!.program_id).toEqual(testProgramId);
  });
});

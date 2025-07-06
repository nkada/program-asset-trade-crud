
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable, assetsTable, tradesTable, tradeAssetsTable } from '../db/schema';
import { type CreateTradeInput } from '../schema';
import { createTrade } from '../handlers/create_trade';
import { eq } from 'drizzle-orm';

describe('createTrade', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a trade with valid input', async () => {
    // Create a program first
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const program = programResult[0];

    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      program_id: program.id
    };

    const result = await createTrade(testInput);

    expect(result.name).toEqual('Test Trade');
    expect(result.description).toEqual(testInput.description);
    expect(result.status).toEqual('active');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.program_id).toEqual(program.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save trade to database', async () => {
    // Create a program first
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const program = programResult[0];

    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      program_id: program.id
    };

    const result = await createTrade(testInput);

    const trades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, result.id))
      .execute();

    expect(trades).toHaveLength(1);
    expect(trades[0].name).toEqual('Test Trade');
    expect(trades[0].description).toEqual(testInput.description);
    expect(trades[0].status).toEqual('active');
    expect(trades[0].program_id).toEqual(program.id);
    expect(trades[0].created_at).toBeInstanceOf(Date);
  });

  it('should create trade with asset associations', async () => {
    // Create a program first
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const program = programResult[0];

    // Create assets
    const assetResults = await db.insert(assetsTable)
      .values([
        {
          name: 'Asset 1',
          description: 'First asset',
          currency: 'USD',
          value: '100.00',
          date: new Date('2024-01-01')
        },
        {
          name: 'Asset 2',
          description: 'Second asset',
          currency: 'EUR',
          value: '200.00',
          date: new Date('2024-01-02')
        }
      ])
      .returning()
      .execute();

    const assets = assetResults;

    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      program_id: program.id,
      asset_ids: [assets[0].id, assets[1].id]
    };

    const result = await createTrade(testInput);

    // Check that trade was created
    expect(result.id).toBeDefined();

    // Check that trade-asset associations were created
    const tradeAssets = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, result.id))
      .execute();

    expect(tradeAssets).toHaveLength(2);
    expect(tradeAssets.map(ta => ta.asset_id)).toContain(assets[0].id);
    expect(tradeAssets.map(ta => ta.asset_id)).toContain(assets[1].id);
  });

  it('should throw error when start_date is after end_date', async () => {
    // Create a program first
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const program = programResult[0];

    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-28'),
      end_date: new Date('2024-02-01'), // End date before start date
      program_id: program.id
    };

    await expect(createTrade(testInput)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should throw error when program_id does not exist', async () => {
    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      program_id: 999 // Non-existent program ID
    };

    await expect(createTrade(testInput)).rejects.toThrow(/program not found/i);
  });

  it('should throw error when asset_ids contain invalid IDs', async () => {
    // Create a program first
    const programResult = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'Test program description',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const program = programResult[0];

    const testInput: CreateTradeInput = {
      name: 'Test Trade',
      description: 'A trade for testing',
      status: 'active',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-02-28'),
      program_id: program.id,
      asset_ids: [999, 1000] // Non-existent asset IDs
    };

    await expect(createTrade(testInput)).rejects.toThrow(/assets not found/i);
  });
});

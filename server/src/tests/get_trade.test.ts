
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable, assetsTable, tradesTable, tradeAssetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { getTrade } from '../handlers/get_trade';

describe('getTrade', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent trade', async () => {
    const input: IdInput = { id: 999 };
    const result = await getTrade(input);
    expect(result).toBeNull();
  });

  it('should return trade without assets', async () => {
    // Create prerequisite program
    const program = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create trade
    const trade = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        program_id: program[0].id
      })
      .returning()
      .execute();

    const input: IdInput = { id: trade[0].id };
    const result = await getTrade(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(trade[0].id);
    expect(result!.name).toEqual('Test Trade');
    expect(result!.description).toEqual('A test trade');
    expect(result!.status).toEqual('active');
    expect(result!.program_id).toEqual(program[0].id);
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.assets).toEqual([]);
  });

  it('should return trade with associated assets', async () => {
    // Create prerequisite program
    const program = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create assets
    const assets = await db.insert(assetsTable)
      .values([
        {
          name: 'Asset 1',
          description: 'First asset',
          currency: 'USD',
          value: '100.50',
          date: new Date('2024-01-01')
        },
        {
          name: 'Asset 2',
          description: 'Second asset',
          currency: 'EUR',
          value: '75.25',
          date: new Date('2024-01-02')
        }
      ])
      .returning()
      .execute();

    // Create trade
    const trade = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        program_id: program[0].id
      })
      .returning()
      .execute();

    // Associate assets with trade
    await db.insert(tradeAssetsTable)
      .values([
        { trade_id: trade[0].id, asset_id: assets[0].id },
        { trade_id: trade[0].id, asset_id: assets[1].id }
      ])
      .execute();

    const input: IdInput = { id: trade[0].id };
    const result = await getTrade(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(trade[0].id);
    expect(result!.name).toEqual('Test Trade');
    expect(result!.assets).toHaveLength(2);
    
    // Verify assets data and numeric conversion
    const asset1 = result!.assets.find(a => a.name === 'Asset 1');
    const asset2 = result!.assets.find(a => a.name === 'Asset 2');
    
    expect(asset1).toBeDefined();
    expect(asset1!.value).toEqual(100.50);
    expect(typeof asset1!.value).toBe('number');
    expect(asset1!.currency).toEqual('USD');
    
    expect(asset2).toBeDefined();
    expect(asset2!.value).toEqual(75.25);
    expect(typeof asset2!.value).toBe('number');
    expect(asset2!.currency).toEqual('EUR');
  });

  it('should handle trade with some assets having null values', async () => {
    // Create prerequisite program
    const program = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create asset
    const asset = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        description: 'A test asset',
        currency: 'USD',
        value: '50.00',
        date: new Date('2024-01-01')
      })
      .returning()
      .execute();

    // Create trade
    const trade = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        program_id: program[0].id
      })
      .returning()
      .execute();

    // Associate one asset with trade
    await db.insert(tradeAssetsTable)
      .values({ trade_id: trade[0].id, asset_id: asset[0].id })
      .execute();

    const input: IdInput = { id: trade[0].id };
    const result = await getTrade(input);

    expect(result).not.toBeNull();
    expect(result!.assets).toHaveLength(1);
    expect(result!.assets[0].name).toEqual('Test Asset');
    expect(result!.assets[0].value).toEqual(50.00);
    expect(typeof result!.assets[0].value).toBe('number');
  });
});

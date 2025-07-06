
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { getAssets } from '../handlers/get_assets';

describe('getAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no assets exist', async () => {
    const result = await getAssets();
    expect(result).toEqual([]);
  });

  it('should return all assets', async () => {
    // Create test assets
    await db.insert(assetsTable).values([
      {
        name: 'Asset 1',
        description: 'First test asset',
        currency: 'USD',
        value: '100.50',
        date: new Date('2024-01-01')
      },
      {
        name: 'Asset 2',
        description: 'Second test asset',
        currency: 'EUR',
        value: '250.75',
        date: new Date('2024-01-02')
      }
    ]);

    const result = await getAssets();

    expect(result).toHaveLength(2);
    
    // Check first asset
    expect(result[0].name).toEqual('Asset 1');
    expect(result[0].description).toEqual('First test asset');
    expect(result[0].currency).toEqual('USD');
    expect(result[0].value).toEqual(100.50);
    expect(typeof result[0].value).toBe('number');
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    // Check second asset
    expect(result[1].name).toEqual('Asset 2');
    expect(result[1].description).toEqual('Second test asset');
    expect(result[1].currency).toEqual('EUR');
    expect(result[1].value).toEqual(250.75);
    expect(typeof result[1].value).toBe('number');
    expect(result[1].date).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should handle assets with different currencies', async () => {
    // Create assets with various currencies
    await db.insert(assetsTable).values([
      {
        name: 'USD Asset',
        description: 'Dollar asset',
        currency: 'USD',
        value: '1000.00',
        date: new Date('2024-01-01')
      },
      {
        name: 'EUR Asset',
        description: 'Euro asset',
        currency: 'EUR',
        value: '850.25',
        date: new Date('2024-01-02')
      },
      {
        name: 'GBP Asset',
        description: 'Pound asset',
        currency: 'GBP',
        value: '750.50',
        date: new Date('2024-01-03')
      }
    ]);

    const result = await getAssets();

    expect(result).toHaveLength(3);
    
    const currencies = result.map(asset => asset.currency);
    expect(currencies).toContain('USD');
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('GBP');

    // Verify all numeric conversions worked correctly
    result.forEach(asset => {
      expect(typeof asset.value).toBe('number');
      expect(asset.value).toBeGreaterThan(0);
    });
  });
});

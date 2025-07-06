
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type CreateAssetInput } from '../schema';
import { createAsset } from '../handlers/create_asset';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateAssetInput = {
  name: 'Test Asset',
  description: 'An asset for testing',
  currency: 'USD',
  value: 1000.50,
  date: new Date('2024-01-01')
};

describe('createAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an asset', async () => {
    const result = await createAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Asset');
    expect(result.description).toEqual(testInput.description);
    expect(result.currency).toEqual('USD');
    expect(result.value).toEqual(1000.50);
    expect(typeof result.value).toBe('number');
    expect(result.date).toEqual(testInput.date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save asset to database', async () => {
    const result = await createAsset(testInput);

    // Query using proper drizzle syntax
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Test Asset');
    expect(assets[0].description).toEqual(testInput.description);
    expect(assets[0].currency).toEqual('USD');
    expect(parseFloat(assets[0].value)).toEqual(1000.50);
    expect(assets[0].date).toEqual(testInput.date);
    expect(assets[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal values correctly', async () => {
    const decimalInput: CreateAssetInput = {
      name: 'Decimal Asset',
      description: 'Testing decimal precision',
      currency: 'EUR',
      value: 999.99,
      date: new Date('2024-02-01')
    };

    const result = await createAsset(decimalInput);

    expect(result.value).toEqual(999.99);
    expect(typeof result.value).toBe('number');

    // Verify database storage
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, result.id))
      .execute();

    expect(parseFloat(assets[0].value)).toEqual(999.99);
  });

  it('should reject negative values', async () => {
    const negativeInput: CreateAssetInput = {
      name: 'Negative Asset',
      description: 'Testing negative value validation',
      currency: 'USD',
      value: -100.00,
      date: new Date('2024-01-01')
    };

    await expect(createAsset(negativeInput)).rejects.toThrow(/value must be positive/i);
  });

  it('should reject zero values', async () => {
    const zeroInput: CreateAssetInput = {
      name: 'Zero Asset',
      description: 'Testing zero value validation',
      currency: 'USD',
      value: 0,
      date: new Date('2024-01-01')
    };

    await expect(createAsset(zeroInput)).rejects.toThrow(/value must be positive/i);
  });
});

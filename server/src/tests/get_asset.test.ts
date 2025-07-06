
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type IdInput, type CreateAssetInput } from '../schema';
import { getAsset } from '../handlers/get_asset';

const testAsset: CreateAssetInput = {
  name: 'Test Asset',
  description: 'A test asset',
  currency: 'USD',
  value: 1000.50,
  date: new Date('2023-01-01')
};

describe('getAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an asset by ID', async () => {
    // Create test asset
    const insertResult = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];

    // Test retrieval
    const input: IdInput = { id: createdAsset.id };
    const result = await getAsset(input);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Asset');
    expect(result!.description).toEqual('A test asset');
    expect(result!.currency).toEqual('USD');
    expect(result!.value).toEqual(1000.50);
    expect(typeof result!.value).toBe('number');
    expect(result!.date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent asset', async () => {
    const input: IdInput = { id: 999 };
    const result = await getAsset(input);

    expect(result).toBeNull();
  });

  it('should handle asset with different currency', async () => {
    // Create asset with different currency
    const eurAsset = {
      ...testAsset,
      currency: 'EUR',
      value: 850.75
    };

    const insertResult = await db.insert(assetsTable)
      .values({
        name: eurAsset.name,
        description: eurAsset.description,
        currency: eurAsset.currency,
        value: eurAsset.value.toString(),
        date: eurAsset.date
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];

    // Test retrieval
    const input: IdInput = { id: createdAsset.id };
    const result = await getAsset(input);

    expect(result).toBeDefined();
    expect(result!.currency).toEqual('EUR');
    expect(result!.value).toEqual(850.75);
    expect(typeof result!.value).toBe('number');
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { assetsTable } from '../db/schema';
import { type CreateAssetInput, type UpdateAssetInput } from '../schema';
import { updateAsset } from '../handlers/update_asset';
import { eq } from 'drizzle-orm';

// Test data setup
const testAsset: CreateAssetInput = {
  name: 'Test Asset',
  description: 'A test asset',
  currency: 'USD',
  value: 100.50,
  date: new Date('2024-01-01')
};

const updateInput: UpdateAssetInput = {
  id: 1,
  name: 'Updated Asset',
  description: 'Updated description',
  currency: 'EUR',
  value: 200.75,
  date: new Date('2024-02-01')
};

describe('updateAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an asset', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Update the asset
    const result = await updateAsset({
      id: assetId,
      name: updateInput.name,
      description: updateInput.description,
      currency: updateInput.currency,
      value: updateInput.value,
      date: updateInput.date
    });

    // Verify updated fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(assetId);
    expect(result!.name).toEqual('Updated Asset');
    expect(result!.description).toEqual('Updated description');
    expect(result!.currency).toEqual('EUR');
    expect(result!.value).toEqual(200.75);
    expect(result!.date).toEqual(new Date('2024-02-01'));
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should update partial fields', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Update only name and value
    const result = await updateAsset({
      id: assetId,
      name: 'Partially Updated',
      value: 150.25
    });

    // Verify updated and unchanged fields
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(assetId);
    expect(result!.name).toEqual('Partially Updated');
    expect(result!.description).toEqual('A test asset'); // unchanged
    expect(result!.currency).toEqual('USD'); // unchanged
    expect(result!.value).toEqual(150.25);
    expect(result!.date).toEqual(new Date('2024-01-01')); // unchanged
  });

  it('should save updated asset to database', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Update the asset
    await updateAsset({
      id: assetId,
      name: 'Database Test Asset',
      value: 300.00
    });

    // Verify database was updated
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, assetId))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Database Test Asset');
    expect(parseFloat(assets[0].value)).toEqual(300.00);
  });

  it('should return null for non-existent asset', async () => {
    const result = await updateAsset({
      id: 999,
      name: 'Non-existent Asset'
    });

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Try to update with no fields
    const result = await updateAsset({
      id: assetId
    });

    expect(result).toBeNull();
  });

  it('should reject negative asset value', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Try to update with negative value
    expect(updateAsset({
      id: assetId,
      value: -50.00
    })).rejects.toThrow(/value must be positive/i);
  });

  it('should reject zero asset value', async () => {
    // Create test asset first
    const created = await db.insert(assetsTable)
      .values({
        name: testAsset.name,
        description: testAsset.description,
        currency: testAsset.currency,
        value: testAsset.value.toString(),
        date: testAsset.date
      })
      .returning()
      .execute();

    const assetId = created[0].id;

    // Try to update with zero value
    expect(updateAsset({
      id: assetId,
      value: 0
    })).rejects.toThrow(/value must be positive/i);
  });
});

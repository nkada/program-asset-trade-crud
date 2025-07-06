
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable, tradesTable, tradeAssetsTable, assetsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { deleteProgram } from '../handlers/delete_program';
import { eq } from 'drizzle-orm';

describe('deleteProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a program with no trades', async () => {
    // Create a program first
    const [program] = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    const input: IdInput = { id: program.id };
    const result = await deleteProgram(input);

    expect(result.success).toBe(true);

    // Verify program is deleted
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, program.id))
      .execute();

    expect(programs).toHaveLength(0);
  });

  it('should delete a program and cascade delete its trades', async () => {
    // Create a program
    const [program] = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    // Create a trade for the program
    const [trade] = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        program_id: program.id
      })
      .returning()
      .execute();

    const input: IdInput = { id: program.id };
    const result = await deleteProgram(input);

    expect(result.success).toBe(true);

    // Verify program is deleted
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, program.id))
      .execute();

    expect(programs).toHaveLength(0);

    // Verify trade is deleted
    const trades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, trade.id))
      .execute();

    expect(trades).toHaveLength(0);
  });

  it('should delete a program and cascade delete trade-asset relationships', async () => {
    // Create a program
    const [program] = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000)
      })
      .returning()
      .execute();

    // Create an asset
    const [asset] = await db.insert(assetsTable)
      .values({
        name: 'Test Asset',
        description: 'A test asset',
        currency: 'USD',
        value: '100.00',
        date: new Date()
      })
      .returning()
      .execute();

    // Create a trade for the program
    const [trade] = await db.insert(tradesTable)
      .values({
        name: 'Test Trade',
        description: 'A test trade',
        status: 'active',
        start_date: new Date(),
        end_date: new Date(Date.now() + 86400000),
        program_id: program.id
      })
      .returning()
      .execute();

    // Create trade-asset relationship
    await db.insert(tradeAssetsTable)
      .values({
        trade_id: trade.id,
        asset_id: asset.id
      })
      .execute();

    const input: IdInput = { id: program.id };
    const result = await deleteProgram(input);

    expect(result.success).toBe(true);

    // Verify program is deleted
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, program.id))
      .execute();

    expect(programs).toHaveLength(0);

    // Verify trade is deleted
    const trades = await db.select()
      .from(tradesTable)
      .where(eq(tradesTable.id, trade.id))
      .execute();

    expect(trades).toHaveLength(0);

    // Verify trade-asset relationship is deleted
    const tradeAssets = await db.select()
      .from(tradeAssetsTable)
      .where(eq(tradeAssetsTable.trade_id, trade.id))
      .execute();

    expect(tradeAssets).toHaveLength(0);

    // Verify asset still exists (should not be deleted)
    const assets = await db.select()
      .from(assetsTable)
      .where(eq(assetsTable.id, asset.id))
      .execute();

    expect(assets).toHaveLength(1);
  });

  it('should return false when program does not exist', async () => {
    const input: IdInput = { id: 999 };
    const result = await deleteProgram(input);

    expect(result.success).toBe(false);
  });
});

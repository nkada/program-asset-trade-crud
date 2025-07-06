
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tradesTable, programsTable } from '../db/schema';
import { getTrades } from '../handlers/get_trades';

describe('getTrades', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no trades exist', async () => {
    const result = await getTrades();
    expect(result).toEqual([]);
  });

  it('should return all trades', async () => {
    // Create a program first (required for foreign key)
    const [program] = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    // Create test trades
    await db.insert(tradesTable)
      .values([
        {
          name: 'Trade 1',
          description: 'First trade',
          status: 'active',
          start_date: new Date('2024-01-01'),
          end_date: new Date('2024-06-30'),
          program_id: program.id
        },
        {
          name: 'Trade 2',
          description: 'Second trade',
          status: 'completed',
          start_date: new Date('2024-02-01'),
          end_date: new Date('2024-07-31'),
          program_id: program.id
        }
      ])
      .execute();

    const result = await getTrades();

    expect(result).toHaveLength(2);
    
    // Check first trade
    expect(result[0].name).toEqual('Trade 1');
    expect(result[0].description).toEqual('First trade');
    expect(result[0].status).toEqual('active');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].program_id).toEqual(program.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    // Check second trade
    expect(result[1].name).toEqual('Trade 2');
    expect(result[1].description).toEqual('Second trade');
    expect(result[1].status).toEqual('completed');
    expect(result[1].start_date).toBeInstanceOf(Date);
    expect(result[1].end_date).toBeInstanceOf(Date);
    expect(result[1].program_id).toEqual(program.id);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should return trades with correct date types', async () => {
    // Create a program first
    const [program] = await db.insert(programsTable)
      .values({
        name: 'Test Program',
        description: 'A test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      })
      .returning()
      .execute();

    const testDate = new Date('2024-03-15T10:30:00Z');
    
    await db.insert(tradesTable)
      .values({
        name: 'Date Test Trade',
        description: 'Testing date handling',
        status: 'active',
        start_date: testDate,
        end_date: testDate,
        program_id: program.id
      })
      .execute();

    const result = await getTrades();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});

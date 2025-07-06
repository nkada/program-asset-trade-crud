
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable } from '../db/schema';
import { getPrograms } from '../handlers/get_programs';

describe('getPrograms', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no programs exist', async () => {
    const result = await getPrograms();
    expect(result).toEqual([]);
  });

  it('should return all programs', async () => {
    // Create test programs
    await db.insert(programsTable).values([
      {
        name: 'Program 1',
        description: 'First test program',
        status: 'active',
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31')
      },
      {
        name: 'Program 2',
        description: 'Second test program',
        status: 'inactive',
        start_date: new Date('2024-02-01'),
        end_date: new Date('2024-11-30')
      }
    ]).execute();

    const result = await getPrograms();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Program 1');
    expect(result[0].description).toEqual('First test program');
    expect(result[0].status).toEqual('active');
    expect(result[0].start_date).toBeInstanceOf(Date);
    expect(result[0].end_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    expect(result[1].name).toEqual('Program 2');
    expect(result[1].description).toEqual('Second test program');
    expect(result[1].status).toEqual('inactive');
    expect(result[1].start_date).toBeInstanceOf(Date);
    expect(result[1].end_date).toBeInstanceOf(Date);
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should return programs with correct date values', async () => {
    const startDate = new Date('2024-06-15');
    const endDate = new Date('2024-12-15');

    await db.insert(programsTable).values({
      name: 'Date Test Program',
      description: 'Testing date handling',
      status: 'active',
      start_date: startDate,
      end_date: endDate
    }).execute();

    const result = await getPrograms();

    expect(result).toHaveLength(1);
    expect(result[0].start_date).toEqual(startDate);
    expect(result[0].end_date).toEqual(endDate);
  });
});

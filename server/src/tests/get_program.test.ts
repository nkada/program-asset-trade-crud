
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable } from '../db/schema';
import { type IdInput, type CreateProgramInput } from '../schema';
import { getProgram } from '../handlers/get_program';

describe('getProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a program when it exists', async () => {
    // Create a test program
    const testProgram: CreateProgramInput = {
      name: 'Test Program',
      description: 'A program for testing',
      status: 'active',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31')
    };

    const insertResult = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const insertedProgram = insertResult[0];

    // Test the handler
    const input: IdInput = { id: insertedProgram.id };
    const result = await getProgram(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedProgram.id);
    expect(result!.name).toEqual('Test Program');
    expect(result!.description).toEqual('A program for testing');
    expect(result!.status).toEqual('active');
    expect(result!.start_date).toBeInstanceOf(Date);
    expect(result!.end_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when program does not exist', async () => {
    const input: IdInput = { id: 999 };
    const result = await getProgram(input);

    expect(result).toBeNull();
  });

  it('should return correct program when multiple programs exist', async () => {
    // Create multiple test programs
    const program1: CreateProgramInput = {
      name: 'Program One',
      description: 'First program',
      status: 'active',
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-06-30')
    };

    const program2: CreateProgramInput = {
      name: 'Program Two',
      description: 'Second program',
      status: 'inactive',
      start_date: new Date('2024-07-01'),
      end_date: new Date('2024-12-31')
    };

    const insertResult1 = await db.insert(programsTable)
      .values(program1)
      .returning()
      .execute();

    const insertResult2 = await db.insert(programsTable)
      .values(program2)
      .returning()
      .execute();

    // Test fetching the second program
    const input: IdInput = { id: insertResult2[0].id };
    const result = await getProgram(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult2[0].id);
    expect(result!.name).toEqual('Program Two');
    expect(result!.description).toEqual('Second program');
    expect(result!.status).toEqual('inactive');
  });
});


import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable } from '../db/schema';
import { type CreateProgramInput } from '../schema';
import { createProgram } from '../handlers/create_program';
import { eq } from 'drizzle-orm';

// Test input with valid date range
const testInput: CreateProgramInput = {
  name: 'Test Program',
  description: 'A program for testing',
  status: 'active',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('createProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a program', async () => {
    const result = await createProgram(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Program');
    expect(result.description).toEqual(testInput.description);
    expect(result.status).toEqual('active');
    expect(result.start_date).toEqual(testInput.start_date);
    expect(result.end_date).toEqual(testInput.end_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save program to database', async () => {
    const result = await createProgram(testInput);

    // Query using proper drizzle syntax
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, result.id))
      .execute();

    expect(programs).toHaveLength(1);
    expect(programs[0].name).toEqual('Test Program');
    expect(programs[0].description).toEqual(testInput.description);
    expect(programs[0].status).toEqual('active');
    expect(programs[0].start_date).toEqual(testInput.start_date);
    expect(programs[0].end_date).toEqual(testInput.end_date);
    expect(programs[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject when start_date is after end_date', async () => {
    const invalidInput: CreateProgramInput = {
      ...testInput,
      start_date: new Date('2024-12-31'),
      end_date: new Date('2024-01-01')
    };

    await expect(createProgram(invalidInput)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should reject when start_date equals end_date', async () => {
    const invalidInput: CreateProgramInput = {
      ...testInput,
      start_date: new Date('2024-06-15'),
      end_date: new Date('2024-06-15')
    };

    await expect(createProgram(invalidInput)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should handle programs with same name but different dates', async () => {
    const firstProgram = await createProgram(testInput);
    
    const secondInput: CreateProgramInput = {
      ...testInput,
      start_date: new Date('2025-01-01'),
      end_date: new Date('2025-12-31')
    };
    
    const secondProgram = await createProgram(secondInput);

    expect(firstProgram.id).not.toEqual(secondProgram.id);
    expect(firstProgram.name).toEqual(secondProgram.name);
    expect(firstProgram.start_date).not.toEqual(secondProgram.start_date);
    expect(firstProgram.end_date).not.toEqual(secondProgram.end_date);
  });
});

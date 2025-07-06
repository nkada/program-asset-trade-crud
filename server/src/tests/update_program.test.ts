
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { programsTable } from '../db/schema';
import { type UpdateProgramInput, type CreateProgramInput } from '../schema';
import { updateProgram } from '../handlers/update_program';
import { eq } from 'drizzle-orm';

// Test data
const testProgram: CreateProgramInput = {
  name: 'Test Program',
  description: 'A test program',
  status: 'active',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31')
};

describe('updateProgram', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a program with all fields', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      name: 'Updated Program',
      description: 'Updated description',
      status: 'inactive',
      start_date: new Date('2024-02-01'),
      end_date: new Date('2024-11-30')
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('Updated Program');
    expect(result!.description).toEqual('Updated description');
    expect(result!.status).toEqual('inactive');
    expect(result!.start_date).toEqual(new Date('2024-02-01'));
    expect(result!.end_date).toEqual(new Date('2024-11-30'));
    expect(result!.created_at).toEqual(created.created_at);
  });

  it('should update a program with partial fields', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      name: 'Partially Updated Program',
      status: 'completed'
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(created.id);
    expect(result!.name).toEqual('Partially Updated Program');
    expect(result!.description).toEqual(testProgram.description); // Unchanged
    expect(result!.status).toEqual('completed');
    expect(result!.start_date).toEqual(testProgram.start_date); // Unchanged
    expect(result!.end_date).toEqual(testProgram.end_date); // Unchanged
  });

  it('should persist changes to database', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      name: 'Database Updated Program'
    };

    await updateProgram(updateInput);

    // Query database directly
    const programs = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, created.id))
      .execute();

    expect(programs).toHaveLength(1);
    expect(programs[0].name).toEqual('Database Updated Program');
    expect(programs[0].description).toEqual(testProgram.description);
  });

  it('should return null for non-existent program', async () => {
    const updateInput: UpdateProgramInput = {
      id: 999,
      name: 'Non-existent Program'
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeNull();
  });

  it('should return null when no fields to update', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error when start_date is after end_date', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      start_date: new Date('2024-12-31'),
      end_date: new Date('2024-01-01')
    };

    expect(updateProgram(updateInput)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should throw error when start_date equals end_date', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const sameDate = new Date('2024-06-15');
    const updateInput: UpdateProgramInput = {
      id: created.id,
      start_date: sameDate,
      end_date: sameDate
    };

    expect(updateProgram(updateInput)).rejects.toThrow(/start date must be before end date/i);
  });

  it('should allow updating only start_date when valid', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      start_date: new Date('2024-03-01')
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeDefined();
    expect(result!.start_date).toEqual(new Date('2024-03-01'));
    expect(result!.end_date).toEqual(testProgram.end_date); // Unchanged
  });

  it('should allow updating only end_date when valid', async () => {
    // Create initial program
    const [created] = await db.insert(programsTable)
      .values(testProgram)
      .returning()
      .execute();

    const updateInput: UpdateProgramInput = {
      id: created.id,
      end_date: new Date('2024-10-31')
    };

    const result = await updateProgram(updateInput);

    expect(result).toBeDefined();
    expect(result!.start_date).toEqual(testProgram.start_date); // Unchanged
    expect(result!.end_date).toEqual(new Date('2024-10-31'));
  });
});

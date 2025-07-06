
import { db } from '../db';
import { programsTable } from '../db/schema';
import { type CreateProgramInput, type Program } from '../schema';

export const createProgram = async (input: CreateProgramInput): Promise<Program> => {
  try {
    // Validate that start_date is before end_date
    if (input.start_date >= input.end_date) {
      throw new Error('Start date must be before end date');
    }

    // Insert program record
    const result = await db.insert(programsTable)
      .values({
        name: input.name,
        description: input.description,
        status: input.status,
        start_date: input.start_date,
        end_date: input.end_date
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Program creation failed:', error);
    throw error;
  }
};

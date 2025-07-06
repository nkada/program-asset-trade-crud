
import { db } from '../db';
import { programsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type IdInput, type Program } from '../schema';

export const getProgram = async (input: IdInput): Promise<Program | null> => {
  try {
    const result = await db.select()
      .from(programsTable)
      .where(eq(programsTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Program fetch failed:', error);
    throw error;
  }
};

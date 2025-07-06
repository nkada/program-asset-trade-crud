
import { db } from '../db';
import { programsTable } from '../db/schema';
import { type UpdateProgramInput, type Program } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateProgram(input: UpdateProgramInput): Promise<Program | null> {
  try {
    // Validate that start_date is before end_date if both are provided
    if (input.start_date && input.end_date && input.start_date >= input.end_date) {
      throw new Error('Start date must be before end date');
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof programsTable.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.start_date !== undefined) updateData.start_date = input.start_date;
    if (input.end_date !== undefined) updateData.end_date = input.end_date;

    // If no fields to update, return null
    if (Object.keys(updateData).length === 0) {
      return null;
    }

    // Update the program
    const result = await db.update(programsTable)
      .set(updateData)
      .where(eq(programsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated program or null if not found
    return result[0] || null;
  } catch (error) {
    console.error('Program update failed:', error);
    throw error;
  }
}

import { db } from '../db';
import { eggRecordsTable, chickensTable } from '../db/schema';
import { type UpdateEggRecordInput, type EggRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const updateEggRecord = async (input: UpdateEggRecordInput): Promise<EggRecord> => {
  try {
    // Validate that the egg record exists
    const existingRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, input.id))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Egg record with id ${input.id} not found`);
    }

    // If chicken_id is being updated, validate that the chicken exists
    if (input.chicken_id !== undefined) {
      const chicken = await db.select()
        .from(chickensTable)
        .where(eq(chickensTable.id, input.chicken_id))
        .execute();

      if (chicken.length === 0) {
        throw new Error(`Chicken with id ${input.chicken_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.chicken_id !== undefined) {
      updateData.chicken_id = input.chicken_id;
    }
    
    if (input.date !== undefined) {
      updateData.date = input.date;
    }
    
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity;
    }

    // Update the egg record
    const result = await db.update(eggRecordsTable)
      .set(updateData)
      .where(eq(eggRecordsTable.id, input.id))
      .returning()
      .execute();

    // Return the updated record with proper date conversion
    const updatedRecord = result[0];
    return {
      ...updatedRecord,
      date: new Date(updatedRecord.date), // Convert string to Date
      created_at: updatedRecord.created_at
    };
  } catch (error) {
    console.error('Egg record update failed:', error);
    throw error;
  }
};
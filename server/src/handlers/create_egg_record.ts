import { db } from '../db';
import { eggRecordsTable, chickensTable } from '../db/schema';
import { type CreateEggRecordInput, type EggRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const createEggRecord = async (input: CreateEggRecordInput): Promise<EggRecord> => {
  try {
    // Validate that the chicken exists before creating the egg record
    const existingChicken = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, input.chicken_id))
      .execute();

    if (existingChicken.length === 0) {
      throw new Error(`Chicken with id ${input.chicken_id} does not exist`);
    }

    // Insert egg record
    const result = await db.insert(eggRecordsTable)
      .values({
        chicken_id: input.chicken_id,
        date: input.date, // date column accepts string in YYYY-MM-DD format
        quantity: input.quantity
      })
      .returning()
      .execute();

    const eggRecord = result[0];
    
    // Convert date string to Date object for response
    return {
      ...eggRecord,
      date: new Date(eggRecord.date + 'T00:00:00.000Z') // Convert date string to Date object
    };
  } catch (error) {
    console.error('Egg record creation failed:', error);
    throw error;
  }
};
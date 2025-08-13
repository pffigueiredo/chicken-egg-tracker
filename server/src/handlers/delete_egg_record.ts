import { db } from '../db';
import { eggRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteEggRecord = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the egg record by ID
    const result = await db.delete(eggRecordsTable)
      .where(eq(eggRecordsTable.id, id))
      .execute();

    // Check if any rows were affected (record existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Egg record deletion failed:', error);
    throw error;
  }
};
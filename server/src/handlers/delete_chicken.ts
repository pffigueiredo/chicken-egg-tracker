import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteChicken(id: number): Promise<{ success: boolean }> {
  try {
    // First, delete all related egg records to avoid foreign key constraint violations
    await db.delete(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, id))
      .execute();

    // Then delete the chicken record
    const result = await db.delete(chickensTable)
      .where(eq(chickensTable.id, id))
      .execute();

    // Check if any rows were deleted (chicken existed)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Chicken deletion failed:', error);
    throw error;
  }
}
import { db } from '../db';
import { chickensTable } from '../db/schema';
import { type Chicken } from '../schema';

export async function getChickens(): Promise<Chicken[]> {
  try {
    // Fetch all chickens from the database
    const result = await db.select()
      .from(chickensTable)
      .execute();

    // Return the chickens (no numeric conversions needed for this table)
    return result;
  } catch (error) {
    console.error('Failed to fetch chickens:', error);
    throw error;
  }
}
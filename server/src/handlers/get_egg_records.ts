import { db } from '../db';
import { eggRecordsTable, chickensTable } from '../db/schema';
import { type EggRecord, type GetEggsByDateRangeInput } from '../schema';
import { eq, gte, lte, and, SQL } from 'drizzle-orm';

export async function getEggRecords(input?: GetEggsByDateRangeInput): Promise<EggRecord[]> {
  try {
    const conditions: SQL<unknown>[] = [];

    // Apply date range filters if provided
    if (input?.start_date) {
      conditions.push(gte(eggRecordsTable.date, input.start_date));
    }

    if (input?.end_date) {
      conditions.push(lte(eggRecordsTable.date, input.end_date));
    }

    // Build query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(eggRecordsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(eggRecordsTable)
          .execute();

    // Convert date strings to Date objects for the schema
    return results.map(record => ({
      ...record,
      date: new Date(record.date),
      created_at: record.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch egg records:', error);
    throw error;
  }
}

export async function getEggRecordsByChicken(chickenId: number): Promise<EggRecord[]> {
  try {
    const results = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chickenId))
      .execute();

    // Convert date strings to Date objects for the schema
    return results.map(record => ({
      ...record,
      date: new Date(record.date),
      created_at: record.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch egg records by chicken:', error);
    throw error;
  }
}
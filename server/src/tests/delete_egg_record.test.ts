import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { deleteEggRecord } from '../handlers/delete_egg_record';
import { eq } from 'drizzle-orm';

describe('deleteEggRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing egg record', async () => {
    // Create a chicken first (required for foreign key)
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    // Create an egg record
    const eggRecordResult = await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken.id,
        date: '2024-01-15',
        quantity: 3
      })
      .returning()
      .execute();

    const eggRecord = eggRecordResult[0];

    // Delete the egg record
    const result = await deleteEggRecord(eggRecord.id);

    // Should return success: true
    expect(result.success).toBe(true);

    // Verify the record is actually deleted from database
    const deletedRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, eggRecord.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);
  });

  it('should return false when deleting non-existent record', async () => {
    // Try to delete a record that doesn't exist
    const result = await deleteEggRecord(999);

    // Should return success: false
    expect(result.success).toBe(false);
  });

  it('should not affect other egg records when deleting one', async () => {
    // Create a chicken first
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    // Create multiple egg records
    const eggRecord1Result = await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken.id,
        date: '2024-01-15',
        quantity: 3
      })
      .returning()
      .execute();

    const eggRecord2Result = await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken.id,
        date: '2024-01-16',
        quantity: 2
      })
      .returning()
      .execute();

    const eggRecord1 = eggRecord1Result[0];
    const eggRecord2 = eggRecord2Result[0];

    // Delete only the first record
    const result = await deleteEggRecord(eggRecord1.id);

    // Should succeed
    expect(result.success).toBe(true);

    // Verify first record is deleted
    const deletedRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, eggRecord1.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);

    // Verify second record still exists
    const remainingRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, eggRecord2.id))
      .execute();

    expect(remainingRecord).toHaveLength(1);
    expect(remainingRecord[0].id).toBe(eggRecord2.id);
    expect(remainingRecord[0].quantity).toBe(2);
  });

  it('should handle deletion with different chicken records', async () => {
    // Create two different chickens
    const chicken1Result = await db.insert(chickensTable)
      .values({
        name: 'Chicken 1',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const chicken2Result = await db.insert(chickensTable)
      .values({
        name: 'Chicken 2',
        breed: 'Leghorn'
      })
      .returning()
      .execute();

    const chicken1 = chicken1Result[0];
    const chicken2 = chicken2Result[0];

    // Create egg records for both chickens
    const eggRecord1Result = await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken1.id,
        date: '2024-01-15',
        quantity: 3
      })
      .returning()
      .execute();

    const eggRecord2Result = await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken2.id,
        date: '2024-01-15',
        quantity: 2
      })
      .returning()
      .execute();

    const eggRecord1 = eggRecord1Result[0];
    const eggRecord2 = eggRecord2Result[0];

    // Delete record from chicken 1
    const result = await deleteEggRecord(eggRecord1.id);

    // Should succeed
    expect(result.success).toBe(true);

    // Verify chicken 1's record is deleted
    const deletedRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, eggRecord1.id))
      .execute();

    expect(deletedRecord).toHaveLength(0);

    // Verify chicken 2's record still exists
    const remainingRecord = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, eggRecord2.id))
      .execute();

    expect(remainingRecord).toHaveLength(1);
    expect(remainingRecord[0].chicken_id).toBe(chicken2.id);
  });
});
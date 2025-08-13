import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { deleteChicken } from '../handlers/delete_chicken';
import { eq } from 'drizzle-orm';

describe('deleteChicken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a chicken that exists', async () => {
    // Create a test chicken
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const chickenId = chickenResult[0].id;

    // Delete the chicken
    const result = await deleteChicken(chickenId);

    expect(result.success).toBe(true);

    // Verify chicken is deleted from database
    const chickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, chickenId))
      .execute();

    expect(chickens).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent chicken', async () => {
    const nonExistentId = 999;

    const result = await deleteChicken(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should cascade delete related egg records', async () => {
    // Create a test chicken
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Laying Hen',
        breed: 'Leghorn'
      })
      .returning()
      .execute();

    const chickenId = chickenResult[0].id;

    // Create multiple egg records for this chicken
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chickenId,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chickenId,
          date: '2024-01-02',
          quantity: 1
        },
        {
          chicken_id: chickenId,
          date: '2024-01-03',
          quantity: 3
        }
      ])
      .execute();

    // Verify egg records were created
    const eggRecordsBefore = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chickenId))
      .execute();

    expect(eggRecordsBefore).toHaveLength(3);

    // Delete the chicken
    const result = await deleteChicken(chickenId);

    expect(result.success).toBe(true);

    // Verify chicken is deleted
    const chickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, chickenId))
      .execute();

    expect(chickens).toHaveLength(0);

    // Verify all related egg records are also deleted
    const eggRecordsAfter = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chickenId))
      .execute();

    expect(eggRecordsAfter).toHaveLength(0);
  });

  it('should only delete the specified chicken and its records', async () => {
    // Create two test chickens
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

    const chicken1Id = chicken1Result[0].id;
    const chicken2Id = chicken2Result[0].id;

    // Create egg records for both chickens
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken1Id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken2Id,
          date: '2024-01-01',
          quantity: 1
        }
      ])
      .execute();

    // Delete only chicken 1
    const result = await deleteChicken(chicken1Id);

    expect(result.success).toBe(true);

    // Verify chicken 1 is deleted
    const chicken1Records = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, chicken1Id))
      .execute();

    expect(chicken1Records).toHaveLength(0);

    // Verify chicken 2 still exists
    const chicken2Records = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, chicken2Id))
      .execute();

    expect(chicken2Records).toHaveLength(1);
    expect(chicken2Records[0].name).toBe('Chicken 2');

    // Verify chicken 1's egg records are deleted
    const chicken1EggRecords = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chicken1Id))
      .execute();

    expect(chicken1EggRecords).toHaveLength(0);

    // Verify chicken 2's egg records still exist
    const chicken2EggRecords = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chicken2Id))
      .execute();

    expect(chicken2EggRecords).toHaveLength(1);
  });

  it('should handle deletion when chicken has no egg records', async () => {
    // Create a test chicken without any egg records
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'New Chicken',
        breed: 'Buff Orpington'
      })
      .returning()
      .execute();

    const chickenId = chickenResult[0].id;

    // Delete the chicken
    const result = await deleteChicken(chickenId);

    expect(result.success).toBe(true);

    // Verify chicken is deleted
    const chickens = await db.select()
      .from(chickensTable)
      .where(eq(chickensTable.id, chickenId))
      .execute();

    expect(chickens).toHaveLength(0);
  });
});
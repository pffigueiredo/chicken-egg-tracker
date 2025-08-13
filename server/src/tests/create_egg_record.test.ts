import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { eggRecordsTable, chickensTable } from '../db/schema';
import { type CreateEggRecordInput } from '../schema';
import { createEggRecord } from '../handlers/create_egg_record';
import { eq } from 'drizzle-orm';

describe('createEggRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an egg record for an existing chicken', async () => {
    // Create a test chicken first
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Henrietta',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    const testInput: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-01-15',
      quantity: 2
    };

    const result = await createEggRecord(testInput);

    // Basic field validation
    expect(result.chicken_id).toEqual(chicken.id);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toEqual('2024-01-15T00:00:00.000Z');
    expect(result.quantity).toEqual(2);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save egg record to database', async () => {
    // Create a test chicken first
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Gertie',
        breed: 'Leghorn'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    const testInput: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-02-10',
      quantity: 1
    };

    const result = await createEggRecord(testInput);

    // Query database to verify record was saved
    const eggRecords = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, result.id))
      .execute();

    expect(eggRecords).toHaveLength(1);
    expect(eggRecords[0].chicken_id).toEqual(chicken.id);
    expect(eggRecords[0].date).toEqual('2024-02-10');
    expect(eggRecords[0].quantity).toEqual(1);
    expect(eggRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle zero quantity eggs', async () => {
    // Create a test chicken first
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Clucky',
        breed: 'Bantam'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    const testInput: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-03-01',
      quantity: 0
    };

    const result = await createEggRecord(testInput);

    expect(result.quantity).toEqual(0);
    expect(result.chicken_id).toEqual(chicken.id);
  });

  it('should throw error when chicken does not exist', async () => {
    const testInput: CreateEggRecordInput = {
      chicken_id: 9999, // Non-existent chicken ID
      date: '2024-01-15',
      quantity: 1
    };

    await expect(createEggRecord(testInput)).rejects.toThrow(/chicken with id 9999 does not exist/i);
  });

  it('should create multiple egg records for the same chicken', async () => {
    // Create a test chicken
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Matilda',
        breed: 'Buff Orpington'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    // Create first egg record
    const input1: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-01-01',
      quantity: 1
    };

    // Create second egg record
    const input2: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-01-02',
      quantity: 2
    };

    const result1 = await createEggRecord(input1);
    const result2 = await createEggRecord(input2);

    // Verify both records exist in database
    const allEggRecords = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.chicken_id, chicken.id))
      .execute();

    expect(allEggRecords).toHaveLength(2);
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.date.toISOString()).toEqual('2024-01-01T00:00:00.000Z');
    expect(result2.date.toISOString()).toEqual('2024-01-02T00:00:00.000Z');
  });

  it('should handle large egg quantities', async () => {
    // Create a test chicken
    const chickenResult = await db.insert(chickensTable)
      .values({
        name: 'Super Layer',
        breed: 'Production Red'
      })
      .returning()
      .execute();

    const chicken = chickenResult[0];

    const testInput: CreateEggRecordInput = {
      chicken_id: chicken.id,
      date: '2024-04-01',
      quantity: 100 // Large quantity
    };

    const result = await createEggRecord(testInput);

    expect(result.quantity).toEqual(100);
    expect(result.chicken_id).toEqual(chicken.id);
  });
});
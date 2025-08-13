import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { type UpdateEggRecordInput } from '../schema';
import { updateEggRecord } from '../handlers/update_egg_record';
import { eq } from 'drizzle-orm';

describe('updateEggRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testChickenId: number;
  let testEggRecordId: number;
  let alternativeChickenId: number;

  beforeEach(async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values([
        { name: 'Henrietta', breed: 'Rhode Island Red' },
        { name: 'Clucky', breed: 'Leghorn' }
      ])
      .returning()
      .execute();

    testChickenId = chickens[0].id;
    alternativeChickenId = chickens[1].id;

    // Create a test egg record
    const eggRecord = await db.insert(eggRecordsTable)
      .values({
        chicken_id: testChickenId,
        date: '2024-01-15',
        quantity: 2
      })
      .returning()
      .execute();

    testEggRecordId = eggRecord[0].id;
  });

  it('should update egg record quantity', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      quantity: 3
    };

    const result = await updateEggRecord(input);

    expect(result.id).toEqual(testEggRecordId);
    expect(result.quantity).toEqual(3);
    expect(result.chicken_id).toEqual(testChickenId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update egg record date', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      date: '2024-01-16'
    };

    const result = await updateEggRecord(input);

    expect(result.id).toEqual(testEggRecordId);
    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.quantity).toEqual(2);
    expect(result.chicken_id).toEqual(testChickenId);
  });

  it('should update egg record chicken_id', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      chicken_id: alternativeChickenId
    };

    const result = await updateEggRecord(input);

    expect(result.id).toEqual(testEggRecordId);
    expect(result.chicken_id).toEqual(alternativeChickenId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.quantity).toEqual(2);
  });

  it('should update multiple fields at once', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      chicken_id: alternativeChickenId,
      date: '2024-01-20',
      quantity: 5
    };

    const result = await updateEggRecord(input);

    expect(result.id).toEqual(testEggRecordId);
    expect(result.chicken_id).toEqual(alternativeChickenId);
    expect(result.date).toEqual(new Date('2024-01-20'));
    expect(result.quantity).toEqual(5);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes to database', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      quantity: 4,
      date: '2024-01-25'
    };

    await updateEggRecord(input);

    // Verify changes in database
    const records = await db.select()
      .from(eggRecordsTable)
      .where(eq(eggRecordsTable.id, testEggRecordId))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].quantity).toEqual(4);
    expect(records[0].date).toEqual('2024-01-25');
    expect(records[0].chicken_id).toEqual(testChickenId);
  });

  it('should throw error when egg record does not exist', async () => {
    const input: UpdateEggRecordInput = {
      id: 99999,
      quantity: 1
    };

    await expect(updateEggRecord(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when chicken_id does not exist', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      chicken_id: 99999
    };

    await expect(updateEggRecord(input)).rejects.toThrow(/chicken.*not found/i);
  });

  it('should update with zero quantity', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      quantity: 0
    };

    const result = await updateEggRecord(input);

    expect(result.quantity).toEqual(0);
    expect(result.id).toEqual(testEggRecordId);
  });

  it('should not modify fields that are not provided', async () => {
    const input: UpdateEggRecordInput = {
      id: testEggRecordId,
      quantity: 10
    };

    const result = await updateEggRecord(input);

    // Other fields should remain unchanged
    expect(result.chicken_id).toEqual(testChickenId);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.quantity).toEqual(10);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
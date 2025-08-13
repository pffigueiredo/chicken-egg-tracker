import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { type GetEggsByDateRangeInput } from '../schema';
import { getEggRecords, getEggRecordsByChicken } from '../handlers/get_egg_records';

describe('getEggRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all egg records when no filters provided', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create multiple egg records
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken.id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-02',
          quantity: 1
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-03',
          quantity: 3
        }
      ])
      .execute();

    const results = await getEggRecords();

    expect(results).toHaveLength(3);
    expect(results[0].chicken_id).toBe(chicken.id);
    expect(results[0].quantity).toBe(2);
    expect(results[0].date).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter egg records by start_date', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create egg records with different dates
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken.id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-05',
          quantity: 1
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-10',
          quantity: 3
        }
      ])
      .execute();

    const input: GetEggsByDateRangeInput = {
      start_date: '2024-01-05'
    };

    const results = await getEggRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(record => record.date >= new Date('2024-01-05'))).toBe(true);
  });

  it('should filter egg records by end_date', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create egg records with different dates
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken.id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-05',
          quantity: 1
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-10',
          quantity: 3
        }
      ])
      .execute();

    const input: GetEggsByDateRangeInput = {
      end_date: '2024-01-05'
    };

    const results = await getEggRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(record => record.date <= new Date('2024-01-05'))).toBe(true);
  });

  it('should filter egg records by date range', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create egg records with different dates
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken.id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-05',
          quantity: 1
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-10',
          quantity: 3
        },
        {
          chicken_id: chicken.id,
          date: '2024-01-15',
          quantity: 2
        }
      ])
      .execute();

    const input: GetEggsByDateRangeInput = {
      start_date: '2024-01-03',
      end_date: '2024-01-12'
    };

    const results = await getEggRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(record => 
      record.date >= new Date('2024-01-03') && 
      record.date <= new Date('2024-01-12')
    )).toBe(true);
  });

  it('should return empty array when no records match filter', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create egg record with specific date
    await db.insert(eggRecordsTable)
      .values({
        chicken_id: chicken.id,
        date: '2024-01-01',
        quantity: 2
      })
      .execute();

    const input: GetEggsByDateRangeInput = {
      start_date: '2024-02-01',
      end_date: '2024-02-28'
    };

    const results = await getEggRecords(input);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no records exist', async () => {
    const results = await getEggRecords();
    expect(results).toHaveLength(0);
  });
});

describe('getEggRecordsByChicken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all egg records for a specific chicken', async () => {
    // Create two test chickens
    const [chicken1] = await db.insert(chickensTable)
      .values({
        name: 'Chicken 1',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const [chicken2] = await db.insert(chickensTable)
      .values({
        name: 'Chicken 2',
        breed: 'Leghorn'
      })
      .returning()
      .execute();

    // Create egg records for both chickens
    await db.insert(eggRecordsTable)
      .values([
        {
          chicken_id: chicken1.id,
          date: '2024-01-01',
          quantity: 2
        },
        {
          chicken_id: chicken1.id,
          date: '2024-01-02',
          quantity: 1
        },
        {
          chicken_id: chicken2.id,
          date: '2024-01-01',
          quantity: 3
        }
      ])
      .execute();

    const results = await getEggRecordsByChicken(chicken1.id);

    expect(results).toHaveLength(2);
    expect(results.every(record => record.chicken_id === chicken1.id)).toBe(true);
    expect(results[0].date).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].quantity).toBe(2);
    expect(results[1].quantity).toBe(1);
  });

  it('should return empty array when chicken has no egg records', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Test Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    const results = await getEggRecordsByChicken(chicken.id);

    expect(results).toHaveLength(0);
  });

  it('should return empty array when chicken does not exist', async () => {
    const results = await getEggRecordsByChicken(999);

    expect(results).toHaveLength(0);
  });

  it('should handle multiple records for same chicken correctly', async () => {
    // Create test chicken
    const [chicken] = await db.insert(chickensTable)
      .values({
        name: 'Prolific Chicken',
        breed: 'Rhode Island Red'
      })
      .returning()
      .execute();

    // Create many egg records for the same chicken
    const eggRecords = [];
    for (let i = 1; i <= 5; i++) {
      eggRecords.push({
        chicken_id: chicken.id,
        date: `2024-01-${i.toString().padStart(2, '0')}`,
        quantity: i
      });
    }

    await db.insert(eggRecordsTable)
      .values(eggRecords)
      .execute();

    const results = await getEggRecordsByChicken(chicken.id);

    expect(results).toHaveLength(5);
    expect(results.every(record => record.chicken_id === chicken.id)).toBe(true);
    expect(results.map(r => r.quantity).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});
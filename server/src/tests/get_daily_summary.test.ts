import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { chickensTable, eggRecordsTable } from '../db/schema';
import { type GetDailySummaryInput } from '../schema';
import { getDailySummary, getRecentDailySummaries } from '../handlers/get_daily_summary';

// Test data
const testChickens = [
  { name: 'Henrietta', breed: 'Rhode Island Red' },
  { name: 'Clucky', breed: 'Leghorn' },
  { name: 'Feather', breed: 'Buff Orpington' }
];

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return summary for a specific date with eggs', async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values(testChickens)
      .returning()
      .execute();

    // Create egg records for 2024-01-15
    await db.insert(eggRecordsTable).values([
      { chicken_id: chickens[0].id, date: '2024-01-15', quantity: 2 },
      { chicken_id: chickens[1].id, date: '2024-01-15', quantity: 1 },
      { chicken_id: chickens[2].id, date: '2024-01-15', quantity: 3 }
    ]).execute();

    const input: GetDailySummaryInput = { date: '2024-01-15' };
    const result = await getDailySummary(input);

    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.total_eggs).toEqual(6);
    expect(result.chickens_laid).toEqual(3);
  });

  it('should return zero values for date with no eggs', async () => {
    const input: GetDailySummaryInput = { date: '2024-01-16' };
    const result = await getDailySummary(input);

    expect(result.date).toEqual(new Date('2024-01-16'));
    expect(result.total_eggs).toEqual(0);
    expect(result.chickens_laid).toEqual(0);
  });

  it('should handle date with partial chicken participation', async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values(testChickens)
      .returning()
      .execute();

    // Only 2 out of 3 chickens laid eggs on this date
    await db.insert(eggRecordsTable).values([
      { chicken_id: chickens[0].id, date: '2024-01-17', quantity: 1 },
      { chicken_id: chickens[2].id, date: '2024-01-17', quantity: 2 }
    ]).execute();

    const input: GetDailySummaryInput = { date: '2024-01-17' };
    const result = await getDailySummary(input);

    expect(result.date).toEqual(new Date('2024-01-17'));
    expect(result.total_eggs).toEqual(3);
    expect(result.chickens_laid).toEqual(2);
  });

  it('should handle chicken laying multiple times in one day', async () => {
    // Create test chicken
    const chickens = await db.insert(chickensTable)
      .values([testChickens[0]])
      .returning()
      .execute();

    // Same chicken has multiple records for the same date
    await db.insert(eggRecordsTable).values([
      { chicken_id: chickens[0].id, date: '2024-01-18', quantity: 1 },
      { chicken_id: chickens[0].id, date: '2024-01-18', quantity: 2 }
    ]).execute();

    const input: GetDailySummaryInput = { date: '2024-01-18' };
    const result = await getDailySummary(input);

    expect(result.date).toEqual(new Date('2024-01-18'));
    expect(result.total_eggs).toEqual(3);
    expect(result.chickens_laid).toEqual(1); // Only 1 distinct chicken
  });
});

describe('getRecentDailySummaries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return recent summaries ordered by date descending', async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values(testChickens)
      .returning()
      .execute();

    // Create egg records for multiple recent days
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    await db.insert(eggRecordsTable).values([
      // Today
      { chicken_id: chickens[0].id, date: todayStr, quantity: 1 },
      { chicken_id: chickens[1].id, date: todayStr, quantity: 2 },
      // Yesterday  
      { chicken_id: chickens[0].id, date: yesterdayStr, quantity: 3 },
      // Two days ago
      { chicken_id: chickens[2].id, date: twoDaysAgoStr, quantity: 1 }
    ]).execute();

    const results = await getRecentDailySummaries(7);

    expect(results).toHaveLength(3);
    
    // Should be ordered by date descending (most recent first)
    expect(results[0].date.toISOString().split('T')[0]).toEqual(todayStr);
    expect(results[0].total_eggs).toEqual(3);
    expect(results[0].chickens_laid).toEqual(2);

    expect(results[1].date.toISOString().split('T')[0]).toEqual(yesterdayStr);
    expect(results[1].total_eggs).toEqual(3);
    expect(results[1].chickens_laid).toEqual(1);

    expect(results[2].date.toISOString().split('T')[0]).toEqual(twoDaysAgoStr);
    expect(results[2].total_eggs).toEqual(1);
    expect(results[2].chickens_laid).toEqual(1);
  });

  it('should return empty array when no recent data', async () => {
    const results = await getRecentDailySummaries(7);
    expect(results).toHaveLength(0);
  });

  it('should limit results to specified number of days', async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values([testChickens[0]])
      .returning()
      .execute();

    // Create egg records for 10 days ago (outside the 7-day range)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    const tenDaysAgoStr = tenDaysAgo.toISOString().split('T')[0];

    // And 3 days ago (within the 7-day range)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    await db.insert(eggRecordsTable).values([
      { chicken_id: chickens[0].id, date: tenDaysAgoStr, quantity: 5 }, // Should not appear
      { chicken_id: chickens[0].id, date: threeDaysAgoStr, quantity: 2 }  // Should appear
    ]).execute();

    const results = await getRecentDailySummaries(7);

    expect(results).toHaveLength(1);
    expect(results[0].date.toISOString().split('T')[0]).toEqual(threeDaysAgoStr);
    expect(results[0].total_eggs).toEqual(2);
  });

  it('should handle custom days parameter', async () => {
    // Create test chickens
    const chickens = await db.insert(chickensTable)
      .values([testChickens[0]])
      .returning()
      .execute();

    // Create records for today and yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    await db.insert(eggRecordsTable).values([
      { chicken_id: chickens[0].id, date: todayStr, quantity: 1 },
      { chicken_id: chickens[0].id, date: yesterdayStr, quantity: 2 },
      { chicken_id: chickens[0].id, date: twoDaysAgoStr, quantity: 3 }
    ]).execute();

    // Get only last 2 days
    const results = await getRecentDailySummaries(2);

    expect(results).toHaveLength(2);
    expect(results[0].date.toISOString().split('T')[0]).toEqual(todayStr);
    expect(results[1].date.toISOString().split('T')[0]).toEqual(yesterdayStr);
  });
});